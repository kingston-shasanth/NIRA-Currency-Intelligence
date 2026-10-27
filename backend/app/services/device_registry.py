"""NIRA — Connected Devices and Client Session Registry.

Tracks real active client devices that have contacted the NIRA backend via
LAN Wi-Fi or loopback, distinguishing Mobile Native App (Capacitor),
Phone Browser, and Desktop Laptop Browser sessions with last-seen timestamps.
"""

from __future__ import annotations

import time
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from pydantic import BaseModel


class ConnectedClient(BaseModel):
    client_id: str
    client_type: str
    device_name: Optional[str] = None
    ip_address: str
    last_seen: str
    last_seen_timestamp: float
    total_requests: int
    last_action: str
    user_agent: Optional[str] = None
    is_active: bool = True


class DeviceRegistry:
    """In-memory active device registry with session tracking."""

    def __init__(self, session_timeout_seconds: float = 90.0):
        self._clients: Dict[str, ConnectedClient] = {}
        self._session_timeout = session_timeout_seconds

    def record_activity(
        self,
        ip_address: str,
        user_agent: str = "",
        action: str = "request",
        custom_client_id: Optional[str] = None,
        device_name: Optional[str] = None,
        client_type: Optional[str] = None,
    ) -> ConnectedClient:
        """Record an authentic API interaction from a client."""
        now = time.time()
        now_iso = datetime.now(timezone.utc).isoformat()

        # Classify client based on User-Agent and headers
        ua_lower = user_agent.lower() if user_agent else ""
        if client_type:
            determined_type = client_type
        elif "capacitor" in ua_lower or "ai.drishti.currency" in ua_lower or "nira" in ua_lower:
            determined_type = "Android Native App (Capacitor)"
        elif any(k in ua_lower for k in ["android", "iphone", "ipad", "mobile"]):
            determined_type = "Mobile Browser"
        else:
            determined_type = "Desktop Browser / Workstation"

        # Construct privacy-preserving client key
        cid = custom_client_id or f"{ip_address}_{hash(user_agent) % 10000:04d}"

        clean_device_name = (device_name.strip() if device_name and device_name.strip() else None)

        if cid in self._clients:
            client = self._clients[cid]
            client.last_seen = now_iso
            client.last_seen_timestamp = now
            client.total_requests += 1
            client.last_action = action
            client.is_active = True
            if clean_device_name:
                client.device_name = clean_device_name
            if user_agent and not client.user_agent:
                client.user_agent = user_agent[:120]
        else:
            client = ConnectedClient(
                client_id=cid,
                client_type=determined_type,
                device_name=clean_device_name or "Unnamed device",
                ip_address=ip_address,
                last_seen=now_iso,
                last_seen_timestamp=now,
                total_requests=1,
                last_action=action,
                user_agent=user_agent[:120] if user_agent else None,
                is_active=True,
            )
            self._clients[cid] = client

        return client

    def get_connected_clients(self, active_only: bool = True) -> List[Dict[str, Any]]:
        """Return list of clients with active status (seen within 90-second timeout)."""
        now = time.time()
        results = []
        for client in self._clients.values():
            # Mark inactive if not seen within 90s timeout
            client.is_active = (now - client.last_seen_timestamp) < self._session_timeout
            if active_only and not client.is_active:
                continue
            results.append(client.model_dump())

        # Sort with most recently active first
        results.sort(key=lambda x: x["last_seen_timestamp"], reverse=True)
        return results


# Global singleton
device_registry = DeviceRegistry()
