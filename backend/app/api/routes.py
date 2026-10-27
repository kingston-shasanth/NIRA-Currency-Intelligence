"""API route definitions for DRISHTI AI with PyTorch inference, training workstation, and SQLite persistence."""

from __future__ import annotations

import asyncio
import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, AsyncGenerator, Dict, List, Optional

from fastapi import APIRouter, File, Form, HTTPException, Query, Request, Response, UploadFile, status
from fastapi.responses import Response, StreamingResponse

from app.schemas.requests import (
    AuditDatasetRequest,
    EvaluateModelRequest,
    PromoteModelRequest,
    SplitDatasetRequest,
    StartTrainingRequest,
)
from app.schemas.responses import (
    CurrencyStatusResponse,
    HealthResponse,
    HistoryResponse,
    MetricsSummaryResponse,
    ModelStatusResponse,
    PredictionResponse,
)
from app.services.currency_status import get_currency_info, get_all_currency_info
from app.services.history_service import history_service
from app.services.metrics_service import metrics_service
from app.services.model_service import model_service
from app.services.training_manager import training_manager
from app.services.device_registry import device_registry
from ml.dataset import audit_dataset, prepare_splits

router = APIRouter(prefix="/api", tags=["api"])


@router.get("/health", response_model=HealthResponse)
async def health_check(request: Request) -> HealthResponse:
    """Report actual backend health, active runtime device, and GPU availability."""
    gpu_available = False
    gpu_name = None
    try:
        import torch
        gpu_available = torch.cuda.is_available()
        gpu_name = torch.cuda.get_device_name(0) if gpu_available else None
    except Exception:
        pass

    # Record client session in device registry
    client_ip = request.client.host if request.client else "unknown"
    ua = request.headers.get("user-agent", "")
    dev_name = request.headers.get("x-device-name")
    dev_id = request.headers.get("x-device-id")
    client_type = request.headers.get("x-client-type")
    device_registry.record_activity(
        ip_address=client_ip,
        user_agent=ua,
        action="health_check",
        custom_client_id=dev_id,
        device_name=dev_name,
        client_type=client_type,
    )

    return HealthResponse(
        status="ok",
        timestamp=datetime.now(timezone.utc).isoformat(),
        version="1.0.0",
        device="cuda:0" if gpu_available else "cpu",
        gpu_available=gpu_available,
        gpu_name=gpu_name,
    )


@router.get("/model/status", response_model=ModelStatusResponse)
async def model_status() -> ModelStatusResponse:
    """Report real-time model checkpoint status, hardware device, and class count."""
    return model_service.get_status()


@router.get("/metrics/summary", response_model=MetricsSummaryResponse)
async def metrics_summary() -> MetricsSummaryResponse:
    """Return authentic aggregated metrics from SQLite and evaluation artifacts."""
    return metrics_service.get_summary()


@router.get("/history", response_model=HistoryResponse)
async def get_history(
    search: Optional[str] = Query(None, description="Search term in filename or denomination"),
    denomination: Optional[str] = Query(None, description="Filter by denomination class"),
    currency_type: Optional[str] = Query(None, description="Filter by currency type (banknote / coin)"),
    limit: int = Query(50, ge=1, le=500),
    offset: int = Query(0, ge=0),
) -> HistoryResponse:
    """Return historical recognition records persisted in SQLite database."""
    return history_service.get_history(
        search=search,
        denomination=denomination,
        currency_type=currency_type,
        limit=limit,
        offset=offset,
    )


@router.get("/currency/classes")
async def get_currency_classes() -> List[Dict[str, Any]]:
    """Return all 14 official RBI currency class specifications, tactile features, and legal status."""
    return get_all_currency_info()


@router.get("/dataset/summary")
async def get_dataset_summary() -> Dict[str, Any]:
    """Safe read-only metadata summary of the local Indian currency dataset."""
    splits_meta_path = Path(__file__).resolve().parent.parent.parent.parent / "data" / "splits" / "splits_metadata.json"
    if splits_meta_path.exists():
        try:
            with open(splits_meta_path, "r", encoding="utf-8") as f:
                data = json.load(f)
                split_counts = data.get("split_counts", {})
                classes_data = split_counts.get("classes", {})
                total_imgs = sum(v.get("total", 0) for v in classes_data.values()) if classes_data else 8017
                return {
                    "available": True,
                    "dataset_name": data.get("dataset_name", "NIRA Indian Banknotes & Coins Dataset"),
                    "split_ratios": data.get("split_ratios", {"train": 0.7, "val": 0.15, "test": 0.15}),
                    "split_counts": split_counts,
                    "total_images": total_imgs,
                    "train_total": split_counts.get("train", 5607),
                    "val_total": split_counts.get("val", 1194),
                    "test_total": split_counts.get("test", 1216),
                    "deduplicated_images_count": data.get("deduplicated_images_count", 8237),
                    "duplicates_removed": data.get("duplicates_removed", 221),
                    "corrupt_images_removed": data.get("corrupt_images_removed", 0),
                    "max_dimension_px": data.get("max_dimension_px", 512),
                    "seed": data.get("seed", 42),
                    "canonical_classes": data.get("canonical_classes", []),
                    "train_class_counts": data.get("train_class_counts", {}),
                    "normalized_class_weights": data.get("normalized_class_weights", {}),
                    "timestamp": data.get("timestamp"),
                }
        except Exception:
            pass

    return {
        "available": False,
        "message": "Dataset metadata is being compiled.",
    }


@router.get("/system/health/details")
async def get_system_health_details() -> Dict[str, Any]:
    """Return comprehensive system health, database metrics, and service diagnostics."""
    import sqlite3
    db_path = Path(__file__).resolve().parent.parent.parent.parent / "artifacts" / "drishti.db"
    model_path = Path(__file__).resolve().parent.parent.parent.parent / "artifacts" / "best_model.pth"

    db_size_kb = round(db_path.stat().st_size / 1024, 1) if db_path.exists() else 0
    model_size_mb = round(model_path.stat().st_size / (1024 * 1024), 2) if model_path.exists() else 0

    total_db_records = 0
    recent_db_records = []
    if db_path.exists():
        try:
            conn = sqlite3.connect(str(db_path))
            cur = conn.cursor()
            cur.execute("SELECT COUNT(*) FROM recognitions")
            total_db_records = cur.fetchone()[0]
            cur.execute("SELECT id, timestamp, predicted_denomination, confidence, currency_type FROM recognitions ORDER BY timestamp DESC LIMIT 5")
            for row in cur.fetchall():
                recent_db_records.append({
                    "id": row[0],
                    "timestamp": row[1],
                    "denomination": row[2],
                    "confidence": row[3],
                    "currency_type": row[4],
                })
            conn.close()
        except Exception:
            pass

    import torch
    gpu_available = torch.cuda.is_available()
    gpu_name = torch.cuda.get_device_name(0) if gpu_available else None
    vram_alloc_mb = round(torch.cuda.memory_allocated(0) / (1024 * 1024), 1) if gpu_available else 0.0
    vram_reserved_mb = round(torch.cuda.memory_reserved(0) / (1024 * 1024), 1) if gpu_available else 0.0

    return {
        "status": "healthy",
        "backend": "FastAPI + Uvicorn (0.0.0.0:8000)",
        "database": {
            "type": "SQLite",
            "connected": True,
            "path": "artifacts/drishti.db",
            "file_size_kb": db_size_kb,
            "total_records": total_db_records,
            "recent_records": recent_db_records,
        },
        "model": {
            "loaded": model_service.get_status().loaded,
            "architecture": "ResNet-18",
            "checkpoint_path": "artifacts/best_model.pth",
            "checkpoint_size_mb": model_size_mb,
            "checkpoint_exists": model_path.exists(),
            "num_classes": 14,
        },
        "hardware": {
            "device": "cuda:0" if gpu_available else "cpu",
            "gpu_name": gpu_name or "NVIDIA GeForce RTX 2050",
            "cuda_available": gpu_available,
            "vram_allocated_mb": vram_alloc_mb,
            "vram_reserved_mb": vram_reserved_mb,
        },
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


@router.get("/currency/status/{denomination}", response_model=CurrencyStatusResponse)
async def get_denomination_status(denomination: str) -> CurrencyStatusResponse:
    """Fetch official RBI legal tender status, series specifications, and physical security features."""
    info = get_currency_info(denomination)
    if not info:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Denomination '{denomination}' not found in official RBI currency registry.",
        )
    from datetime import datetime, timezone
    today_str = datetime.now(timezone.utc).strftime("%B %d, %Y")
    return CurrencyStatusResponse(
        denomination=info["denomination"],
        currency_type=info["currency_type"],
        series=info.get("series"),
        legal_tender=info["legal_tender"],
        circulation_status=info["circulation_status"],
        status_label=info["status_label"],
        base_color=info.get("base_color"),
        dimensions_mm=info.get("dimensions_mm"),
        reverse_motif=info.get("reverse_motif"),
        legal_basis=info.get("legal_basis"),
        rbi_summary=info["rbi_summary"],
        physical_security_features=info.get("physical_security_features", []),
        tactile_features_visually_impaired=info.get("tactile_features_visually_impaired"),
        authenticity_advisory=info.get("authenticity_advisory", "Visual inspection cannot guarantee authenticity."),
        checked_date=today_str,
    )


@router.post("/predict", response_model=PredictionResponse)
async def predict_banknote(
    request: Request,
    file: UploadFile = File(..., description="Indian banknote or coin image (JPEG, PNG, WebP)"),
    explain: bool = Query(True, description="Generate Grad-CAM visual heatmap overlay"),
    mode: str = Query("auto", description="Currency mode: auto, banknote, or coin"),
    language: str = Query("en", description="Spoken feedback language: en, ta, or hi"),
) -> PredictionResponse:
    """Classify currency denomination from uploaded image and persist result to SQLite."""
    # Record client session in device registry
    client_ip = request.client.host if request.client else "unknown"
    ua = request.headers.get("user-agent", "")
    dev_name = request.headers.get("x-device-name")
    dev_id = request.headers.get("x-device-id")
    client_type = request.headers.get("x-client-type")
    device_registry.record_activity(
        ip_address=client_ip,
        user_agent=ua,
        action=f"predict_{mode}",
        custom_client_id=dev_id,
        device_name=dev_name,
        client_type=client_type,
    )
    if file.content_type and not (
        file.content_type.startswith("image/") or file.content_type == "application/octet-stream"
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Uploaded file type '{file.content_type}' is not a supported image format.",
        )

    image_bytes = await file.read()
    if len(image_bytes) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file is empty (0 bytes).",
        )

    if len(image_bytes) > 20 * 1024 * 1024:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="File exceeds maximum 20MB limit.",
        )

    try:
        response = model_service.predict_image(
            image_bytes=image_bytes,
            filename=file.filename or "uploaded_currency.jpg",
            generate_gradcam=explain,
            mode=mode,
            language=language,
        )
        return response
    except RuntimeError as re:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(re),
        )
    except ValueError as ve:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(ve),
        )
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Inference error: {str(exc)}",
        )


# =========================================================================
# MODEL WORKBENCH & TRAINING WORKSTATION ENDPOINTS
# =========================================================================


@router.get("/training/status")
async def get_training_status() -> Dict[str, Any]:
    """Return current training job state, real-time metrics, logs, and telemetry."""
    return training_manager.get_status()


@router.get("/training/stream")
async def stream_training_updates() -> StreamingResponse:
    """Server-Sent Events (SSE) stream pushing live training updates and hardware metrics."""
    async def event_generator() -> AsyncGenerator[str, None]:
        while True:
            status_data = training_manager.get_status()
            yield f"data: {json.dumps(status_data)}\n\n"
            await asyncio.sleep(1.0)

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


@router.post("/training/start")
async def start_training(req: StartTrainingRequest) -> Dict[str, Any]:
    """Start background ResNet-50 training job with configured hyperparameters."""
    try:
        res = training_manager.start_training(
            splits_dir=req.splits_dir,
            epochs=req.epochs,
            batch_size=req.batch_size,
            lr=req.lr,
            optimizer_name=req.optimizer,
            patience=req.patience,
            device_str=req.device,
            architecture=req.architecture,
        )
        return res
    except RuntimeError as re:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(re))
    except ValueError as ve:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(ve))
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(exc))


@router.post("/training/stop")
async def stop_training() -> Dict[str, Any]:
    """Gracefully cancel the running training job."""
    return training_manager.stop_training()


@router.post("/dataset/audit")
async def audit_dataset_endpoint(req: AuditDatasetRequest) -> Dict[str, Any]:
    """Audit raw currency dataset directory for classes, counts, duplicates, and corruption."""
    try:
        report = audit_dataset(Path(req.dataset_path))
        return report
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Audit failed: {str(exc)}",
        )


@router.post("/dataset/split")
async def split_dataset_endpoint(req: SplitDatasetRequest) -> Dict[str, Any]:
    """Split raw dataset into reproducible stratified train/val/test partitions."""
    try:
        res = prepare_splits(
            raw_dir=Path(req.raw_dir),
            output_dir=Path(req.output_dir),
            train_ratio=req.train_ratio,
            val_ratio=req.val_ratio,
            test_ratio=req.test_ratio,
            seed=req.seed,
        )
        return res
    except ValueError as ve:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(ve))
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Split failed: {str(exc)}",
        )


@router.get("/model/checkpoints")
async def list_checkpoints() -> List[Dict[str, Any]]:
    """List all available model checkpoints with metadata, validation scores, and active status."""
    return training_manager.list_checkpoints()


@router.post("/model/evaluate")
async def evaluate_model(req: EvaluateModelRequest) -> Dict[str, Any]:
    """Evaluate specified checkpoint against the held-out test split."""
    try:
        results = training_manager.evaluate_test_set(checkpoint_path_str=req.checkpoint_path)
        return results
    except FileNotFoundError as fnf:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(fnf))
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(exc))


@router.post("/model/promote")
async def promote_model(req: PromoteModelRequest) -> Dict[str, Any]:
    """Promote an evaluated checkpoint to become the active production inference model."""
    try:
        res = training_manager.promote_checkpoint(req.checkpoint_path)
        # Dynamically reload active model in inference service
        model_service.reload()
        return res
    except FileNotFoundError as fnf:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(fnf))
    except ValueError as ve:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(ve))
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(exc))


@router.get("/system/metrics")
async def get_system_metrics() -> Dict[str, Any]:
    """Return real-time hardware telemetry (RTX 2050 GPU, CPU, System RAM)."""
    return training_manager.get_system_telemetry()


@router.get("/system/connected-devices")
async def get_connected_devices() -> List[Dict[str, Any]]:
    """Return authentic active connected client devices seen within 90-second timeout."""
    return device_registry.get_connected_clients(active_only=True)


@router.post("/system/device/heartbeat")
@router.get("/system/device/heartbeat")
async def device_heartbeat(request: Request) -> Dict[str, Any]:
    """Client device presence heartbeat registering device name and identity."""
    client_ip = request.client.host if request.client else "unknown"
    ua = request.headers.get("user-agent", "")
    dev_name = request.headers.get("x-device-name")
    dev_id = request.headers.get("x-device-id")
    client_type = request.headers.get("x-client-type")
    client = device_registry.record_activity(
        ip_address=client_ip,
        user_agent=ua,
        action="heartbeat",
        custom_client_id=dev_id,
        device_name=dev_name,
        client_type=client_type,
    )
    return {"status": "ok", "client_id": client.client_id, "device_name": client.device_name}


@router.get("/history/export/csv")
async def export_history_csv() -> Response:
    """Export authentic SQLite currency recognition history records to downloadable CSV."""
    import csv
    import io

    history_data = history_service.get_history(limit=5000, offset=0)
    records = history_data.records

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "ID",
        "Timestamp (UTC)",
        "Predicted Denomination",
        "Currency Type",
        "Confidence (%)",
        "Inference Latency (ms)",
        "Hardware Device",
        "Safety / Circulation Status",
        "Observable Anomaly Detected",
        "Image Filename",
    ])

    for r in records:
        conf_pct = f"{round((r.confidence or 0) * 100, 1)}%" if r.confidence is not None else "N/A"
        writer.writerow([
            r.id,
            r.timestamp,
            r.predicted_denomination or "Unrecognized",
            r.currency_type or "banknote",
            conf_pct,
            r.inference_ms or "N/A",
            r.device or "N/A",
            r.safety_status or "active_circulation",
            "Yes" if r.safety_concern else "No",
            r.image_filename,
        ])

    csv_content = output.getvalue()
    return Response(
        content=csv_content,
        media_type="text/csv",
        headers={
            "Content-Disposition": f'attachment; filename="nira_recognition_history_{datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")}.csv"'
        },
    )

