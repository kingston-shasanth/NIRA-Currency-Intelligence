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
        # 4. Multi-stage Classification with Bounded Candidate Refinement
        # Banknotes occupy 70-90% of the frame and are evaluated directly on the full image.
        # Coins in realistic camera captures occupy 20-50% of the frame and benefit from
        # resolution-preserving ROI extraction.
        if mode == "banknote":
            # Explicit Banknote mode: direct full-frame evaluation
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
            base_margin = round(base_conf - (base_result["alternatives"][0]["score"] if base_result["alternatives"] else 0.0), 4)

            if not base_is_coin and base_conf >= 0.75 and base_logit >= 4.0 and base_margin >= 0.15:
                # Confirmed High-Confidence Banknote
                if generate_gradcam:
                    result = self._classifier.predict(image, generate_cam=True)
                else:
                    result = base_result
                active_quality = quality_report
            else:
                # Coin candidate or uncertain full-frame evidence: Run isolated coin ROI extraction
                coin_result = self._classifier.predict_coin(image, generate_cam=generate_gradcam)
                coin_denom = coin_result["predicted_denomination"]
                coin_conf = coin_result["confidence"]
                coin_logit = coin_result.get("max_logit", 10.0)
                coin_is_coin = "coin" in coin_denom.lower()
                coin_margin = round(coin_conf - (coin_result["alternatives"][0]["score"] if coin_result["alternatives"] else 0.0), 4)
                coin_roi_img = coin_result.get("coin_roi_image", image)

                # If coin ROI confirms a coin with genuine evidence:
                if coin_is_coin and coin_conf >= 0.75 and coin_logit >= 4.0 and coin_margin >= 0.15:
                    result = coin_result
                    active_quality = assess_image_quality(coin_roi_img, expected_mode="coin", language=language)
                elif not base_is_coin and base_logit >= 4.0 and base_conf >= 0.70:
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
        max_logit = result.get("max_logit", 10.0)

        # 5. Bounded Candidate Refinement for Marginal / Ambiguous Captures
        # If confidence or score margin is on the borderline on an elongated capture,
        # test a single bounded center-square crop before declaring uncertainty
        if (conf < 0.70 or score_margin < 0.16) and active_quality.get("has_currency_candidate", True):
            w, h = image.size
            aspect = max(w, h) / max(min(w, h), 1)
            if aspect > 1.25:
                side = min(w, h)
                x1 = (w - side) // 2
                y1 = (h - side) // 2
                center_crop_img = image.crop((x1, y1, x1 + side, y1 + side))
                retry_res = self._classifier.predict(center_crop_img, generate_cam=False)
                retry_conf = retry_res["confidence"]
                retry_logit = retry_res.get("max_logit", 0.0)
                retry_margin = round(retry_conf - (retry_res["alternatives"][0]["score"] if retry_res["alternatives"] else 0.0), 4)

                if retry_conf > conf and retry_conf >= 0.72 and retry_logit >= 4.0 and retry_margin >= 0.15:
                    result = retry_res
                    pred_denom = result["predicted_denomination"]
                    conf = result["confidence"]
                    alts = result["alternatives"]
                    second_conf = alts[0]["score"] if alts else 0.0
                    score_margin = round(conf - second_conf, 4)
                    max_logit = retry_logit
                    is_coin = "coin" in pred_denom.lower()
                    currency_type = "coin" if is_coin else "banknote"

        # 6. Genuine Currency Candidate & Calibrated Uncertainty Gate
        has_candidate = active_quality.get("has_currency_candidate", True)
        is_mode_conflict = (mode == "banknote" and is_coin and conf < 0.80) or (mode == "coin" and not is_coin and conf < 0.80)

        is_rejected = False
        rejection_reason = None

        if not has_candidate:
            is_rejected = True
            rejection_reason = active_quality.get("candidate_reason") or "no_currency_candidate_detected"
        elif max_logit < 3.8:
            is_rejected = True
            rejection_reason = "insufficient_currency_evidence"
        elif conf < 0.50:
            is_rejected = True
            rejection_reason = "low_confidence_below_threshold"
        elif conf < 0.55 and score_margin < 0.12:
            is_rejected = True
            rejection_reason = "ambiguous_inter_class_entropy"
        elif is_mode_conflict:
            is_rejected = True
            rejection_reason = f"mode_mismatch_expected_{mode}"

        is_low = conf < 0.70 or is_rejected

        # Synthesize concise, actionable voice guidance
        guidance_map = {
            "insufficient_illumination": {
                "en": "Lighting is too dark. Turn on torch or move to brighter light.",
                "ta": "வெளிச்சம் குறைவாக உள்ளது. டார்ச்சை ஆன் செய்யவும் அல்லது வெளிச்சத்திற்கு வரவும்.",
                "hi": "रोशनी बहुत कम है। टॉर्च चालू करें या रोशनी में आएं।",
            },
            "excessive_glare": {
                "en": "Too much glare on currency surface. Tilt phone slightly to reduce glare.",
                "ta": "அதிக வெளிச்சம் அல்லது பிரதிபலிப்பு உள்ளது. போனை லேசாக சாய்க்கவும்.",
                "hi": "नोट पर बहुत तेज चमक है। फोन को थोड़ा झुकाएं।",
            },
            "blurry_no_edges": {
                "en": "Image is blurry. Hold phone steady and scan again.",
                "ta": "படம் தெளிவாக இல்லை. போனை அசைக்காமல் பிடித்து மீண்டும் எடுக்கவும்.",
                "hi": "तस्वीर धुंधली है। फोन को स्थिर रखें और दोबारा प्रयास करें।",
            },
            "hand_skin_dominant": {
                "en": "Hand is blocking the view. Hold currency clearly in front of camera.",
                "ta": "கை பார்வையை மறைக்கிறது. பணத்தை கேமரா முன் தெளிவாகப் பிடிக்கவும்.",
                "hi": "हाथ दृश्य को रोक रहा है। मुद्रा को कैमरे के सामने स्पष्ट रूप से रखें।",
            },
            "uniform_surface_no_currency": {
                "en": "No currency detected. Place note or coin clearly in view and scan again.",
                "ta": "பணம் எதுவும் காணப்படவில்லை. நோட்டு அல்லது நாணயத்தை கேமரா முன் வைத்து மீண்டும் ஸ்கேன் செய்யவும்.",
                "hi": "कोई मुद्रा नहीं मिली। नोट या सिक्के को कैमरे के सामने रखकर दोबारा स्कैन करें।",
            },
            "blank_featureless_frame": {
                "en": "No currency in view. Place note or coin in the center and scan again.",
                "ta": "பணம் பார்வையில் இல்லை. பணத்தை நடுவில் வைத்து மீண்டும் ஸ்கேன் செய்யவும்.",
                "hi": "कोई मुद्रा दिखाई नहीं दे रही है। नोट या सिक्के को केंद्र में रखकर दोबारा स्कैन करें।",
            },
            "sensor_noise_no_structure": {
                "en": "Camera sensor static detected. Please point camera steadily at the currency.",
                "ta": "கேமரா நிலைத்தன்மை இல்லை. கேமராவை பணத்தின் மீது நிலையாகப் பிடிக்கவும்.",
                "hi": "कैमरा स्थिर नहीं है। कृपया कैमरे को मुद्रा पर स्थिर रखें।",
            },
            "uncertain_coin": {
                "en": "Uncertain coin denomination. Hold phone closer to the coin and scan again.",
                "ta": "நாணயத்தை உறுதிப்படுத்த முடியவில்லை. போனை நாணயத்திற்கு அருகில் பிடித்து மீண்டும் ஸ்கேன் செய்யவும்.",
                "hi": "सिक्के की पहचान अनिश्चित है। फोन को सिक्के के पास लाकर दोबारा स्कैन करें।",
            },
            "uncertain_banknote": {
                "en": "Uncertain banknote. Ensure the full note is visible and scan again.",
                "ta": "நோட்டை உறுதிப்படுத்த முடியவில்லை. முழு நோட்டும் தெரியுமாறு வைத்து மீண்டும் ஸ்கேன் செய்யவும்.",
                "hi": "नोट की पहचान अनिश्चित है। पूरा नोट कैमरे में दिखाएं और दोबारा स्कैन करें।",
            },
            "generic_uncertain": {
                "en": "I couldn't identify a currency note or coin. Please place currency clearly in view and scan again.",
                "ta": "பண நோட்டையோ நாணயத்தையோ அடையாளம் காண முடியவில்லை. தயவுசெய்து பணத்தைத் தெளிவாகக் காட்டி மீண்டும் ஸ்கேன் செய்யவும்.",
                "hi": "मैं नोट या सिक्के की पहचान नहीं कर पाया। कृपया मुद्रा को साफ़ तरीके से दिखाएँ और दोबारा स्कैन करें।",
            },
        }

        def get_guidance(key: str) -> str:
            sub = guidance_map.get(key, guidance_map["generic_uncertain"])
            return sub.get(language, sub["en"])

        if is_rejected:
            if rejection_reason in guidance_map:
                effective_guidance = get_guidance(rejection_reason)
            elif rejection_reason in ("insufficient_currency_evidence", "ambiguous_inter_class_entropy", "low_confidence_below_threshold"):
                effective_guidance = get_guidance("uncertain_coin" if currency_type == "coin" else "uncertain_banknote")
            elif active_quality.get("guidance_message") and not has_candidate:
                effective_guidance = active_quality["guidance_message"]
            else:
                effective_guidance = get_guidance("generic_uncertain")
        else:
            effective_guidance = active_quality.get("guidance_message") or "Currency framed properly."

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
