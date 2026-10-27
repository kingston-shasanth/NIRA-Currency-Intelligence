"""NIRA AI — Real-Phone Physical Currency Capture Evaluation Workflow.

Non-production offline evaluation harness for assessing genuine smartphone photographs
captured in the wild, isolated strictly from training and validation splits.
Does NOT write records to the production SQLite database (artifacts/drishti.db).
"""

from __future__ import annotations

import argparse
import io
import json
import os
import sys
import time
from collections import defaultdict
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

from PIL import Image
import numpy as np

# Configure console encoding
if sys.stdout.encoding != "utf-8":
    sys.stdout.reconfigure(encoding="utf-8")

ROOT_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT_DIR))
sys.path.insert(0, str(ROOT_DIR / "backend"))

from ml.coin_roi import extract_coin_roi
from ml.inference import CurrencyClassifier
from backend.app.services.image_quality import assess_image_quality


def evaluate_physical_captures(
    data_dir: Path,
    output_report_path: Optional[Path] = None,
    mode: str = "auto",
    language: str = "en",
) -> Dict[str, Any]:
    """Run offline evaluation on genuine smartphone captures without touching production database."""
    print("=" * 75)
    print("NIRA REAL-PHONE PHYSICAL CAPTURE EVALUATION HARNESS")
    print("=" * 75)
    print(f"Data Directory: {data_dir}")
    print(f"Evaluation Mode: {mode}")

    if not data_dir.exists():
        print(f"\n[!] Target data directory does not exist: {data_dir}")
        print("To evaluate physical phone captures, populate this directory with denomination folders:")
        print("  data/physical_test/")
        print("    ├── ₹1 Coin/          (*.jpg / *.png captures from phone)")
        print("    ├── ₹2 Coin/")
        print("    ├── ₹5 Coin/")
        print("    ├── ₹10 Coin/")
        print("    ├── ₹20 Coin/")
        print("    ├── ₹10/              (Banknotes)")
        print("    ├── ₹20/              ...")
        print("    └── Non-Currency/     (Desks, hands, paper, random surfaces)")
        return {
            "status": "dataset_missing",
            "message": f"Data directory {data_dir} does not exist. No images evaluated.",
            "total_images": 0,
        }

    classifier = CurrencyClassifier()
    canonical_classes = classifier.classes
    coin_classes = [c for c in canonical_classes if "Coin" in c]
    banknote_classes = [c for c in canonical_classes if "Coin" not in c]

    # Discover folders
    subdirs = [d for d in data_dir.iterdir() if d.is_dir()]
    if not subdirs:
        print(f"[!] No class subdirectories found in {data_dir}")
        return {"status": "no_subdirectories", "total_images": 0}

    results: List[Dict[str, Any]] = []
    confusion: Dict[str, Dict[str, int]] = defaultdict(lambda: defaultdict(int))
    category_metrics = {
        "coins": {"total": 0, "correct": 0, "rejected": 0},
        "banknotes": {"total": 0, "correct": 0, "rejected": 0},
        "non_currency": {"total": 0, "correctly_rejected": 0, "false_accept": 0},
    }

    t0_all = time.perf_counter()

    for folder in subdirs:
        true_label = folder.name
        is_negative = "non" in true_label.lower() or "negative" in true_label.lower()
        is_coin_class = "coin" in true_label.lower()
        is_banknote_class = not is_coin_class and not is_negative

        image_files = list(folder.glob("*.jpg")) + list(folder.glob("*.jpeg")) + list(folder.glob("*.png"))
        print(f"\nEvaluating class: {true_label} ({len(image_files)} images)...")

        for img_path in image_files:
            try:
                img = Image.open(img_path).convert("RGB")
            except Exception as e:
                print(f"  [!] Skipping corrupt image {img_path.name}: {e}")
                continue

            # Step 1: Base full-frame prediction
            t_start = time.perf_counter()
            base_res = classifier.predict(img, generate_cam=False)
            base_denom = base_res["predicted_denomination"]
            base_conf = base_res["confidence"]
            base_logit = base_res.get("max_logit", 10.0)
            base_is_coin = "coin" in base_denom.lower()

            quality_report = assess_image_quality(img, expected_mode=mode, language=language)

            # Step 2: Routing logic
            if mode == "banknote" or (mode == "auto" and not base_is_coin and base_conf >= 0.80 and base_logit >= 6.0):
                # Banknote path
                active_res = base_res
                active_quality = quality_report
                detected_type = "banknote"
                roi_applied = False
            else:
                # Coin path
                coin_res = classifier.predict_coin(img, generate_cam=False)
                coin_denom = coin_res["predicted_denomination"]
                coin_logit = coin_res.get("max_logit", 10.0)
                coin_is_coin = "coin" in coin_denom.lower()
                roi_img = coin_res.get("coin_roi_image", img)

                if coin_is_coin and coin_logit >= 6.0:
                    active_res = coin_res
                    active_quality = assess_image_quality(roi_img, expected_mode="coin", language=language)
                    detected_type = "coin"
                    roi_applied = True
                elif not base_is_coin and base_logit >= 6.0:
                    active_res = base_res
                    active_quality = quality_report
                    detected_type = "banknote"
                    roi_applied = False
                else:
                    if coin_logit >= base_logit:
                        active_res = coin_res
                        active_quality = assess_image_quality(roi_img, expected_mode="coin" if coin_is_coin else "auto", language=language)
                        detected_type = "coin" if coin_is_coin else "banknote"
                        roi_applied = True
                    else:
                        active_res = base_res
                        active_quality = quality_report
                        detected_type = "coin" if base_is_coin else "banknote"
                        roi_applied = False

            pred_denom = active_res["predicted_denomination"]
            conf = active_res["confidence"]
            max_logit = active_res.get("max_logit", 10.0)
            alts = active_res.get("alternatives", [])
            second_conf = alts[0]["score"] if alts else 0.0
            margin = round(conf - second_conf, 4)
            elapsed_ms = (time.perf_counter() - t_start) * 1000.0

            # Step 3: Rejection gate check
            has_candidate = active_quality.get("has_currency_candidate", True)
            is_rejected = False
            rejection_reason = None

            if not has_candidate:
                is_rejected = True
                rejection_reason = active_quality.get("candidate_reason") or "no_currency_candidate"
            elif max_logit < 6.0:
                is_rejected = True
                rejection_reason = "insufficient_currency_evidence"
            elif conf < 0.50:
                is_rejected = True
                rejection_reason = "low_confidence_below_threshold"
            elif conf < 0.72 and margin < 0.18:
                is_rejected = True
                rejection_reason = "ambiguous_inter_class_entropy"

            final_label = "Rejected" if is_rejected else pred_denom
            confusion[true_label][final_label] += 1

            if is_negative:
                category_metrics["non_currency"]["total"] += 1
                if is_rejected:
                    category_metrics["non_currency"]["correctly_rejected"] += 1
                else:
                    category_metrics["non_currency"]["false_accept"] += 1
            elif is_coin_class:
                category_metrics["coins"]["total"] += 1
                if is_rejected:
                    category_metrics["coins"]["rejected"] += 1
                elif pred_denom == true_label:
                    category_metrics["coins"]["correct"] += 1
            else:
                category_metrics["banknotes"]["total"] += 1
                if is_rejected:
                    category_metrics["banknotes"]["rejected"] += 1
                elif pred_denom == true_label:
                    category_metrics["banknotes"]["correct"] += 1

            results.append({
                "filename": img_path.name,
                "ground_truth": true_label,
                "predicted": pred_denom,
                "final_decision": final_label,
                "confidence": conf,
                "max_logit": max_logit,
                "score_margin": margin,
                "is_rejected": is_rejected,
                "rejection_reason": rejection_reason,
                "roi_applied": roi_applied,
                "inference_ms": round(elapsed_ms, 1),
            })

    total_time = time.perf_counter() - t0_all
    print("\n" + "=" * 75)
    print("PHYSICAL CAPTURE EVALUATION COMPLETE")
    print("=" * 75)
    print(f"Total captures evaluated: {len(results)} in {total_time:.2f}s")

    if category_metrics["banknotes"]["total"] > 0:
        bn_tot = category_metrics["banknotes"]["total"]
        bn_corr = category_metrics["banknotes"]["correct"]
        print(f"Banknote Accuracy: {bn_corr}/{bn_tot} ({bn_corr/bn_tot*100:.2f}%)")

    if category_metrics["coins"]["total"] > 0:
        c_tot = category_metrics["coins"]["total"]
        c_corr = category_metrics["coins"]["correct"]
        print(f"Coin Accuracy:     {c_corr}/{c_tot} ({c_corr/c_tot*100:.2f}%)")

    if category_metrics["non_currency"]["total"] > 0:
        nc_tot = category_metrics["non_currency"]["total"]
        nc_rej = category_metrics["non_currency"]["correctly_rejected"]
        print(f"Negative Rejection: {nc_rej}/{nc_tot} ({nc_rej/nc_tot*100:.2f}%)")

    summary = {
        "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
        "total_images": len(results),
        "category_metrics": category_metrics,
        "confusion_matrix": {k: dict(v) for k, v in confusion.items()},
        "records": results,
    }

    if output_report_path:
        output_report_path.parent.mkdir(parents=True, exist_ok=True)
        with open(output_report_path, "w", encoding="utf-8") as f:
            json.dump(summary, f, indent=2)
        print(f"[✓] Saved evaluation report to: {output_report_path}")

    return summary


def main():
    parser = argparse.ArgumentParser(description="Evaluate real-world smartphone captures of Indian currency.")
    parser.add_argument("--data_dir", type=str, default="data/physical_test", help="Path to physical photos directory")
    parser.add_argument("--output", type=str, default="artifacts/physical_evaluation_report.json", help="Report output path")
    parser.add_argument("--mode", type=str, default="auto", choices=["auto", "banknote", "coin"], help="Scan mode")
    parser.add_argument("--language", type=str, default="en", choices=["en", "ta", "hi"], help="Guidance language")
    args = parser.parse_args()

    evaluate_physical_captures(
        data_dir=Path(args.data_dir),
        output_report_path=Path(args.output),
        mode=args.mode,
        language=args.language,
    )


if __name__ == "__main__":
    main()
