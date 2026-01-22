from fastapi import WebSocket
from typing import List
import json
import asyncio
from datetime import datetime

class LogStreamService:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        # Send welcome log
        await self.emit_log("LogStream", "Client connected to telemetry stream", "INFO")

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, message: dict):
        # Filter dead connections and send
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except:
                # If send fails, assume disconnected (or handle cleaner)
                pass # actual removal happens in disconnect usually, or here if we want to be aggressive

    async def emit_log(self, system: str, message: str, level: str = "INFO"):
        """
        Emits a log to all connected clients.
        """
        payload = {
            "timestamp": datetime.now().strftime("%H:%M:%S"),
            "system": system,
            "message": message,
            "level": level
        }
        await self.broadcast(payload)

log_stream_service = LogStreamService()
