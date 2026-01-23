"""
Shared State Management for BatteryForge Agents
"""
from typing import Dict, Any, Optional
from dataclasses import dataclass, field
from datetime import datetime


@dataclass
class AgentState:
    """
    Shared state container for multi-agent coordination.
    This state is passed between agents in workflows.
    """
    
    # Current context
    current_view: str = "HOME"
    active_pack_id: Optional[str] = None
    active_cell_id: Optional[str] = None
    
    # Alert state
    alert_level: str = "NORMAL"  # NORMAL, WARNING, CRITICAL, EMERGENCY
    alert_message: Optional[str] = None
    alert_timestamp: Optional[datetime] = None
    
    # Workflow state
    current_workflow: Optional[str] = None
    workflow_step: int = 0
    workflow_progress: float = 0.0
    
    # Analysis results (persisted between turns)
    last_defect_analysis: Optional[Dict[str, Any]] = None
    last_charging_analysis: Optional[Dict[str, Any]] = None
    last_fleet_status: Optional[Dict[str, Any]] = None
    
    # Conversation context
    conversation_summary: str = ""
    pending_confirmations: list = field(default_factory=list)
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert state to dictionary for JSON serialization."""
        return {
            "current_view": self.current_view,
            "active_pack_id": self.active_pack_id,
            "active_cell_id": self.active_cell_id,
            "alert_level": self.alert_level,
            "alert_message": self.alert_message,
            "alert_timestamp": self.alert_timestamp.isoformat() if self.alert_timestamp else None,
            "current_workflow": self.current_workflow,
            "workflow_step": self.workflow_step,
            "workflow_progress": self.workflow_progress,
            "pending_confirmations": self.pending_confirmations
        }
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "AgentState":
        """Create state from dictionary."""
        state = cls()
        state.current_view = data.get("current_view", "HOME")
        state.active_pack_id = data.get("active_pack_id")
        state.active_cell_id = data.get("active_cell_id")
        state.alert_level = data.get("alert_level", "NORMAL")
        state.alert_message = data.get("alert_message")
        state.current_workflow = data.get("current_workflow")
        state.workflow_step = data.get("workflow_step", 0)
        state.workflow_progress = data.get("workflow_progress", 0.0)
        state.pending_confirmations = data.get("pending_confirmations", [])
        
        if data.get("alert_timestamp"):
            state.alert_timestamp = datetime.fromisoformat(data["alert_timestamp"])
        
        return state
    
    def set_alert(self, level: str, message: str):
        """Set alert state."""
        self.alert_level = level
        self.alert_message = message
        self.alert_timestamp = datetime.now()
    
    def clear_alert(self):
        """Clear alert state."""
        self.alert_level = "NORMAL"
        self.alert_message = None
        self.alert_timestamp = None
    
    def start_workflow(self, workflow_name: str):
        """Mark workflow as started."""
        self.current_workflow = workflow_name
        self.workflow_step = 0
        self.workflow_progress = 0.0
    
    def update_workflow_progress(self, step: int, total_steps: int):
        """Update workflow progress."""
        self.workflow_step = step
        self.workflow_progress = (step / total_steps) * 100 if total_steps > 0 else 0
    
    def complete_workflow(self):
        """Mark workflow as complete."""
        self.current_workflow = None
        self.workflow_step = 0
        self.workflow_progress = 100.0
    
    def add_confirmation_request(self, action: str, details: str):
        """Add a pending HITL confirmation request."""
        self.pending_confirmations.append({
            "action": action,
            "details": details,
            "timestamp": datetime.now().isoformat(),
            "status": "pending"
        })
    
    def resolve_confirmation(self, action: str, confirmed: bool):
        """Resolve a pending confirmation."""
        for conf in self.pending_confirmations:
            if conf["action"] == action and conf["status"] == "pending":
                conf["status"] = "confirmed" if confirmed else "rejected"
                return True
        return False
