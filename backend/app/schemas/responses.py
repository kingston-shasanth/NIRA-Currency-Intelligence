"""Pydantic response and request schemas for DRISHTI AI API."""

from __future__ import annotations

from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


# ---------------------------------------------------------------------------
# Health
# ---------------------------------------------------------------------------

class HealthResponse(BaseModel):
    status: str = Field(..., examples=["ok"])
    timestamp: str
    version: str = Field(default="0.2.0")
    device: str = "cpu"
    gpu_available: bool = False
    gpu_name: Optional[str] = None


# ---------------------------------------------------------------------------
# Model status
# ---------------------------------------------------------------------------

class ModelStatusResponse(BaseModel):
    loaded: bool = False
    checkpoint_exists: bool = False
    device: str = "cpu"
    gpu_name: Optional[str] = None
    model_name: Optional[str] = None
    architecture: str = "ResNet-50"
    num_classes: Optional[int] = None
    classes: Optional[List[str]] = None
    checkpoint_path: Optional[str] = None
    val_accuracy: Optional[float] = None
    best_epoch: Optional[int] = None
    message: str = "No trained model is loaded. Train the model in Phase 2."


# ---------------------------------------------------------------------------
# Metrics summary
# ---------------------------------------------------------------------------

class MetricsSummaryResponse(BaseModel):
    available: bool = False
    total_recognitions: int = 0
    recognized_count: Optional[int] = 0
    rejected_count: Optional[int] = 0
    total_recognized_value: Optional[float] = 0.0
    average_confidence: Optional[float] = None
    average_latency_ms: Optional[float] = None
    model_accuracy: Optional[float] = None
    macro_f1: Optional[float] = None
    confusion_matrix: Optional[List[List[int]]] = None
    per_class_metrics: Optional[Dict[str, Any]] = None
    training_history: Optional[List[Dict[str, Any]]] = None
    classes: Optional[List[str]] = None
    message: str = "Metrics loaded from empirical SQLite history and evaluation artifacts."


# ---------------------------------------------------------------------------
# Recognition history
# ---------------------------------------------------------------------------

class RecognitionRecord(BaseModel):
    id: str
    timestamp: str
    image_filename: str
    predicted_denomination: Optional[str] = None
    confidence: Optional[float] = None
    inference_ms: Optional[float] = None
    device: Optional[str] = None
    alternatives: Optional[List[Dict[str, Any]]] = None
    has_gradcam: Optional[bool] = False
    currency_type: Optional[str] = "banknote"
    safety_status: Optional[str] = "active_circulation"
    safety_concern: Optional[bool] = False


class HistoryResponse(BaseModel):
    records: List[RecognitionRecord] = Field(default_factory=list)
    total: int = 0
    message: str = "No recognition records yet."


# ---------------------------------------------------------------------------
# Prediction & Explanation
# ---------------------------------------------------------------------------

class AlternativeScore(BaseModel):
    label: str
    score: float


class PredictionResponse(BaseModel):
    success: bool = True
    predicted_denomination: str
    currency_type: str = "banknote"
    confidence: float
    confidence_percentage: str
    inference_ms: float
    device: str
    alternatives: List[AlternativeScore] = Field(default_factory=list)
    gradcam_base64: Optional[str] = None
    is_low_confidence: bool = False
    is_currency: bool = True
    orientation_detected: Optional[str] = "0° (Normal)"
    rejected: bool = False
    rejection_reason: Optional[str] = None
    record_id: Optional[str] = None
    message: str = "Denomination classified successfully."
    guidance_message: Optional[str] = None
    image_quality: Optional[Dict[str, Any]] = None
    safety_check: Optional[Dict[str, Any]] = None
    backend_processing_ms: Optional[float] = None


# ---------------------------------------------------------------------------
# Sourced RBI Currency Status
# ---------------------------------------------------------------------------

class CurrencyStatusResponse(BaseModel):
    denomination: str
    currency_type: str
    series: Optional[str] = None
    legal_tender: bool = True
    circulation_status: str
    status_label: str
    base_color: Optional[str] = None
    dimensions_mm: Optional[str] = None
    reverse_motif: Optional[str] = None
    legal_basis: Optional[str] = None
    rbi_summary: str
    physical_security_features: List[str] = Field(default_factory=list)
    tactile_features_visually_impaired: Optional[str] = None
    authenticity_advisory: str
    checked_date: str
