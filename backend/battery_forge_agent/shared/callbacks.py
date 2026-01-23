"""
Agent Callbacks for Event Handling
Provides hooks for agent lifecycle events and streaming.
"""
from typing import Callable, Dict, Any, Optional
from dataclasses import dataclass
import asyncio


@dataclass
class AgentEvent:
    """Event emitted by agents during execution."""
    event_type: str  # agent_switch, tool_call, response, error
    agent_name: str
    data: Dict[str, Any]
    timestamp: float


class AgentCallbacks:
    """
    Callback manager for agent events.
    Used to stream updates to the frontend.
    """
    
    def __init__(self):
        self._listeners: Dict[str, list] = {
            "agent_switch": [],
            "tool_call": [],
            "tool_result": [],
            "response": [],
            "error": [],
            "workflow_progress": [],
            "alert": []
        }
        self._websocket = None
    
    def register(self, event_type: str, callback: Callable):
        """Register a callback for an event type."""
        if event_type in self._listeners:
            self._listeners[event_type].append(callback)
    
    def unregister(self, event_type: str, callback: Callable):
        """Unregister a callback."""
        if event_type in self._listeners and callback in self._listeners[event_type]:
            self._listeners[event_type].remove(callback)
    
    def set_websocket(self, websocket):
        """Set WebSocket for streaming updates."""
        self._websocket = websocket
    
    async def emit(self, event: AgentEvent):
        """Emit an event to all registered listeners."""
        event_type = event.event_type
        
        # Call registered callbacks
        for callback in self._listeners.get(event_type, []):
            try:
                if asyncio.iscoroutinefunction(callback):
                    await callback(event)
                else:
                    callback(event)
            except Exception as e:
                print(f"Callback error: {e}")
        
        # Stream to WebSocket if connected
        if self._websocket:
            try:
                await self._websocket.send_json({
                    "type": event_type,
                    "agent": event.agent_name,
                    "data": event.data,
                    "timestamp": event.timestamp
                })
            except Exception as e:
                print(f"WebSocket send error: {e}")
    
    async def on_agent_switch(self, from_agent: str, to_agent: str, reason: str):
        """Emit agent switch event."""
        import time
        await self.emit(AgentEvent(
            event_type="agent_switch",
            agent_name=to_agent,
            data={
                "from_agent": from_agent,
                "to_agent": to_agent,
                "reason": reason
            },
            timestamp=time.time()
        ))
    
    async def on_tool_call(self, agent_name: str, tool_name: str, args: Dict):
        """Emit tool call event."""
        import time
        await self.emit(AgentEvent(
            event_type="tool_call",
            agent_name=agent_name,
            data={
                "tool_name": tool_name,
                "arguments": args,
                "status": "started"
            },
            timestamp=time.time()
        ))
    
    async def on_tool_result(self, agent_name: str, tool_name: str, result: Any):
        """Emit tool result event."""
        import time
        await self.emit(AgentEvent(
            event_type="tool_result",
            agent_name=agent_name,
            data={
                "tool_name": tool_name,
                "result": str(result)[:500],  # Truncate for streaming
                "status": "completed"
            },
            timestamp=time.time()
        ))
    
    async def on_workflow_progress(self, workflow_name: str, step: int, total: int, message: str):
        """Emit workflow progress event."""
        import time
        await self.emit(AgentEvent(
            event_type="workflow_progress",
            agent_name=workflow_name,
            data={
                "step": step,
                "total_steps": total,
                "progress_percent": (step / total) * 100 if total > 0 else 0,
                "message": message
            },
            timestamp=time.time()
        ))
    
    async def on_alert(self, level: str, message: str, pack_id: Optional[str] = None):
        """Emit alert event."""
        import time
        await self.emit(AgentEvent(
            event_type="alert",
            agent_name="SafetyGuardian",
            data={
                "level": level,
                "message": message,
                "pack_id": pack_id
            },
            timestamp=time.time()
        ))


# Global callbacks instance
agent_callbacks = AgentCallbacks()
