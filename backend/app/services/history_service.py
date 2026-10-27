"""Service layer for recognition history querying SQLite database."""

from __future__ import annotations

from typing import Optional

from app.database.db import get_history
from app.schemas.responses import HistoryResponse


class HistoryService:
    """Manages recognition history records stored in SQLite."""

    def get_history(
        self,
        search: Optional[str] = None,
        denomination: Optional[str] = None,
        currency_type: Optional[str] = None,
        limit: int = 50,
        offset: int = 0,
    ) -> HistoryResponse:
        data = get_history(
            search=search,
            denomination=denomination,
            currency_type=currency_type,
            limit=limit,
            offset=offset,
        )

        records = data.get("records", [])
        total = data.get("total", 0)

        msg = (
            f"Loaded {len(records)} recognition records."
            if records
            else "No recognition records yet."
        )

        return HistoryResponse(
            records=records,
            total=total,
            message=msg,
        )


# Singleton
history_service = HistoryService()
