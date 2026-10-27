"""DRISHTI AI — Transfer Learning Model Training Pipeline.

Optimized for NVIDIA RTX 2050 (4 GB VRAM) with Automatic Mixed Precision (AMP),
class-aware weighted cross-entropy loss, Cosine Annealing LR scheduler,
early stopping, and checkpoint tracking.
"""

from __future__ import annotations

import argparse
import json
import sys
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, List, Optional, Tuple

import torch
import torch.nn as nn
from torch.optim import AdamW
from torch.optim.lr_scheduler import CosineAnnealingLR
from torchvision.models import (
    ResNet18_Weights,
    resnet18,
    ResNet50_Weights,
    resnet50,
    MobileNet_V3_Large_Weights,
    mobilenet_v3_large,
    EfficientNet_B0_Weights,
    efficientnet_b0,
)

if sys.stdout and hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
if sys.stderr and hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")

from ml.dataset import CANONICAL_CLASSES, get_data_loaders

ARTIFACTS_DIR = Path(__file__).resolve().parent.parent / "artifacts"


def build_model(
    num_classes: int,
    architecture: str = "ResNet-18",
    pretrained: bool = True,
) -> nn.Module:
    """Build backbone (ResNet-18, MobileNetV3-Large, or ResNet-50) with custom classification head."""
    arch_clean = architecture.strip().lower()

    if "mobilenet" in arch_clean:
        weights = MobileNet_V3_Large_Weights.DEFAULT if pretrained else None
        try:
            model = mobilenet_v3_large(weights=weights)
        except Exception as e:
            print(f"Warning: Could not load MobileNet weights ({e}). Initializing random weights.")
            model = mobilenet_v3_large(weights=None)
        in_features = model.classifier[-1].in_features
        model.classifier[-1] = nn.Sequential(
            nn.Dropout(p=0.3),
            nn.Linear(in_features, num_classes),
        )
        return model

    elif "resnet50" in arch_clean or "resnet-50" in arch_clean:
        weights = ResNet50_Weights.DEFAULT if pretrained else None
        try:
            model = resnet50(weights=weights)
        except Exception as e:
            print(f"Warning: Could not load ResNet-50 ImageNet weights ({e}). Initializing random weights.")
            model = resnet50(weights=None)

        in_features = model.fc.in_features  # 2048
        model.fc = nn.Sequential(
            nn.Dropout(p=0.3),
            nn.Linear(in_features, num_classes),
        )
        return model

    elif "efficientnet" in arch_clean:
        weights = EfficientNet_B0_Weights.DEFAULT if pretrained else None
        try:
            model = efficientnet_b0(weights=weights)
        except Exception as e:
            print(f"Warning: Could not load EfficientNet weights ({e}). Initializing random weights.")
            model = efficientnet_b0(weights=None)
        in_features = model.classifier[-1].in_features
        model.classifier[-1] = nn.Sequential(
            nn.Dropout(p=0.3),
            nn.Linear(in_features, num_classes),
        )
        return model

    else:
        # Default: ResNet-18 (Lightweight baseline for RTX 2050 4GB VRAM)
        weights = ResNet18_Weights.DEFAULT if pretrained else None
        try:
            model = resnet18(weights=weights)
        except Exception as e:
            print(f"Warning: Could not load ResNet-18 ImageNet weights ({e}). Initializing random weights.")
            model = resnet18(weights=None)

        in_features = model.fc.in_features  # 512
        model.fc = nn.Sequential(
            nn.Dropout(p=0.3),
            nn.Linear(in_features, num_classes),
        )
        return model


def train_epoch(
    model: nn.Module,
    loader: torch.utils.data.DataLoader,
    criterion: nn.Module,
    optimizer: torch.optim.Optimizer,
    scaler: torch.amp.GradScaler,
    device: torch.device,
) -> Tuple[float, float]:
    """Execute one training epoch using AMP."""
    model.train()
    running_loss = 0.0
    correct = 0
    total = 0

    use_cuda = device.type == "cuda"

    for images, targets in loader:
        images = images.to(device, non_blocking=True)
        targets = targets.to(device, non_blocking=True)

        optimizer.zero_grad(set_to_none=True)

        with torch.amp.autocast(device_type=device.type, enabled=use_cuda):
            outputs = model(images)
            loss = criterion(outputs, targets)

        if use_cuda:
            scaler.scale(loss).backward()
            scaler.step(optimizer)
            scaler.update()
        else:
            loss.backward()
            optimizer.step()

        running_loss += loss.item() * images.size(0)
        _, preds = outputs.max(1)
        correct += preds.eq(targets).sum().item()
        total += targets.size(0)

    epoch_loss = running_loss / max(1, total)
    epoch_acc = (correct / max(1, total)) * 100.0
    return epoch_loss, epoch_acc


@torch.no_grad()
def evaluate_epoch(
    model: nn.Module,
    loader: torch.utils.data.DataLoader,
    criterion: nn.Module,
    device: torch.device,
) -> Tuple[float, float]:
    """Execute validation pass without gradient tracking."""
    model.eval()
    running_loss = 0.0
    correct = 0
    total = 0

    use_cuda = device.type == "cuda"

    for images, targets in loader:
        images = images.to(device, non_blocking=True)
        targets = targets.to(device, non_blocking=True)

        with torch.amp.autocast(device_type=device.type, enabled=use_cuda):
            outputs = model(images)
            loss = criterion(outputs, targets)

        running_loss += loss.item() * images.size(0)
        _, preds = outputs.max(1)
        correct += preds.eq(targets).sum().item()
        total += targets.size(0)

    epoch_loss = running_loss / max(1, total)
    epoch_acc = (correct / max(1, total)) * 100.0
    return epoch_loss, epoch_acc


def run_training(
    splits_dir: Path = Path("data/splits"),
    epochs: int = 15,
    batch_size: int = 16,  # 16 fits safely inside RTX 2050 4GB VRAM
    lr: float = 1e-4,
    patience: int = 5,
    architecture: str = "ResNet-18",
    device_name: Optional[str] = None,
) -> Dict[str, any]:
    """Complete training orchestrator."""
    ARTIFACTS_DIR.mkdir(parents=True, exist_ok=True)

    # Device selection
    if device_name:
        device = torch.device(device_name)
    else:
        device = torch.device("cuda:0" if torch.cuda.is_available() else "cpu")

    gpu_name = torch.cuda.get_device_name(0) if device.type == "cuda" else "CPU"
    print(f"[*] Training on device: {device} ({gpu_name})")
    print(f"[*] Selected backbone architecture: {architecture}")

    # Load Data
    train_loader, val_loader, test_loader, classes = get_data_loaders(
        splits_dir=splits_dir, batch_size=batch_size
    )
    num_classes = len(classes)
    print(f"[*] Detected {num_classes} classes: {classes}")

    # Save class list
    classes_file = ARTIFACTS_DIR / "classes.json"
    with open(classes_file, "w", encoding="utf-8") as f:
        json.dump(classes, f, indent=2)

    # Class-aware weighted CrossEntropyLoss to address class imbalance
    meta_path = splits_dir / "splits_metadata.json"
    class_weights_tensor = None
    if meta_path.exists():
        try:
            with open(meta_path, "r", encoding="utf-8") as f:
                meta_data = json.load(f)
                weights_dict = meta_data.get("normalized_class_weights", {})
                w_list = [weights_dict.get(c, 1.0) for c in classes]
                class_weights_tensor = torch.tensor(w_list, dtype=torch.float, device=device)
                print(f"[*] Applied class-aware loss weights across {num_classes} classes:")
                for c, w in zip(classes, w_list):
                    print(f"    {c:16s}: {w:.4f}")
        except Exception as e:
            print(f"[*] Warning: Could not load class weights ({e}), using uniform loss.")

    # Build model
    model = build_model(num_classes=num_classes, architecture=architecture, pretrained=True).to(device)
    criterion = nn.CrossEntropyLoss(weight=class_weights_tensor)
    optimizer = AdamW(model.parameters(), lr=lr, weight_decay=1e-2)
    scheduler = CosineAnnealingLR(optimizer, T_max=epochs, eta_min=1e-6)
    scaler = torch.amp.GradScaler(enabled=(device.type == "cuda"))

    best_val_acc = 0.0
    best_val_loss = float("inf")
    best_epoch = 0
    patience_counter = 0

    history: List[Dict[str, any]] = []
    start_time = time.time()

    # Reset peak memory stats
    if device.type == "cuda":
        torch.cuda.reset_peak_memory_stats(device)

    print(f"[*] Commencing training for up to {epochs} epochs (Early stopping patience: {patience})...")

    for epoch in range(1, epochs + 1):
        t0 = time.time()
        train_loss, train_acc = train_epoch(model, train_loader, criterion, optimizer, scaler, device)
        val_loss, val_acc = evaluate_epoch(model, val_loader, criterion, device)
        scheduler.step()
        epoch_time = time.time() - t0

        vram_mb = None
        if device.type == "cuda":
            vram_mb = round(torch.cuda.max_memory_allocated(device) / (1024 * 1024), 1)

        record = {
            "epoch": epoch,
            "train_loss": round(train_loss, 4),
            "train_accuracy": round(train_acc, 2),
            "val_loss": round(val_loss, 4),
            "val_accuracy": round(val_acc, 2),
            "lr": round(optimizer.param_groups[0]["lr"], 6),
            "epoch_seconds": round(epoch_time, 2),
            "peak_vram_mb": vram_mb,
        }
        history.append(record)

        vram_str = f" | VRAM: {vram_mb} MB" if vram_mb else ""
        print(
            f"Epoch [{epoch:02d}/{epochs:02d}] "
            f"Train Loss: {train_loss:.4f} | Train Acc: {train_acc:.1f}% | "
            f"Val Loss: {val_loss:.4f} | Val Acc: {val_acc:.1f}%{vram_str} | ({epoch_time:.1f}s)"
        )

        # Checkpoint selection based on validation accuracy (and val_loss tiebreak)
        if val_acc > best_val_acc or (val_acc == best_val_acc and val_loss < best_val_loss):
            best_val_acc = val_acc
            best_val_loss = val_loss
            best_epoch = epoch
            patience_counter = 0

            checkpoint_path = ARTIFACTS_DIR / "best_model.pth"
            torch.save(
                {
                    "model_state_dict": model.state_dict(),
                    "classes": classes,
                    "num_classes": num_classes,
                    "architecture": architecture,
                    "val_accuracy": best_val_acc,
                    "val_loss": best_val_loss,
                    "epoch": epoch,
                },
                checkpoint_path,
            )
            print(f" -> Checkpoint saved (val acc: {best_val_acc:.2f}%, val loss: {best_val_loss:.4f}) at {checkpoint_path}")
        else:
            patience_counter += 1
            if patience_counter >= patience:
                print(f"[*] Early stopping triggered at epoch {epoch} (no improvement for {patience} epochs).")
                break

    total_duration = time.time() - start_time
    peak_vram = None
    if device.type == "cuda":
        peak_vram = round(torch.cuda.max_memory_allocated(device) / (1024 * 1024), 1)

    # Save training history
    history_file = ARTIFACTS_DIR / "training_history.json"
    with open(history_file, "w", encoding="utf-8") as f:
        json.dump(history, f, indent=2)

    # Save metadata
    metadata_file = ARTIFACTS_DIR / "checkpoint_metadata.json"
    metadata = {
        "model_name": f"drishti_{architecture.lower().replace('-', '_')}_inr_v1",
        "architecture": architecture,
        "device": str(device),
        "gpu_name": gpu_name,
        "peak_vram_mb": peak_vram,
        "best_epoch": best_epoch,
        "best_val_accuracy": round(best_val_acc, 2),
        "best_val_loss": round(best_val_loss, 4),
        "total_training_seconds": round(total_duration, 1),
        "total_epochs_run": len(history),
        "classes": classes,
        "num_classes": num_classes,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
    with open(metadata_file, "w", encoding="utf-8") as f:
        json.dump(metadata, f, indent=2)

    # Update model registry
    registry_file = ARTIFACTS_DIR / "model_registry.json"
    registry = {
        "active_model": str(ARTIFACTS_DIR / "best_model.pth"),
        "active_version": "v1.0.0",
        "architecture": architecture,
        "updated_at": datetime.now(timezone.utc).isoformat(),
        "history": [
            {
                "version": "v1.0.0",
                "checkpoint": str(ARTIFACTS_DIR / "best_model.pth"),
                "architecture": architecture,
                "best_val_accuracy": round(best_val_acc, 2),
                "classes": classes,
            }
        ],
    }
    with open(registry_file, "w", encoding="utf-8") as f:
        json.dump(registry, f, indent=2)

    print(
        f"\n[+] Training Complete! Total time: {total_duration:.1f}s | "
        f"Best Val Accuracy: {best_val_acc:.2f}% (Epoch {best_epoch}) | "
        f"Peak VRAM: {peak_vram or 'N/A'} MB"
    )
    return metadata


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="DRISHTI AI Model Training")
    parser.add_argument("--splits-dir", type=str, default="data/splits", help="Path to stratified splits")
    parser.add_argument("--epochs", type=int, default=15, help="Number of training epochs")
    parser.add_argument("--batch-size", type=int, default=16, help="Batch size (16 for RTX 2050 4GB VRAM)")
    parser.add_argument("--lr", type=float, default=1e-4, help="Learning rate")
    parser.add_argument("--patience", type=int, default=5, help="Early stopping patience")
    parser.add_argument("--architecture", type=str, default="ResNet-18", help="Backbone (ResNet-18 or MobileNetV3-Large)")
    parser.add_argument("--device", type=str, default=None, help="Device (e.g., cuda:0 or cpu)")
    args = parser.parse_args()

    run_training(
        splits_dir=Path(args.splits_dir),
        epochs=args.epochs,
        batch_size=args.batch_size,
        lr=args.lr,
        patience=args.patience,
        architecture=args.architecture,
        device_name=args.device,
    )
