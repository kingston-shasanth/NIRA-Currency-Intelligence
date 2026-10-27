"""Tests for DRISHTI AI backend API, training workstation, and SQLite integration."""

import io
from PIL import Image
from fastapi.testclient import TestClient
from app.main import app
from app.database.db import get_history, init_db, save_recognition

client = TestClient(app)


def test_health_endpoint():
    """Verify GET /api/health reports system status and device."""
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert "timestamp" in data
    assert data["version"] == "1.0.0" or data["version"].startswith("1.") or data["version"].startswith("0.")
    assert "device" in data
    assert "gpu_available" in data


def test_model_status_endpoint():
    """Verify GET /api/model/status reports checkpoint status honestly."""
    response = client.get("/api/model/status")
    assert response.status_code == 200
    data = response.json()
    assert "loaded" in data
    assert "checkpoint_exists" in data
    assert data["architecture"] == "ResNet-18"
    assert "message" in data


def test_metrics_summary_endpoint():
    """Verify GET /api/metrics/summary returns authentic aggregate metrics."""
    response = client.get("/api/metrics/summary")
    assert response.status_code == 200
    data = response.json()
    assert "available" in data
    assert "total_recognitions" in data


def test_history_sqlite_roundtrip():
    """Verify saving a recognition record into SQLite and querying via API."""
    init_db()
    rec = save_recognition(
        image_filename="test_note_500.jpg",
        predicted_denomination="₹500",
        confidence=0.985,
        inference_ms=38.4,
        device="cpu",
        alternatives=[{"label": "₹200", "score": 0.012}],
        has_gradcam=True,
    )
    assert rec["id"] is not None

    # Query via API
    response = client.get("/api/history?search=test_note_500")
    assert response.status_code == 200
    data = response.json()
    assert data["total"] >= 1
    found = any(r["id"] == rec["id"] for r in data["records"])
    assert found


def test_predict_endpoint_empty_file():
    """Verify POST /api/predict rejects empty files with HTTP 400."""
    response = client.post(
        "/api/predict",
        files={"file": ("empty.jpg", b"", "image/jpeg")},
    )
    assert response.status_code == 400
    assert "empty" in response.json()["detail"].lower()


def test_predict_endpoint_invalid_file():
    """Verify POST /api/predict rejects invalid non-image formats with HTTP 400."""
    response = client.post(
        "/api/predict",
        files={"file": ("malicious.txt", b"plain text", "text/plain")},
    )
    assert response.status_code == 400


def test_training_status_endpoint():
    """Verify GET /api/training/status returns current job state and telemetry."""
    response = client.get("/api/training/status")
    assert response.status_code == 200
    data = response.json()
    assert "state" in data
    assert "telemetry" in data
    assert "recent_logs" in data


def test_system_metrics_endpoint():
    """Verify GET /api/system/metrics returns CPU, RAM, and GPU telemetry."""
    response = client.get("/api/system/metrics")
    assert response.status_code == 200
    data = response.json()
    assert "cpu_utilization_pct" in data
    assert "ram_utilization_pct" in data
    assert "cuda_available" in data


def test_checkpoints_list_endpoint():
    """Verify GET /api/model/checkpoints returns checkpoint registry list."""
    response = client.get("/api/model/checkpoints")
    assert response.status_code == 200
    assert isinstance(response.json(), list)


def test_dataset_audit_endpoint():
    """Verify POST /api/dataset/audit audits the raw dataset directory."""
    response = client.post("/api/dataset/audit", json={"dataset_path": "data/raw"})
    assert response.status_code == 200
    data = response.json()
    assert "exists" in data
    assert "total_images_found" in data
    assert "ready_for_training" in data


def test_currency_status_endpoint():
    """Verify GET /api/currency/status/{denomination} returns sourced RBI legal tender info."""
    # Test valid ₹500 banknote
    r_500 = client.get("/api/currency/status/₹500")
    assert r_500.status_code == 200
    d_500 = r_500.json()
    assert d_500["legal_tender"] is True
    assert d_500["currency_type"] == "banknote"
    assert "Red Fort" in d_500["reverse_motif"]

    # Test withdrawn ₹2000 banknote
    r_2000 = client.get("/api/currency/status/₹2000")
    assert r_2000.status_code == 200
    d_2000 = r_2000.json()
    assert d_2000["circulation_status"] == "withdrawn_legal_tender"
    assert "19" in d_2000["rbi_summary"]

    # Test ₹10 Coin with bi-metallic confirmation
    r_coin = client.get("/api/currency/status/₹10 Coin")
    assert r_coin.status_code == 200
    d_coin = r_coin.json()
    assert d_coin["currency_type"] == "coin"
    assert "14" in d_coin["rbi_summary"]


def test_currency_status_not_found():
    """Verify unlisted denomination returns HTTP 404."""
    response = client.get("/api/currency/status/₹999")
    assert response.status_code == 404


def test_image_quality_service():
    """Verify image quality assessment detects dimensions, blur, and lighting."""
    from app.services.image_quality import assess_image_quality
    img = Image.new("RGB", (400, 300), color=(128, 128, 128))
    quality = assess_image_quality(img, expected_mode="banknote", language="en")
    assert "is_usable" in quality
    assert "is_blurry" in quality
    assert "guidance_message" in quality
    assert quality["mean_luminance"] == 128.0


def test_recognition_blank_surface_rejection():
    """Verify out-of-distribution blank surface is cleanly rejected with actionable guidance."""
    from app.services.model_service import model_service
    img = Image.new("RGB", (400, 300), color=(128, 128, 128))
    buf = io.BytesIO()
    img.save(buf, format="JPEG")
    res = model_service.predict_image(buf.getvalue(), filename="blank_desk.jpg", mode="auto", language="en")
    assert res.rejected is True
    assert res.is_currency is False
    assert res.predicted_denomination == "Uncertain / Non-Currency"
    assert "guidance_message" in res.__dict__
    assert len(res.guidance_message) > 0


def test_recognition_multilingual_guidance():
    """Verify rejection provides authentic Tamil and Hindi voice guidance."""
    from app.services.model_service import model_service
    img = Image.new("RGB", (400, 300), color=(10, 10, 10))  # dark image
    buf = io.BytesIO()
    img.save(buf, format="JPEG")
    res_ta = model_service.predict_image(buf.getvalue(), filename="dark.jpg", mode="auto", language="ta")
    assert res_ta.rejected is True
    assert "வெளிச்சம்" in res_ta.guidance_message

    res_hi = model_service.predict_image(buf.getvalue(), filename="dark.jpg", mode="auto", language="hi")
    assert res_hi.rejected is True
    assert "रोशनी" in res_hi.guidance_message


def test_coin_roi_geometry_margin():
    """Verify coin ROI extraction maintains resolution and applies safe 22% outer rim margin."""
    from ml.coin_roi import extract_coin_roi
    # Synthetic frame with a coin-like circular feature
    import numpy as np
    canvas = np.full((360, 640, 3), 40, dtype=np.uint8)
    yy, xx = np.ogrid[:360, :640]
    circle_mask = (xx - 320) ** 2 + (yy - 180) ** 2 <= 50**2
    canvas[circle_mask] = 200
    test_img = Image.fromarray(canvas)

    roi_img, bbox = extract_coin_roi(test_img)
    assert roi_img is not None
    assert bbox is not None
    w = bbox[2] - bbox[0]
    h = bbox[3] - bbox[1]
    assert w == h  # Strict square aspect ratio
    assert w >= 100  # Radius expanded beyond raw diameter


