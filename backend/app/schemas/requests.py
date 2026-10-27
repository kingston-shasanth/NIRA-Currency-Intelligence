from __future__ import annotations

from typing import Optional
from pydantic import BaseModel, Field


class StartTrainingRequest(BaseModel):
    splits_dir: str = Field(default="data/splits", description="Directory holding train/val/test splits")
    epochs: int = Field(default=15, ge=1, le=100, description="Total training epochs")
    batch_size: int = Field(default=16, ge=1, le=64, description="Batch size (16 conservative for RTX 2050 4GB)")
    lr: float = Field(default=1e-4, ge=1e-6, le=1e-1, description="Initial learning rate")
    optimizer: str = Field(default="AdamW", description="Optimizer (AdamW, Adam, SGD)")
    patience: int = Field(default=5, ge=1, le=30, description="Early stopping patience")
    device: str = Field(default="cuda:0", description="Device (cuda:0 or cpu)")
    architecture: str = Field(default="ResNet-50", description="Architecture (ResNet-50, MobileNetV3-Large, EfficientNet-B0)")


class AuditDatasetRequest(BaseModel):
    dataset_path: str = Field(default="data/raw", description="Path to raw currency dataset directory")


class SplitDatasetRequest(BaseModel):
    raw_dir: str = Field(default="data/raw", description="Directory holding raw dataset folders")
    output_dir: str = Field(default="data/splits", description="Directory to write stratified splits")
    train_ratio: float = Field(default=0.70, ge=0.1, le=0.9)
    val_ratio: float = Field(default=0.15, ge=0.05, le=0.5)
    test_ratio: float = Field(default=0.15, ge=0.05, le=0.5)
    seed: int = Field(default=42)


class PromoteModelRequest(BaseModel):
    checkpoint_path: str = Field(..., description="Absolute or relative path to checkpoint to activate")


class EvaluateModelRequest(BaseModel):
    checkpoint_path: Optional[str] = Field(None, description="Optional checkpoint path, defaults to best_model.pth")
