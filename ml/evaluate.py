"""DRISHTI AI — Model Evaluation & Academic Assessment Pipeline.

Evaluates trained checkpoint strictly on held-out test split.
Generates multi-class confusion matrix, per-class Precision/Recall/F1,
macro-F1, and stores results in artifacts/evaluation_metrics.json.
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Dict, List, Tuple

import torch
import torch.nn as nn
from torchvision.datasets import ImageFolder
from torch.utils.data import DataLoader

import sys

if sys.stdout and hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
if sys.stderr and hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")

from ml.dataset import get_transforms
from ml.train import build_model

ARTIFACTS_DIR = Path(__file__).resolve().parent.parent / "artifacts"


def compute_metrics(
    y_true: List[int],
    y_pred: List[int],
    classes: List[str],
) -> Dict[str, any]:
    """Compute confusion matrix, precision, recall, and F1 metrics."""
    n_classes = len(classes)
    # Initialize confusion matrix [actual][predicted]
    cm = [[0 for _ in range(n_classes)] for _ in range(n_classes)]
    for t, p in zip(y_true, y_pred):
        cm[t][p] += 1

    per_class = {}
    f1_list = []
    total_samples = len(y_true)

    for i, c_name in enumerate(classes):
        tp = cm[i][i]
        fp = sum(cm[row][i] for row in range(n_classes) if row != i)
        fn = sum(cm[i][col] for col in range(n_classes) if col != i)
        support = sum(cm[i][col] for col in range(n_classes))

        precision = tp / (tp + fp) if (tp + fp) > 0 else 0.0
        recall = tp / (tp + fn) if (tp + fn) > 0 else 0.0
        f1 = (
            2 * precision * recall / (precision + recall)
            if (precision + recall) > 0
            else 0.0
        )

        per_class[c_name] = {
            "precision": round(precision * 100, 2),
            "recall": round(recall * 100, 2),
            "f1_score": round(f1 * 100, 2),
            "support": support,
        }
        f1_list.append(f1)

    overall_acc = (
        sum(cm[i][i] for i in range(n_classes)) / total_samples * 100.0
        if total_samples > 0
        else 0.0
    )
    macro_f1 = sum(f1_list) / len(f1_list) * 100.0 if f1_list else 0.0

    return {
        "overall_accuracy": round(overall_acc, 2),
        "macro_f1": round(macro_f1, 2),
        "total_test_samples": total_samples,
        "classes": classes,
        "confusion_matrix": cm,
        "per_class_metrics": per_class,
    }


@torch.no_grad()
def evaluate_checkpoint(
    checkpoint_path: Path,
    test_dir: Path,
    device_name: str | None = None,
) -> Dict[str, any]:
    """Load checkpoint and evaluate on test directory."""
    if not checkpoint_path.exists():
        raise FileNotFoundError(f"Checkpoint not found at {checkpoint_path}. Train the model first.")

    if not test_dir.exists():
        raise FileNotFoundError(f"Test split not found at {test_dir}. Run dataset staging first.")

    device = torch.device(
        device_name or ("cuda:0" if torch.cuda.is_available() else "cpu")
    )
    print(f"[*] Running held-out test evaluation on {device}...")

    # Load checkpoint state
    checkpoint = torch.load(checkpoint_path, map_location=device, weights_only=False)
    classes = checkpoint.get("classes", [])
    num_classes = len(classes)
    architecture = checkpoint.get("architecture", "ResNet-18")

    model = build_model(num_classes=num_classes, architecture=architecture, pretrained=False)
    model.load_state_dict(checkpoint["model_state_dict"])
    model.to(device)
    model.eval()

    # Build test DataLoader
    test_ds = ImageFolder(str(test_dir), transform=get_transforms(is_train=False))
    test_loader = DataLoader(test_ds, batch_size=16, shuffle=False)

    y_true: List[int] = []
    y_pred: List[int] = []

    for images, targets in test_loader:
        images = images.to(device)
        outputs = model(images)
        _, preds = outputs.max(1)

        y_true.extend(targets.tolist())
        y_pred.extend(preds.cpu().tolist())

    metrics = compute_metrics(y_true, y_pred, classes)
    metrics["checkpoint_evaluated"] = str(checkpoint_path.name)
    metrics["device"] = str(device)

    # Save to artifacts
    output_path = ARTIFACTS_DIR / "evaluation_metrics.json"
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(metrics, f, indent=2)

    print(f"[*] Evaluation completed. Overall Accuracy: {metrics['overall_acc'] if 'overall_acc' in metrics else metrics['overall_accuracy']}%, Macro-F1: {metrics['macro_f1']}%.")
    print(f"[*] Results saved to {output_path}")
    return metrics


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="DRISHTI AI Model Evaluation")
    parser.add_argument("--checkpoint", type=str, default="artifacts/best_model.pth")
    parser.add_argument("--test-dir", type=str, default="data/splits/test")
    parser.add_argument("--device", type=str, default=None)
    args = parser.parse_args()

    evaluate_checkpoint(
        checkpoint_path=Path(args.checkpoint),
        test_dir=Path(args.test_dir),
        device_name=args.device,
    )
