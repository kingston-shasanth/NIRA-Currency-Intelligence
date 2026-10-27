"""Model service managing checkpoint loading, CUDA acceleration, and inference."""

from __future__ import annotations

import io
import json
import time
from pathlib import Path
from typing import Any, Dict, List, Optional

from PIL import Image

from app.database.db import save_recognition
from app.schemas.responses import ModelStatusResponse, PredictionResponse
from app.services.image_quality import assess_image_quality
from app.services.currency_status import build_safety_check

ARTIFACTS_DIR = Path(__file__).resolve().parent.parent.parent.parent / "artifacts"
REGISTRY_PATH = ARTIFACTS_DIR / "model_registry.json"
CHECKPOINT_PATH = ARTIFACTS_DIR / "best_model.pth"
METADATA_PATH = ARTIFACTS_DIR / "checkpoint_metadata.json"
CLASSES_PATH = ARTIFACTS_DIR / "classes.json"


class ModelService:
    """Manages ResNet-50 loading, device detection, and prediction orchestration."""

    def __init__(self) -> None:
        self._classifier: Any = None
        self._init_classifier()

    def _get_active_checkpoint_path(self) -> Path:
        """Resolve active checkpoint from registry or fallback to best_model.pth."""
        if REGISTRY_PATH.exists():
            try:
                with open(REGISTRY_PATH, "r", encoding="utf-8") as f:
                    reg = json.load(f)
                    active = reg.get("active_model")
                    if active and Path(active).exists():
                        return Path(active)
            except Exception:
                pass
        return CHECKPOINT_PATH

    def _init_classifier(self) -> None:
        """Attempt to instantiate the ML classifier if checkpoint exists."""
        ckpt = self._get_active_checkpoint_path()
        try:
            from ml.inference import CurrencyClassifier
            self._classifier = CurrencyClassifier(checkpoint_path=ckpt)
        except Exception:
            self._classifier = None

    def reload(self) -> ModelStatusResponse:
        """Force re-initialization of the classifier from the active checkpoint."""
        self._init_classifier()
        return self.get_status()

    def get_status(self) -> ModelStatusResponse:
        """Inspect actual model readiness, hardware device, and checkpoint status."""
        import torch

        cuda_available = torch.cuda.is_available()
        gpu_name = torch.cuda.get_device_name(0) if cuda_available else None
        device_str = f"cuda:0 ({gpu_name})" if cuda_available else "cpu"

        checkpoint_exists = CHECKPOINT_PATH.exists()
        val_acc = None
        best_epoch = None
        classes = None
        architecture = "ResNet-18"

        if METADATA_PATH.exists():
            try:
                with open(METADATA_PATH, "r", encoding="utf-8") as f:
                    meta = json.load(f)
                    val_acc = meta.get("best_val_accuracy")
                    best_epoch = meta.get("best_epoch")
                    classes = meta.get("classes")
                    architecture = meta.get("architecture", "ResNet-18")
            except Exception:
                pass

        if classes is None and CLASSES_PATH.exists():
            try:
                with open(CLASSES_PATH, "r", encoding="utf-8") as f:
                    classes = json.load(f)
            except Exception:
                pass

        loaded = False
        if self._classifier is not None and self._classifier.is_loaded:
            loaded = True
            msg = f"{architecture} model active on {device_str}. Ready for banknote and coin inference."
        elif checkpoint_exists:
            # Checkpoint exists, reload attempt
            self._init_classifier()
            loaded = self._classifier is not None and self._classifier.is_loaded
            msg = (
                f"{architecture} model active on {device_str}."
                if loaded
                else f"Checkpoint exists at artifacts/best_model.pth but failed to load: {getattr(self._classifier, 'load_error', 'unknown error')}"
            )
        else:
            msg = (
                "No trained checkpoint found at artifacts/best_model.pth. "
                "Use the Model Workbench to audit and train on Indian currency notes and coins."
            )

        return ModelStatusResponse(
            loaded=loaded,
            checkpoint_exists=checkpoint_exists,
            device="cuda:0" if cuda_available else "cpu",
            gpu_name=gpu_name,
            model_name=f"drishti_{architecture.lower().replace('-', '_')}_inr_v1" if loaded else None,
            architecture=architecture,
            num_classes=len(classes) if classes else None,
            classes=classes,
            checkpoint_path=str(CHECKPOINT_PATH) if checkpoint_exists else None,
            val_accuracy=val_acc,
            best_epoch=best_epoch,
            message=msg,
        )

    def predict_image(
        self,
        image_bytes: bytes,
        filename: str = "capture.jpg",
        generate_gradcam: bool = False,
        mode: str = "auto",
        language: str = "en",
    ) -> PredictionResponse:
        """Run image quality analysis, classification, safety check, and persist to SQLite."""
        t_backend_start = time.perf_counter()
        # 1. Open and validate image with EXIF orientation correction
        try:
            image = Image.open(io.BytesIO(image_bytes))
            image.verify()
            image = Image.open(io.BytesIO(image_bytes))  # Reopen for pixel data
            from PIL import ImageOps
            image = ImageOps.exif_transpose(image)
        except Exception as e:
            raise ValueError(f"Invalid or corrupted image file: {str(e)}")

        # 2. Perform Image Quality Assessment & Voice-Guided Framing
        quality_report = assess_image_quality(image, expected_mode=mode, language=language)

        # 3. Check if model is loaded
        if self._classifier is None or not self._classifier.is_loaded:
            status = self.get_status()
            raise RuntimeError(
                f"Model is not loaded. {status.message}"
            )

        # 4. Perform prediction (Banknote-first baseline with isolated coin resolution pipeline)
        # Banknotes occupy 70-90% of the frame and are evaluated directly on the full image.
        # Coins in realistic camera captures occupy 20-50% of the frame and suffer from aspect-ratio
        # squashing and detail dilution if uncropped. When coin mode is selected, or when an initial
        # scan indicates a coin candidate or ambiguous evidence, coin-specific ROI extraction is invoked.
        if mode == "banknote":
            # Explicit Banknote mode: 100% baseline banknote path
            result = self._classifier.predict(image, generate_cam=generate_gradcam)
            active_quality = quality_report
        elif mode == "coin":
            # Explicit Coin mode: Dedicated coin ROI pipeline
            result = self._classifier.predict_coin(image, generate_cam=generate_gradcam)
            coin_roi_img = result.get("coin_roi_image", image)
            active_quality = assess_image_quality(coin_roi_img, expected_mode="coin", language=language)
        else:
            # Auto mode: Banknote-safe branch
            base_result = self._classifier.predict(image, generate_cam=False)
            base_denom = base_result["predicted_denomination"]
            base_conf = base_result["confidence"]
            base_logit = base_result.get("max_logit", 10.0)
            base_is_coin = "coin" in base_denom.lower()

            if not base_is_coin and base_conf >= 0.80 and base_logit >= 6.0:
                # Confirmed High-Confidence Banknote: 100% baseline path preserved
                if generate_gradcam:
                    result = self._classifier.predict(image, generate_cam=True)
                else:
                    result = base_result
                active_quality = quality_report
            else:
                # Coin candidate or uncertain full-frame evidence: Run isolated coin ROI extraction
                coin_result = self._classifier.predict_coin(image, generate_cam=generate_gradcam)
                coin_denom = coin_result["predicted_denomination"]
                coin_logit = coin_result.get("max_logit", 10.0)
                coin_is_coin = "coin" in coin_denom.lower()
                coin_roi_img = coin_result.get("coin_roi_image", image)

                # If coin ROI confirms a coin with genuine evidence (logit >= 6.0):
                if coin_is_coin and coin_logit >= 6.0:
                    result = coin_result
                    active_quality = assess_image_quality(coin_roi_img, expected_mode="coin", language=language)
                elif not base_is_coin and base_logit >= 6.0:
                    # Fallback to base banknote if base logit was valid
                    if generate_gradcam:
                        result = self._classifier.predict(image, generate_cam=True)
                    else:
                        result = base_result
                    active_quality = quality_report
                else:
                    # Select branch with stronger pre-softmax evidence
                    if coin_logit >= base_logit:
                        result = coin_result
                        active_quality = assess_image_quality(coin_roi_img, expected_mode="coin" if coin_is_coin else "auto", language=language)
                    else:
                        if generate_gradcam:
                            result = self._classifier.predict(image, generate_cam=True)
                        else:
                            result = base_result
                        active_quality = quality_report

        pred_denom = result["predicted_denomination"]
        conf = result["confidence"]
        inf_ms = result["inference_ms"]
        device_used = result["device"]
        alts = result["alternatives"]
        cam_b64 = result.get("gradcam_base64")

        # Currency type determination
        is_coin = "coin" in pred_denom.lower()
        currency_type = "coin" if is_coin else "banknote"

        # Calculate prediction margin (Top-1 score minus Top-2 score)
        second_conf = alts[0]["score"] if alts else 0.0
        score_margin = round(conf - second_conf, 4)

        # 5. Genuine Currency Candidate & Out-of-Distribution Rejection Gate
        # A conventional softmax classifier will choose a currency class even on hands, walls, or random objects.
        # We reject when:
        # A) Image quality analysis found no structural currency candidate (blank surface, extreme glare, dark, blur, hands, uniform surface)
        # B) Pre-softmax logit evidence is insufficient (< 6.0 indicates out-of-distribution textures where model features did not activate)
        # C) Overall confidence is below 0.50
        # D) Model is uncertain / top margin is ambiguous (< 0.18 margin with < 0.72 top confidence)
        # E) User explicitly selected banknote or coin mode, but detection contradicts mode with low certainty
        has_candidate = active_quality.get("has_currency_candidate", True)
        max_logit = result.get("max_logit", 10.0)
        is_mode_conflict = (mode == "banknote" and is_coin and conf < 0.85) or (mode == "coin" and not is_coin and conf < 0.85)

        is_rejected = False
        rejection_reason = None

        if not has_candidate:
            is_rejected = True
            rejection_reason = active_quality.get("candidate_reason") or "no_currency_candidate_detected"
        elif max_logit < 6.0:
            is_rejected = True
            rejection_reason = "insufficient_currency_evidence"
        elif conf < 0.50:
            is_rejected = True
            rejection_reason = "low_confidence_below_threshold"
        elif conf < 0.72 and score_margin < 0.18:
            is_rejected = True
            rejection_reason = "ambiguous_inter_class_entropy"
        elif is_mode_conflict:
            is_rejected = True
            rejection_reason = f"mode_mismatch_expected_{mode}"

        is_low = conf < 0.70 or is_rejected


        # Synthesize rejection voice guidance (aligned with Section 2.3)
        rejection_guidance_en = "I couldn't identify a currency note or coin. Please place the currency clearly in view and tap the screen to scan again."
        rejection_guidance_ta = "பண நோட்டையோ நாணயத்தையோ அடையாளம் காண முடியவில்லை. தயவுசெய்து பணத்தைத் தெளிவாகக் காட்டி, மீண்டும் ஸ்கேன் செய்யத் திரையைத் தட்டவும்."
        rejection_guidance_hi = "मैं नोट या सिक्के की पहचान नहीं कर पाया। कृपया मुद्रा को साफ़ तरीके से दिखाएँ और दोबारा स्कैन करने के लिए स्क्रीन पर टैप करें।"
        default_rejection_guidance = (
            rejection_guidance_ta if language == "ta" else (rejection_guidance_hi if language == "hi" else rejection_guidance_en)
        )

        if is_rejected:
            # Prefer specific actionable guidance from candidate gate if available
            if active_quality.get("guidance_message") and not active_quality.get("has_currency_candidate", True):
                effective_guidance = active_quality["guidance_message"]
            else:
                effective_guidance = default_rejection_guidance
        else:
            effective_guidance = active_quality["guidance_message"]

        effective_denom = "Uncertain / Non-Currency" if is_rejected else pred_denom

        # 6. Build Sourced Currency Safety Check (only for confirmed notes/coins)
        safety_check = None
        if not is_rejected:
            safety_check = build_safety_check(
                denomination=pred_denom,
                confidence=conf,
                image_quality=active_quality,
                language=language,
            )

        # 7. Save to SQLite history
        rec = save_recognition(
            image_filename=filename,
            predicted_denomination=effective_denom,
            confidence=conf if not is_rejected else round(conf * 0.5, 4),
            inference_ms=inf_ms,
            device=device_used,
            alternatives=alts,
            has_gradcam=bool(cam_b64) and not is_rejected,
            currency_type=currency_type,
            safety_status="rejected_non_currency" if is_rejected else (safety_check["circulation_status"] if safety_check else "active_circulation"),
            safety_concern=True if is_rejected else (safety_check["observable_anomaly_detected"] if safety_check else False),
        )

        type_label = "Coin" if is_coin else "Banknote"
        if is_rejected:
            msg = effective_guidance
        else:
            msg = (
                f"Detected {pred_denom} {type_label} with {conf * 100:.1f}% confidence."
                if not is_low
                else f"Low confidence detection: {pred_denom} ({conf * 100:.1f}%). {effective_guidance}"
            )

        orientation_detected = result.get("orientation_detected", "0° (Normal)")

        return PredictionResponse(
            success=True,
            predicted_denomination=effective_denom,
            currency_type=currency_type,
            confidence=conf,
            confidence_percentage=f"{conf * 100:.1f}%",
            inference_ms=inf_ms,
            device=device_used,
            orientation_detected=orientation_detected if not is_rejected else None,
            alternatives=alts,
            gradcam_base64=cam_b64 if not is_rejected else None,
            is_low_confidence=is_low,
            is_currency=not is_rejected,
            rejected=is_rejected,
            rejection_reason=rejection_reason,
            record_id=rec["id"],
            message=msg,
            guidance_message=effective_guidance,
            image_quality=active_quality,
            safety_check=safety_check,
            backend_processing_ms=round((time.perf_counter() - t_backend_start) * 1000.0, 1),
        )


# Singleton
model_service = ModelService()
