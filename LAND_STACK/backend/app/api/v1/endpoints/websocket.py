import asyncio
import json
import math
import time
from typing import List, Set
from fastapi import APIRouter, WebSocket, WebSocketDisconnect

router = APIRouter()


class ConnectionManager:
    def __init__(self):
        self.active_connections: Set[WebSocket] = set()

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.add(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.discard(websocket)

    async def broadcast(self, message: dict):
        dead_connections = []
        for connection in list(self.active_connections):
            try:
                await connection.send_json(message)
            except Exception:
                dead_connections.append(connection)
        for dc in dead_connections:
            self.active_connections.discard(dc)


manager = ConnectionManager()
_broadcaster_task = None


# Dynamic simulated patrol state moving across parcels in Lucknow
_patrol_state = {
    "lat": 26.8480,
    "lon": 80.9470,
    "speed": 32.0,
    "heading": 45.0,
    "angle": 0.0,
}


async def live_data_broadcaster():
    """Continuously broadcasts live GPS telemetry, sensor telemetry, and live status."""
    while True:
        try:
            await asyncio.sleep(2.5)
            if manager.active_connections:
                # Update patrol location along a gentle loop
                _patrol_state["angle"] += 0.1
                r = 0.005
                _patrol_state["lat"] = 26.8480 + r * math.cos(_patrol_state["angle"])
                _patrol_state["lon"] = 80.9470 + r * math.sin(_patrol_state["angle"])
                _patrol_state["heading"] = round((math.degrees(_patrol_state["angle"]) + 90) % 360, 1)
                _patrol_state["speed"] = round(28.0 + 12.0 * math.sin(_patrol_state["angle"] * 2), 1)

                payload = {
                    "type": "gps_telemetry",
                    "timestamp": time.time(),
                    "data": {
                        "device_id": "PATROL-OFFICER-01",
                        "officer_name": "Vikram Patel (Field Inspector)",
                        "latitude": round(_patrol_state["lat"], 6),
                        "longitude": round(_patrol_state["lon"], 6),
                        "speed_kmh": _patrol_state["speed"],
                        "heading_degrees": _patrol_state["heading"],
                        "altitude": 124.5,
                        "accuracy_meters": 3.2,
                        "status": "active_patrol",
                        "active_subscribers": len(manager.active_connections)
                    }
                }
                await manager.broadcast(payload)
        except asyncio.CancelledError:
            break
        except Exception:
            pass


@router.websocket("/ws/live")
async def websocket_live_stream(websocket: WebSocket):
    """
    Real-time bidirectional WebSocket stream for live GPS telemetry,
    satellite monitoring events, and application status notifications.
    """
    global _broadcaster_task
    await manager.connect(websocket)

    # Start broadcaster background task if not running
    if _broadcaster_task is None or _broadcaster_task.done():
        _broadcaster_task = asyncio.create_task(live_data_broadcaster())

    # Send initial welcome and connection state
    await websocket.send_json({
        "type": "connection_established",
        "message": "Connected to LAND STACK Real-Time GIS Telemetry Stream",
        "server_time": time.time(),
        "stream_channels": ["gps_telemetry", "ai_alerts", "application_updates"]
    })

    try:
        while True:
            data = await websocket.receive_text()
            try:
                msg = json.loads(data)
                if msg.get("action") == "ping":
                    await websocket.send_json({"type": "pong", "timestamp": time.time()})
                elif msg.get("action") == "broadcast_alert":
                    # Broadcast custom alert event to all connected clients
                    await manager.broadcast({
                        "type": "ai_alert",
                        "data": msg.get("data", {})
                    })
            except Exception:
                pass
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception:
        manager.disconnect(websocket)
