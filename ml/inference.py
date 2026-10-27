"""DRISHTI AI — Real-Time ResNet-50 Currency Inference Engine.

Loads trained checkpoint, performs tensor transforms, executes high-speed inference
on NVIDIA RTX 2050 (or CPU fallback), and generates Grad-CAM explainability overlays.
"""

from __future__ import annotations

import json
import time
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

import torch
import torch.nn as nn
from PIL import Image

from ml.dataset import CANONICAL_CLASSES, get_transforms
from ml.gradcam import GradCAM
from ml.train import build_model

ARTIFACTS_DIR = Path(__file__).resolve().parent.parent / "artifacts"
DEFAULT_CHECKPOINT = ARTIFACTS_DIR / "best_model.pth"
CLASSES_FILE = ARTIFACTS_DIR / "classes.json"


class CurrencyClassifier:
    """Thread-safe inference and explainability engine."""

    def __init__(self, checkpoint_path: Optional[Path] = None, device_name: Optional[str] = None):
        self.checkpoint_path = checkpoint_path or DEFAULT_CHECKPOINT
        self.device = torch.device(
            device_name or ("cuda:0" if torch.cuda.is_available() else "cpu")
        )
        self.model: Optional[nn.Module] = None
        self.classes: List[str] = []
        self.transform = get_transforms(is_train=False)
        self.is_loaded = False
        self.load_error: Optional[str] = None

        self._load_model()

    def _load_model(self) -> None:
        """Attempt loading trained checkpoint from disk."""
        if not self.checkpoint_path.exists():
            self.is_loaded = False
            self.load_error = f"Checkpoint not found at {self.checkpoint_path}. Train the model in Phase 2."
            return

        try:
            checkpoint = torch.load(
                self.checkpoint_path, map_location=self.device, weights_only=False
            )
            self.classes = checkpoint.get("classes") or self._load_fallback_classes()
            num_classes = len(self.classes)

            architecture = checkpoint.get("architecture", "ResNet-50")
            model = build_model(num_classes=num_classes, architecture=architecture, pretrained=False)
            model.load_state_dict(checkpoint["model_state_dict"])
            model.to(self.device)
            model.eval()

            self.model = model
            self.is_loaded = True
            self.load_error = None
            print(f"[*] CurrencyClassifier loaded on {self.device} with {num_classes} classes: {self.classes}")

        except Exception as e:
            self.is_loaded = False
            self.load_error = f"Failed to load checkpoint: {str(e)}"
            print(f"[!] {self.load_error}")

    def _load_fallback_classes(self) -> List[str]:
        if CLASSES_FILE.exists():
            try:
                with open(CLASSES_FILE, "r", encoding="utf-8") as f:
                    return json.load(f)
            except Exception:
                pass
        return CANONICAL_CLASSES

    def reload(self) -> bool:
        """Reload checkpoint (e.g. after a training run completes)."""
        self._load_model()
        return self.is_loaded

    def predict(
        self,
        image: Image.Image,
        generate_cam: bool = False,
    ) -> Dict[str, Any]:
        """Perform denomination prediction on a PIL Image with controlled multi-orientation evaluation."""
        if not self.is_loaded or self.model is None:
            raise RuntimeError(self.load_error or "Model is not loaded.")

        # 1. Base (0°) orientation evaluation with physical EXIF transpose
        from PIL import ImageOps
        transposed_img = ImageOps.exif_transpose(image)
        rgb_img = transposed_img.convert("RGB")
        input_tensor = self.transform(rgb_img).unsqueeze(0).to(self.device)

        t0 = time.perf_counter()
        with torch.no_grad():
            outputs = self.model(input_tensor)
            probabilities = nn.functional.softmax(outputs, dim=1).squeeze(0)

        top_k = min(len(self.classes), 4)
        scores, indices = torch.topk(probabilities, k=top_k)
        top_logits, _ = torch.topk(outputs.squeeze(0), k=top_k)
        max_logit = round(top_logits[0].item(), 2)
        logit_gap = round((top_logits[0] - top_logits[1]).item(), 2) if len(top_logits) > 1 else 0.0

        top_pred_idx = indices[0].item()
        top_denomination = self.classes[top_pred_idx]
        top_confidence = round(scores[0].item(), 4)
        second_confidence = round(scores[1].item(), 4) if len(scores) > 1 else 0.0
        score_margin = round(top_confidence - second_confidence, 4)

        orientation_detected = "0° (Normal)"
        active_img = rgb_img
        active_tensor = input_tensor

        # 2. Controlled rotation strategy for uncertain predictions only
        # If confidence is below 0.85 or score margin is below 0.20, check [180°, 90°, 270°]
        if top_confidence < 0.85 or score_margin < 0.20:
            candidate_angles = [180, 90, 270]
            rot_imgs = [rgb_img.rotate(angle, expand=True) for angle in candidate_angles]
            rot_tensors = torch.stack([self.transform(im) for im in rot_imgs]).to(self.device)

            with torch.no_grad():
                rot_outputs = self.model(rot_tensors)
                rot_probs = nn.functional.softmax(rot_outputs, dim=1)

            best_rot_idx = None
            best_rot_conf = top_confidence
            best_rot_angle = None

            for i, angle in enumerate(candidate_angles):
                p = rot_probs[i]
                cand_scores, cand_indices = torch.topk(p, k=top_k)
                cand_logits, _ = torch.topk(rot_outputs[i], k=top_k)
                cand_conf = round(cand_scores[0].item(), 4)
                cand_second = round(cand_scores[1].item(), 4) if len(cand_scores) > 1 else 0.0
                cand_margin = round(cand_conf - cand_second, 4)

                # Only adopt if candidate rotation has high confidence and strong margin
                if cand_conf > best_rot_conf and cand_conf >= 0.80 and cand_margin >= 0.18:
                    best_rot_conf = cand_conf
                    best_rot_idx = cand_indices[0].item()
                    best_rot_angle = angle
                    scores = cand_scores
                    indices = cand_indices
                    max_logit = round(cand_logits[0].item(), 2)
                    logit_gap = round((cand_logits[0] - cand_logits[1]).item(), 2) if len(cand_logits) > 1 else 0.0
                    active_img = rot_imgs[i]
                    active_tensor = rot_tensors[i].unsqueeze(0)

            if best_rot_idx is not None and best_rot_angle is not None:
                top_pred_idx = best_rot_idx
                top_denomination = self.classes[top_pred_idx]
                top_confidence = best_rot_conf
                angle_names = {180: "180° (Upside Down)", 90: "90° (Left Rotated)", 270: "270° (Right Rotated)"}
                orientation_detected = angle_names.get(best_rot_angle, f"{best_rot_angle}°")

        t_inference = (time.perf_counter() - t0) * 1000.0  # ms

        alternatives = [
            {"label": self.classes[idx.item()], "score": round(score.item(), 4)}
            for score, idx in zip(scores[1:], indices[1:])
        ]

        gradcam_b64: Optional[str] = None
        if generate_cam:
            try:
                with torch.enable_grad():
                    cam = GradCAM(self.model)
                    gradcam_b64 = cam.generate_overlay_base64(
                        raw_pil_image=active_img,
                        input_tensor=active_tensor.clone(),
                        target_class_idx=top_pred_idx,
                    )
                    cam.remove_hooks()
            except Exception as e:
                print(f"[!] Grad-CAM generation error: {e}")

        return {
            "predicted_denomination": top_denomination,
            "confidence": top_confidence,
            "inference_ms": round(t_inference, 1),
            "device": str(self.device),
            "orientation_detected": orientation_detected,
            "alternatives": alternatives,
            "gradcam_base64": gradcam_b64,
            "max_logit": max_logit,
            "logit_gap": logit_gap,
        }

    def predict_coin(
        self,
        image: Image.Image,
        generate_cam: bool = False,
    ) -> Dict[str, Any]:
        """Perform coin denomination prediction using resolution-preserving ROI extraction."""
        from ml.coin_roi import extract_coin_roi
        roi_img, bbox = extract_coin_roi(image)
        res = self.predict(roi_img, generate_cam=generate_cam)
        res["coin_roi_applied"] = bool(bbox is not None)
        res["coin_roi_bbox"] = bbox
        res["coin_roi_image"] = roi_img
        return res


# Singleton classifier instance for the backend
classifier = CurrencyClassifier()

