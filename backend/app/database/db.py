"""SQLite database storage for DRISHTI AI recognition history."""

from __future__ import annotations

import json
import sqlite3
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional

# Database stored in artifacts directory so it persists and is gitignored
DB_DIR = Path(__file__).resolve().parent.parent.parent.parent / "artifacts"
DB_PATH = DB_DIR / "drishti.db"


def get_db_connection() -> sqlite3.Connection:
    """Create a database connection with dictionary-like row factory and concurrency timeout."""
    DB_DIR.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(str(DB_PATH), timeout=15.0, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn


def init_db() -> None:
    """Initialize SQLite database schema with safe migrations."""
    with get_db_connection() as conn:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS recognitions (
                id TEXT PRIMARY KEY,
                timestamp TEXT NOT NULL,
                image_filename TEXT NOT NULL,
                predicted_denomination TEXT NOT NULL,
                confidence REAL NOT NULL,
                inference_ms REAL NOT NULL,
                device TEXT NOT NULL,
                alternatives TEXT,
                has_gradcam INTEGER DEFAULT 0,
                currency_type TEXT DEFAULT 'banknote',
                safety_status TEXT DEFAULT 'active_circulation',
                safety_concern INTEGER DEFAULT 0
            )
            """
        )
        # Check and apply migrations if older table exists
        existing_cols = [row[1] for row in conn.execute("PRAGMA table_info(recognitions)").fetchall()]
        if "currency_type" not in existing_cols:
            conn.execute("ALTER TABLE recognitions ADD COLUMN currency_type TEXT DEFAULT 'banknote'")
        if "safety_status" not in existing_cols:
            conn.execute("ALTER TABLE recognitions ADD COLUMN safety_status TEXT DEFAULT 'active_circulation'")
        if "safety_concern" not in existing_cols:
            conn.execute("ALTER TABLE recognitions ADD COLUMN safety_concern INTEGER DEFAULT 0")

        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_timestamp ON recognitions (timestamp DESC)"
        )
        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_denomination ON recognitions (predicted_denomination)"
        )
        conn.commit()


def save_recognition(
    image_filename: str,
    predicted_denomination: str,
    confidence: float,
    inference_ms: float,
    device: str,
    alternatives: Optional[List[Dict[str, Any]]] = None,
    has_gradcam: bool = False,
    currency_type: str = "banknote",
    safety_status: str = "active_circulation",
    safety_concern: bool = False,
) -> Dict[str, Any]:
    """Persist a single recognition transaction with safety telemetry."""
    init_db()
    rec_id = str(uuid.uuid4())
    ts = datetime.now(timezone.utc).isoformat()
    alt_json = json.dumps(alternatives or [])

    with get_db_connection() as conn:
        conn.execute(
            """
            INSERT INTO recognitions (
                id, timestamp, image_filename, predicted_denomination,
                confidence, inference_ms, device, alternatives, has_gradcam,
                currency_type, safety_status, safety_concern
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                rec_id,
                ts,
                image_filename,
                predicted_denomination,
                confidence,
                inference_ms,
                device,
                alt_json,
                1 if has_gradcam else 0,
                currency_type,
                safety_status,
                1 if safety_concern else 0,
            ),
        )
        conn.commit()

    return {
        "id": rec_id,
        "timestamp": ts,
        "image_filename": image_filename,
        "predicted_denomination": predicted_denomination,
        "confidence": confidence,
        "inference_ms": inference_ms,
        "device": device,
        "alternatives": alternatives or [],
        "has_gradcam": has_gradcam,
        "currency_type": currency_type,
        "safety_status": safety_status,
        "safety_concern": safety_concern,
    }


def get_history(
    search: Optional[str] = None,
    denomination: Optional[str] = None,
    currency_type: Optional[str] = None,
    limit: int = 50,
    offset: int = 0,
) -> Dict[str, Any]:
    """Retrieve recognition history records with optional filters."""
    init_db()
    query = "SELECT * FROM recognitions WHERE 1=1"
    params: List[Any] = []

    if search:
        query += " AND (image_filename LIKE ? OR predicted_denomination LIKE ?)"
        params.extend([f"%{search}%", f"%{search}%"])

    if denomination and denomination != "All":
        query += " AND predicted_denomination = ?"
        params.append(denomination)

    if currency_type and currency_type != "All":
        if currency_type == "rejected":
            query += " AND (safety_status LIKE '%reject%' OR predicted_denomination LIKE '%Uncertain%')"
        elif currency_type == "banknote":
            query += " AND currency_type = 'banknote' AND safety_status NOT LIKE '%reject%' AND predicted_denomination NOT LIKE '%Uncertain%'"
        elif currency_type == "coin":
            query += " AND currency_type = 'coin' AND safety_status NOT LIKE '%reject%' AND predicted_denomination NOT LIKE '%Uncertain%'"
        else:
            query += " AND currency_type = ?"
            params.append(currency_type)

    count_query = query.replace("SELECT *", "SELECT COUNT(*)")
    with get_db_connection() as conn:
        total = conn.execute(count_query, params).fetchone()[0]

        query += " ORDER BY timestamp DESC LIMIT ? OFFSET ?"
        params.extend([limit, offset])

        rows = conn.execute(query, params).fetchall()

    records = []
    for r in rows:
        alt_raw = r["alternatives"]
        alts = []
        if alt_raw:
            try:
                alts = json.loads(alt_raw)
            except Exception:
                alts = []

        # Safe dictionary access with fallback for older rows
        keys = r.keys()
        c_type = r["currency_type"] if "currency_type" in keys else "banknote"
        s_status = r["safety_status"] if "safety_status" in keys else "active_circulation"
        s_concern = bool(r["safety_concern"]) if "safety_concern" in keys else False

        records.append(
            {
                "id": r["id"],
                "timestamp": r["timestamp"],
                "image_filename": r["image_filename"],
                "predicted_denomination": r["predicted_denomination"],
                "confidence": r["confidence"],
                "inference_ms": r["inference_ms"],
                "device": r["device"],
                "alternatives": alts,
                "has_gradcam": bool(r["has_gradcam"]),
                "currency_type": c_type or "banknote",
                "safety_status": s_status or "active_circulation",
                "safety_concern": s_concern,
            }
        )

    return {"records": records, "total": total}


def get_aggregate_stats() -> Dict[str, Any]:
    """Calculate empirical aggregates directly from SQLite history."""
    init_db()
    with get_db_connection() as conn:
        row = conn.execute(
            """
            SELECT 
                COUNT(*) as total_scans,
                SUM(CASE WHEN predicted_denomination NOT LIKE '%Uncertain%' AND predicted_denomination NOT LIKE '%Non-Currency%' THEN 1 ELSE 0 END) as recognized_scans,
                SUM(CASE WHEN predicted_denomination LIKE '%Uncertain%' OR predicted_denomination LIKE '%Non-Currency%' THEN 1 ELSE 0 END) as rejected_scans,
                AVG(CASE WHEN predicted_denomination NOT LIKE '%Uncertain%' AND predicted_denomination NOT LIKE '%Non-Currency%' THEN confidence ELSE NULL END) as avg_conf_recognized,
                AVG(confidence) as avg_conf_all,
                AVG(inference_ms) as avg_latency,
                SUM(CASE 
                    WHEN predicted_denomination = '₹2000' THEN 2000.0
                    WHEN predicted_denomination = '₹500' THEN 500.0
                    WHEN predicted_denomination = '₹200' THEN 200.0
                    WHEN predicted_denomination = '₹100' THEN 100.0
                    WHEN predicted_denomination = '₹50' THEN 50.0
                    WHEN predicted_denomination = '₹20' THEN 20.0
                    WHEN predicted_denomination = '₹10' OR predicted_denomination = '₹10 Coin' THEN 10.0
                    WHEN predicted_denomination = '₹5 Coin' THEN 5.0
                    WHEN predicted_denomination = '₹2 Coin' THEN 2.0
                    WHEN predicted_denomination = '₹1 Coin' THEN 1.0
                    WHEN predicted_denomination = '50 Paisa Coin' THEN 0.50
                    WHEN predicted_denomination = '25 Paisa Coin' THEN 0.25
                    ELSE 0.0
                END) as total_face_value
            FROM recognitions
            """
        ).fetchone()

    total = row["total_scans"] or 0
    rec_count = row["recognized_scans"] or 0
    rej_count = row["rejected_scans"] or 0
    total_val = round(row["total_face_value"] or 0.0, 2)
    avg_conf = (
        round(row["avg_conf_recognized"] * 100, 1)
        if row["avg_conf_recognized"] is not None
        else (round(row["avg_conf_all"] * 100, 1) if row["avg_conf_all"] is not None else None)
    )
    avg_latency = round(row["avg_latency"], 1) if row["avg_latency"] is not None else None

    return {
        "total_recognitions": total,
        "recognized_count": rec_count,
        "rejected_count": rej_count,
        "total_recognized_value": total_val,
        "average_confidence": avg_conf,
        "average_latency_ms": avg_latency,
    }
