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

# Import the root agent and sub-agents
try:
    from battery_forge_agent import root_agent, pcb_agent
    AGENT_AVAILABLE = True
    PCB_AGENT_AVAILABLE = True
except ImportError as e:
    print(f"Warning: Could not import battery_forge_agent: {e}")
    AGENT_AVAILABLE = False
    PCB_AGENT_AVAILABLE = False


class AgentService:
    """
    Service layer for the BatteryForge AI Commander.
    Manages agent sessions and execution.
    """

    def __init__(self):
        self.sessions: Dict[str, Any] = {}
        self.runner = None
        self.pcb_runner = None  # Dedicated PCB agent runner
        self.session_service = None
        self._initialized = False
        self._pcb_initialized = False

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

    def _initialize_pcb(self):
        """Lazy initialization of PCB-specific ADK agent."""
        if self._pcb_initialized:
            return

        if ADK_AVAILABLE and PCB_AGENT_AVAILABLE:
            try:
                if not self.session_service:
                    self.session_service = InMemorySessionService()
                # Create dedicated PCB runner
                self.pcb_runner = Runner(
                    agent=pcb_agent,
                    session_service=self.session_service,
                    app_name="BatteryForgePCB",
                    auto_create_session=True
                )
                self._pcb_initialized = True
                print("✅ PCB ADK Agent initialized successfully")
            except Exception as e:
                print(f"❌ PCB ADK initialization failed: {e}")
                self._pcb_initialized = False
        else:
            print("⚠️ PCB Agent running in fallback mode")
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
    
    async def chat_pcb(
        self,
        message: str,
        session_id: str = "pcb_default",
        user_id: str = "default",
        context: Optional[Dict[str, Any]] = None,
        history: Optional[List[Dict]] = None,
        image_base64: Optional[str] = None,
        image_mime_type: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Send a message to the PCB Manufacturing Agent.
        This is the agentic interface for the PCB tab - the agent decides
        which tools to use based on the user's message.
        """
        self._initialize_pcb()

        # If image is provided, append context about it
        if image_base64:
            message = f"{message}\n[Image attached: {image_mime_type or 'image/jpeg'}]"
            if context is None:
                context = {}
            context["image_base64"] = image_base64
            context["image_mime_type"] = image_mime_type or "image/jpeg"

        # Try ADK-based PCB agent first
        if self._pcb_initialized and self.pcb_runner:
            try:
                return await self._run_pcb_agent(
                    message=message,
                    session_id=session_id,
                    user_id=user_id,
                    context=context
                )
            except Exception as e:
                print(f"PCB ADK agent error: {e}")
                import traceback
                traceback.print_exc()
                # Fall through to fallback

        # Fallback to direct gemini_service for PCB
        return await self._run_pcb_fallback(
            message=message,
            history=history,
            context=context,
            image_base64=image_base64,
            image_mime_type=image_mime_type
        )

    async def _run_pcb_agent(
        self,
        message: str,
        session_id: str,
        user_id: str,
        context: Optional[Dict] = None
    ) -> Dict[str, Any]:
        """Run the ADK-based PCB Manufacturing Agent."""
        from google.genai import types

        app_name = "BatteryForgePCB"

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
                session.state.update({"pcb_context": context})

        response_text = ""
        trace = []
        tool_calls = []

        # Run the PCB agent and iterate over events
        try:
            async for event in self.pcb_runner.run_async(
                user_id=user_id,
                session_id=session_id,
                new_message=new_message
            ):
                # Collect Tool Calls
                for fc in event.get_function_calls():
                    tool_calls.append({
                        "tool": fc.name,
                        "args": dict(fc.args) if fc.args else {},
                        "timestamp": str(event.timestamp) if event.timestamp else None
                    })
                    trace.append({
                        "agent": "PCBManufacturingAgent",
                        "action": f"tool_call: {fc.name}",
                        "timestamp": str(event.timestamp) if event.timestamp else None
                    })

                # Collect Response Text
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
            "tool_calls": tool_calls,
            "trace": trace,
            "session_id": session_id,
            "agent_mode": "pcb_adk"
        }

    async def _run_pcb_fallback(
        self,
        message: str,
        history: Optional[List[Dict]] = None,
        context: Optional[Dict] = None,
        image_base64: Optional[str] = None,
        image_mime_type: Optional[str] = None
    ) -> Dict[str, Any]:
        """Fallback to gemini_service for PCB operations."""
        from services.gemini_service import gemini_service

        # Determine intent and call appropriate method
        message_lower = message.lower()

        try:
            # Design-related queries
            if any(kw in message_lower for kw in ['design', 'schematic', 'bms', 'circuit', 'board', 'spec']):
                result = await gemini_service.generate_pcb_design_critique(message)
                return {
                    "response": self._format_design_response(result),
                    "data": result,
                    "actions": [],
                    "tool_calls": [{"tool": "generate_pcb_design", "args": {"specs": message}}],
                    "agent_mode": "pcb_fallback"
                }

            # Maintenance queries
            elif any(kw in message_lower for kw in ['cnc', 'machine', 'drill', 'fleet', 'status', 'maintenance']):
                from battery_forge_agent.tools.pcb_tools import get_cnc_fleet_status, get_drill_inventory
                fleet = get_cnc_fleet_status()
                drills = get_drill_inventory()
                return {
                    "response": self._format_maintenance_response(fleet, drills),
                    "data": {"fleet": fleet, "drills": drills},
                    "actions": [],
                    "tool_calls": [{"tool": "get_cnc_fleet_status"}, {"tool": "get_drill_inventory"}],
                    "agent_mode": "pcb_fallback"
                }

            # Default: treat as general PCB question
            else:
                result = await gemini_service.generate_pcb_design_critique(message)
                return {
                    "response": self._format_design_response(result),
                    "data": result,
                    "actions": [],
                    "tool_calls": [],
                    "agent_mode": "pcb_fallback"
                }
        except Exception as e:
            return {
                "response": f"I encountered an error processing your request: {str(e)}",
                "error": str(e),
                "actions": [],
                "tool_calls": [],
                "agent_mode": "pcb_fallback_error"
            }

    def _format_design_response(self, result: Dict) -> str:
        """Format PCB design result into readable response."""
        if result.get("status") == "needs_clarification":
            questions = result.get("clarifying_questions", [])
            understood = result.get("understood_so_far", "")
            response = "I need a bit more information to create the best design for you.\n\n"
            if understood:
                response += f"**What I understood:** {understood}\n\n"
            response += "**Questions:**\n"
            for i, q in enumerate(questions, 1):
                response += f"{i}. {q}\n"
            return response
        else:
            # Full design generated
            blocks = result.get("blocks", [])
            response = "**PCB Design Plan Generated**\n\n"
            if blocks:
                response += "**Functional Blocks:**\n"
                for b in blocks:
                    response += f"- **{b.get('name', 'Block')}**: {b.get('function', 'N/A')}\n"
            if result.get("interconnections"):
                response += f"\n**Interconnections:** {', '.join(result['interconnections'])}\n"
            if result.get("recommended_components"):
                response += "\n**Recommended Components:**\n"
                for comp in result["recommended_components"][:5]:
                    response += f"- {comp.get('part_number', 'N/A')}: {comp.get('description', 'N/A')}\n"
            return response

    def _format_maintenance_response(self, fleet: Dict, drills: Dict) -> str:
        """Format maintenance data into readable response."""
        response = "**CNC Fleet Status**\n\n"
        response += f"Total Machines: {fleet['total']} | Running: {fleet['running']} | Warnings: {fleet['warnings']}\n\n"

        warnings = [m for m in fleet['machines'] if m['status'] == 'WARNING']
        if warnings:
            response += "⚠️ **Machines Requiring Attention:**\n"
            for m in warnings:
                response += f"- **{m['id']}**: Temp {m['spindle_temp_c']}°C, Vibration {m['vibration_rms']} mm/s\n"

        response += f"\n**Drill Inventory**\n"
        response += f"Total: {drills['total']} | OK: {drills['ok']} | Warning: {drills['warning']} | Critical: {drills['critical']}\n"

        critical = [d for d in drills['drills'] if d['status'] == 'CRITICAL']
        if critical:
            response += "\n🔴 **Critical Electrodes (Replace Immediately):**\n"
            for d in critical:
                response += f"- **{d['id']}**: {d['hits']}/{d['max_hits']} welds, Spatter: {d['resin_smear']}\n"

        return response

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
            "[VIEW: PCB]": {"type": "navigate", "target": "pcb"},
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
