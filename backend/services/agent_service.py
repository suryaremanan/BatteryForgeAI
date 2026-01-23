"""
Agent Service - ADK Integration Layer
Provides the interface between FastAPI routes and the ADK agent system.
"""
import os
import asyncio
import traceback
from typing import Dict, Any, Optional, List
from dotenv import load_dotenv

load_dotenv()

# Check if ADK is available (triggers reload)
try:
    from google.adk.runners import Runner
    from google.adk.sessions import InMemorySessionService
    ADK_AVAILABLE = True
except ImportError:
    print("Warning: google-adk not installed. Using fallback agent.")
    ADK_AVAILABLE = False

# Import the root agent
try:
    from battery_forge_agent import root_agent
    AGENT_AVAILABLE = True
except ImportError as e:
    print(f"Warning: Could not import battery_forge_agent: {e}")
    AGENT_AVAILABLE = False


class AgentService:
    """
    Service layer for the BatteryForge AI Commander.
    Manages agent sessions and execution.
    """
    
    def __init__(self):
        self.sessions: Dict[str, Any] = {}
        self.runner = None
        self.session_service = None
        self._initialized = False
        
    def _initialize(self):
        """Lazy initialization of ADK components."""
        if self._initialized:
            return
            
        if ADK_AVAILABLE and AGENT_AVAILABLE:
            try:
                self.session_service = InMemorySessionService()
                # ADK Runner requires app_name when not using a full app container
                self.runner = Runner(
                    agent=root_agent,
                    session_service=self.session_service,
                    app_name="BatteryForgeAI",
                    auto_create_session=True
                )
                self._initialized = True
                print("✅ ADK Agent initialized successfully")
            except Exception as e:
                print(f"❌ ADK initialization failed: {e}")
                self._initialized = False
        else:
            print("⚠️ Running in fallback mode (ADK not available)")
            self._initialized = False
    
    async def chat(
        self,
        message: str,
        session_id: str = "default",
        user_id: str = "default",
        context: Optional[Dict[str, Any]] = None,
        history: Optional[List[Dict]] = None
    ) -> Dict[str, Any]:
        """
        Send a message to the agent and get a response.
        """
        self._initialize()
        
        # Try ADK-based agent first
        if self._initialized and self.runner:
            try:
                return await self._run_adk_agent(
                    message=message,
                    session_id=session_id,
                    user_id=user_id,
                    context=context
                )
            except Exception as e:
                print(f"ADK agent error: {e}")
                import traceback
                traceback.print_exc()
                # Fall through to fallback
        
        # Fallback to existing gemini_service
        return await self._run_fallback_agent(
            message=message,
            history=history,
            context=context
        )
    
    async def _run_adk_agent(
        self,
        message: str,
        session_id: str,
        user_id: str,
        context: Optional[Dict] = None
    ) -> Dict[str, Any]:
        """Run the ADK-based multi-agent system."""
        from google.genai import types
        
        app_name = "BatteryForgeAI"

        # ADK requires a Content object for new_message
        new_message = types.Content(
            role="user",
            parts=[types.Part(text=message)]
        )
        
        # Inject context into session state if available
        if context:
            session = await self.session_service.get_session(
                app_name=app_name, user_id=user_id, session_id=session_id
            )
            if session:
                session.state.update({"ui_context": context})
        
        response_text = ""
        trace = []
        
        # Run the agent and iterate over events
        try:
            async for event in self.runner.run_async(
                user_id=user_id,
                session_id=session_id,
                new_message=new_message
            ):
                # 1. Collect Agent Trace
                if event.actions and event.actions.transfer_to_agent:
                    trace.append({
                        "agent": event.author,
                        "action": f"transfer → {event.actions.transfer_to_agent}",
                        "timestamp": event.timestamp
                    })
                
                # 2. Collect Tool Calls
                for fc in event.get_function_calls():
                    trace.append({
                        "agent": event.author,
                        "action": f"tool_call: {fc.name}",
                        "timestamp": event.timestamp
                    })
                
                # 3. Collect Response Text
                if event.author != 'user' and event.content and event.content.parts:
                    for part in event.content.parts:
                        if part.text:
                            response_text += part.text
        except Exception as e:
            traceback.print_exc()
            raise e
        
        # Parse actions from the accumulated response
        actions = self._extract_actions(response_text)
        
        return {
            "response": response_text,
            "actions": actions,
            "trace": trace,
            "session_id": session_id,
            "agent_mode": "adk"
        }
    
    async def _run_fallback_agent(
        self,
        message: str,
        history: Optional[List[Dict]] = None,
        context: Optional[Dict] = None
    ) -> Dict[str, Any]:
        """Fallback to existing gemini_service agent."""
        from services.gemini_service import gemini_service
        
        # Format history
        formatted_history = []
        if history:
            for msg in history:
                formatted_history.append({
                    "role": "user" if msg.get('role') == 'user' else "model",
                    "parts": [msg.get('content', '')]
                })
        
        # Get agent chat session
        chat = gemini_service.get_agent_chat(
            history=formatted_history,
            context=context
        )
        
        # Send message
        response = chat.send_message([message])
        response_text = response.text
        
        # Extract actions
        actions = self._extract_actions(response_text)
        
        return {
            "response": response_text,
            "actions": actions,
            "trace": [{"agent": "BatteryForgeAI", "action": "direct_response"}],
            "session_id": "fallback",
            "agent_mode": "fallback"
        }
    
    def _extract_actions(self, response_text: str) -> List[Dict[str, str]]:
        """Extract action commands from response text."""
        actions = []
        
        # Navigation commands
        view_commands = {
            "[VIEW: HOME]": {"type": "navigate", "target": "home"},
            "[VIEW: VISUAL]": {"type": "navigate", "target": "visual"},
            "[VIEW: CHARGING]": {"type": "navigate", "target": "charging"},
            "[VIEW: FLEET]": {"type": "navigate", "target": "fleet"},
            "[VIEW: LOGS]": {"type": "navigate", "target": "logs"},
            "[VIEW: SIM]": {"type": "navigate", "target": "sim"},
        }
        
        for command, action in view_commands.items():
            if command in response_text:
                actions.append(action)
        
        # Alert commands
        if "[ACTION: RED_ALERT]" in response_text:
            actions.append({"type": "alert", "level": "emergency"})
        if "[ACTION: CLEAR_ALERT]" in response_text:
            actions.append({"type": "alert", "level": "clear"})
        
        return actions
    
    async def run_workflow(
        self,
        workflow_name: str,
        session_id: str = "default",
        parameters: Optional[Dict] = None
    ) -> Dict[str, Any]:
        """
        Trigger a specific workflow (Marathon Agent).
        
        Args:
            workflow_name: Name of the workflow ('pack_audit', 'continuous_monitor')
            session_id: Session identifier
            parameters: Workflow-specific parameters
            
        Returns:
            dict: Workflow execution status
        """
        self._initialize()
        
        if not self._initialized:
            return {
                "status": "error",
                "message": "Agent system not available",
                "workflow": workflow_name
            }
        
        # Map workflow names to trigger messages
        workflow_triggers = {
            "pack_audit": "Run a full pack audit",
            "continuous_monitor": "Start continuous monitoring"
        }
        
        trigger = workflow_triggers.get(workflow_name)
        if not trigger:
            return {
                "status": "error",
                "message": f"Unknown workflow: {workflow_name}",
                "available_workflows": list(workflow_triggers.keys())
            }
        
        # Run workflow via chat interface
        result = await self.chat(
            message=trigger,
            session_id=session_id,
            context={"workflow_mode": True, "parameters": parameters}
        )
        
        return {
            "status": "started",
            "workflow": workflow_name,
            "result": result
        }
    
    def get_session_state(self, session_id: str) -> Dict[str, Any]:
        """Get the current state of a session."""
        if self.session_service:
            try:
                # Use sync method for synchronous endpoint
                session = self.session_service.get_session_sync(
                    app_name="BatteryForgeAI",
                    user_id="default",  # Limitation: assumes default user for simple query
                    session_id=session_id
                )
                if session:
                    return session.state
            except Exception as e:
                print(f"Error getting session state: {e}")
                pass
        return {}


# Global service instance
agent_service = AgentService()
