"""Metrics service loading real empirical training, evaluation, and usage metrics."""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any, Dict, Optional

from app.database.db import get_aggregate_stats
from app.schemas.responses import MetricsSummaryResponse

ARTIFACTS_DIR = Path(__file__).resolve().parent.parent.parent.parent / "artifacts"
EVAL_PATH = ARTIFACTS_DIR / "evaluation_metrics.json"
HISTORY_PATH = ARTIFACTS_DIR / "training_history.json"
CLASSES_PATH = ARTIFACTS_DIR / "classes.json"


class MetricsService:
    """Aggregates authentic telemetry from SQLite and evaluation artifacts."""

    def get_summary(self) -> MetricsSummaryResponse:
        # 1. Empirical recognition statistics from SQLite
        stats = get_aggregate_stats()
        total_rec = stats.get("total_recognitions", 0)
        rec_count = stats.get("recognized_count", 0)
        rej_count = stats.get("rejected_count", 0)
        total_val = stats.get("total_recognized_value", 0.0)
        avg_conf = stats.get("average_confidence")
        avg_latency = stats.get("average_latency_ms")

        # 2. Evaluation metrics from artifacts (if evaluation was performed)
        eval_metrics: Optional[Dict[str, Any]] = None
        if EVAL_PATH.exists():
            try:
                with open(EVAL_PATH, "r", encoding="utf-8") as f:
                    eval_metrics = json.load(f)
            except Exception:
                pass

        # 3. Training epoch history from artifacts
        train_history = None
        if HISTORY_PATH.exists():
            try:
                with open(HISTORY_PATH, "r", encoding="utf-8") as f:
                    train_history = json.load(f)
            except Exception:
                pass

        # 4. Classes
        classes = None
        if CLASSES_PATH.exists():
            try:
                with open(CLASSES_PATH, "r", encoding="utf-8") as f:
                    classes = json.load(f)
            except Exception:
                pass

        has_eval = eval_metrics is not None
        has_train = train_history is not None
        has_recognitions = total_rec > 0

        is_available = has_eval or has_train or has_recognitions

        acc = eval_metrics.get("overall_accuracy") if eval_metrics else None
        macro_f1 = eval_metrics.get("macro_f1") if eval_metrics else None
        cm = eval_metrics.get("confusion_matrix") if eval_metrics else None
        per_class = eval_metrics.get("per_class_metrics") if eval_metrics else None

        if is_available:
            msg = "Empirical evaluation and recognition metrics loaded from artifacts."
        else:
            msg = "Metrics will become available after model training and evaluation."

        return MetricsSummaryResponse(
            available=is_available,
            total_recognitions=total_rec,
            recognized_count=rec_count,
            rejected_count=rej_count,
            total_recognized_value=total_val,
            average_confidence=avg_conf,
            average_latency_ms=avg_latency,
            model_accuracy=acc,
            macro_f1=macro_f1,
            confusion_matrix=cm,
            per_class_metrics=per_class,
            training_history=train_history,
            classes=classes,
            message=msg,
        )


# Singleton
metrics_service = MetricsService()
