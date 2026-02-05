from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from services.gemini_service import gemini_service
import json
import base64

router = APIRouter()


# --- PCB AGENTIC CHAT ---

class PCBChatRequest(BaseModel):
    message: str
    session_id: Optional[str] = "pcb_default"
    history: Optional[List[dict]] = None
    image_base64: Optional[str] = None  # Base64 encoded image
    image_mime_type: Optional[str] = "image/jpeg"


@router.post("/pcb/chat")
async def pcb_agent_chat(request: PCBChatRequest):
    """
    Agentic PCB Manufacturing Chat Endpoint.
    Routes messages to the PCB Manufacturing Agent which autonomously
    decides which tools to use based on the user's query.

    The agent can:
    - Generate PCB designs from specs
    - Analyze AOI/X-ray images for defects
    - Check CNC fleet and drill inventory status
    - Predict tool life and maintenance needs
    - Analyze supply chain risks
    - Control etching/lamination processes
    """
    try:
        from services.agent_service import agent_service

        result = await agent_service.chat_pcb(
            message=request.message,
            session_id=request.session_id or "pcb_default",
            history=request.history,
            image_base64=request.image_base64,
            image_mime_type=request.image_mime_type
        )

        return {
            "response": result.get("response", "No response generated"),
            "data": result.get("data"),
            "tool_calls": result.get("tool_calls", []),
            "trace": result.get("trace", []),
            "actions": result.get("actions", []),
            "agent_mode": result.get("agent_mode", "unknown"),
            "session_id": result.get("session_id", request.session_id)
        }
    except Exception as e:
        import traceback
        traceback.print_exc()
        return {
            "response": f"I encountered an error: {str(e)}",
            "error": str(e),
            "agent_mode": "error"
        }


@router.post("/pcb/chat/image")
async def pcb_agent_chat_with_image(
    message: str = Form(...),
    session_id: str = Form("pcb_default"),
    file: UploadFile = File(...)
):
    """
    PCB Agent Chat with image upload.
    Use this endpoint when sending PCB images for AOI/X-ray inspection.
    """
    try:
        from services.agent_service import agent_service

        # Read and encode image
        image_bytes = await file.read()
        image_base64 = base64.b64encode(image_bytes).decode('utf-8')

        result = await agent_service.chat_pcb(
            message=message,
            session_id=session_id,
            image_base64=image_base64,
            image_mime_type=file.content_type or "image/jpeg"
        )

        return {
            "response": result.get("response", "No response generated"),
            "data": result.get("data"),
            "tool_calls": result.get("tool_calls", []),
            "trace": result.get("trace", []),
            "actions": result.get("actions", []),
            "agent_mode": result.get("agent_mode", "unknown"),
            "session_id": result.get("session_id", session_id)
        }
    except Exception as e:
        import traceback
        traceback.print_exc()
        return {
            "response": f"I encountered an error: {str(e)}",
            "error": str(e),
            "agent_mode": "error"
        }

# --- DESIGN & ENGINEERING ---

class ConversationTurn(BaseModel):
    role: str  # "user" or "assistant"
    content: str

class SchematicRequest(BaseModel):
    specs: str
    conversation_history: Optional[List[ConversationTurn]] = None

@router.post("/design/generate-schematic")
async def generate_schematic(request: SchematicRequest):
    history = [turn.model_dump() for turn in request.conversation_history] if request.conversation_history else None
    return await gemini_service.generate_pcb_design_critique(request.specs, conversation_history=history)

class RLRouteRequest(BaseModel):
    grid_size: List[int] = [10, 10]
    start: List[int]
    target: List[int]
    obstacles: List[List[int]] = []
    current_head: Optional[List[int]] = None

@router.post("/design/explore-design")
async def explore_design_rl(request: RLRouteRequest):
    grid_state = request.model_dump()
    if grid_state["current_head"] is None:
        grid_state["current_head"] = request.start
    return await gemini_service.explore_design_space(grid_state)

@router.post("/design/parse-datasheet")
async def parse_datasheet(file: UploadFile = File(...), constraints: Optional[str] = Form(None)):
    contents = await file.read()
    design_constraints = None
    if constraints:
        design_constraints = json.loads(constraints)
    return await gemini_service.parse_component_datasheet(contents, file.content_type, design_constraints=design_constraints)

# --- QUALITY CONTROL (Vision extensions) ---

@router.post("/vision/aoi-inspect")
async def aoi_inspect(
    file: UploadFile = File(...),
    reference_file: Optional[UploadFile] = File(None)
):
    """
    AI-Powered Defect Classification — distinguishes cosmetic vs fatal defects.
    Optionally accepts a 'golden sample' reference image to filter false positives.
    """
    contents = await file.read()
    reference_contents = None
    if reference_file:
        reference_contents = await reference_file.read()
    return await gemini_service.analyze_production_defect(
        contents,
        file.content_type,
        reference_image_data=reference_contents
    )

@router.post("/vision/xray-analysis")
async def analyze_xray(file: UploadFile = File(...)):
    """X-Ray Analysis for BGA voids, barrel distortion, layer misalignment."""
    contents = await file.read()
    return await gemini_service.analyze_xray_inspection(contents, file.content_type)

# --- PREDICTIVE MAINTENANCE ---

class SignalRequest(BaseModel):
    machine_id: str
    fft_peaks: List[dict]
    rms_vibration: float

@router.post("/maintenance/analyze-signals")
async def analyze_signals(request: SignalRequest):
    return await gemini_service.analyze_maintenance_signals(request.model_dump())

class ToolLifeRequest(BaseModel):
    hits: int
    resin_smear_level: str
    feed_rate_deviation: float

@router.post("/maintenance/tool-life")
async def predict_tool(request: ToolLifeRequest):
    return await gemini_service.predict_tool_life(request.model_dump())

# --- PACK ASSEMBLY LINE MONITORING ---

@router.get("/maintenance/fleet-status")
async def get_fleet_status():
    """Get real-time status of battery pack assembly line stations."""
    import random
    # Simulated assembly line data - in production this would come from PLC/SCADA
    stations = [
        {
            "id": "STATION-CELL-SORT",
            "name": "Cell Sorting & Grading",
            "type": "Cell Processing",
            "status": "RUNNING",
            "throughput_pph": 120,
            "current_batch": "BATCH-2024-0892",
            "cell_grade_distribution": {"A": 0.85, "B": 0.12, "C": 0.03},
            "yield_rate": 0.97,
            "uptime_hours": 1247,
            "spindle_temp_c": 28,
            "last_maintenance": "2024-01-15"
        },
        {
            "id": "STATION-STACK",
            "name": "Module Stacking",
            "type": "Assembly",
            "status": "RUNNING",
            "throughput_pph": 45,
            "current_batch": "BATCH-2024-0892",
            "stack_alignment_error_mm": round(random.uniform(0.1, 0.5), 2),
            "modules_completed_today": 342,
            "uptime_hours": 892,
            "spindle_temp_c": 32,
            "last_maintenance": "2024-01-20"
        },
        {
            "id": "STATION-WELD",
            "name": "Tab Welding (Laser)",
            "type": "Welding",
            "status": "WARNING",
            "throughput_pph": 40,
            "current_batch": "BATCH-2024-0892",
            "laser_power_kw": 2.5,
            "weld_strength_n": round(random.uniform(45, 55), 1),
            "reject_rate": 0.02,
            "alert": "Laser focus drift detected - recalibration due",
            "uptime_hours": 2105,
            "spindle_temp_c": 72,
            "last_maintenance": "2023-12-10"
        },
        {
            "id": "STATION-BUSBAR",
            "name": "Busbar Assembly",
            "type": "Assembly",
            "status": "RUNNING",
            "throughput_pph": 38,
            "current_batch": "BATCH-2024-0892",
            "torque_applied_nm": round(random.uniform(8.5, 9.5), 1),
            "connections_per_pack": 48,
            "uptime_hours": 560,
            "spindle_temp_c": 35,
            "last_maintenance": "2024-01-25"
        },
        {
            "id": "STATION-TIM",
            "name": "Thermal Interface Application",
            "type": "Thermal",
            "status": "IDLE",
            "throughput_pph": 42,
            "current_batch": None,
            "tim_coverage_pct": 0,
            "dispense_volume_ml": 0,
            "uptime_hours": 1580,
            "spindle_temp_c": 25,
            "last_maintenance": "2024-01-18"
        },
        {
            "id": "STATION-EOL",
            "name": "End-of-Line Test",
            "type": "Testing",
            "status": "RUNNING",
            "throughput_pph": 30,
            "current_batch": "BATCH-2024-0891",
            "tests": ["OCV", "IR", "HIPOT", "LEAK", "CAN_COMM"],
            "pass_rate": 0.985,
            "packs_tested_today": 218,
            "uptime_hours": 3200,
            "spindle_temp_c": 28,
            "last_maintenance": "2024-01-22"
        }
    ]
    return {
        "machines": stations,
        "line_efficiency": 0.87,
        "daily_target": 500,
        "daily_actual": 435,
        "shift": "Day Shift A",
        "total": len(stations),
        "running": sum(1 for s in stations if s["status"] == "RUNNING"),
        "warnings": sum(1 for s in stations if s["status"] == "WARNING")
    }

@router.get("/maintenance/drill-inventory")
async def get_drill_inventory():
    """Get cell inventory status for battery pack assembly."""
    import random
    cells = [
        {"id": "NMC-21700-50E-A", "sku": "NMC-21700-50E", "vendor": "Samsung SDI", "qty": 12500, "status": "OK", "grade": "A", "capacity_ah": 5.0, "voltage_nominal": 3.6, "location": "CELL-STORAGE-A1"},
        {"id": "NMC-21700-50E-B", "sku": "NMC-21700-50E", "vendor": "Samsung SDI", "qty": 1200, "status": "OK", "grade": "B", "capacity_ah": 4.8, "voltage_nominal": 3.6, "location": "CELL-STORAGE-A2"},
        {"id": "LFP-280AH-CATL", "sku": "LFP-280AH-CATL", "vendor": "CATL", "qty": 450, "status": "WARNING", "grade": "A", "capacity_ah": 280, "voltage_nominal": 3.2, "min_qty": 500, "location": "CELL-STORAGE-B1"},
        {"id": "NCA-18650-35E", "sku": "NCA-18650-35E", "vendor": "Samsung SDI", "qty": 8000, "status": "OK", "grade": "A", "capacity_ah": 3.5, "voltage_nominal": 3.6, "location": "CELL-STORAGE-C1"},
        {"id": "LFP-100AH-EVE", "sku": "LFP-100AH-EVE", "vendor": "EVE Energy", "qty": 620, "status": "OK", "grade": "A", "capacity_ah": 100, "voltage_nominal": 3.2, "location": "CELL-STORAGE-B2"},
        {"id": "NMC-POUCH-60AH", "sku": "NMC-POUCH-60AH", "vendor": "LG Chem", "qty": 180, "status": "CRITICAL", "grade": "A", "capacity_ah": 60, "voltage_nominal": 3.7, "min_qty": 200, "location": "CELL-STORAGE-D1"},
        {"id": "NMC-21700-50G", "sku": "NMC-21700-50G", "vendor": "Samsung SDI", "qty": 5500, "status": "OK", "grade": "A", "capacity_ah": 5.0, "voltage_nominal": 3.6, "location": "CELL-STORAGE-A3"},
        {"id": "LFP-BLADE-138AH", "sku": "LFP-BLADE-138AH", "vendor": "BYD", "qty": 340, "status": "OK", "grade": "A", "capacity_ah": 138, "voltage_nominal": 3.2, "location": "CELL-STORAGE-B3"}
    ]
    return {
        "drills": cells,
        "total": len(cells),
        "ok": sum(1 for c in cells if c["status"] == "OK"),
        "warning": sum(1 for c in cells if c["status"] == "WARNING"),
        "critical": sum(1 for c in cells if c["status"] == "CRITICAL"),
        "low_stock_alerts": sum(1 for c in cells if c["status"] in ["WARNING", "CRITICAL"])
    }

class ThermalAnalysisRequest(BaseModel):
    machine_id: str
    spindle_temp_c: float
    ambient_temp_c: float = 25.0
    load_percent: float = 80.0

@router.post("/maintenance/thermal-analysis")
async def analyze_thermal(request: ThermalAnalysisRequest):
    """AI-powered thermal analysis for spindle/motor health."""
    return await gemini_service.analyze_thermal_health(request.model_dump())

class MaintenanceScheduleRequest(BaseModel):
    machine_id: str
    maintenance_type: str  # "preventive", "corrective", "predictive"
    priority: str = "normal"  # "low", "normal", "high", "critical"
    notes: Optional[str] = None

@router.post("/maintenance/schedule")
async def schedule_maintenance(request: MaintenanceScheduleRequest):
    """Schedule maintenance for a machine."""
    import datetime
    # In production, this would integrate with a maintenance management system
    scheduled_date = datetime.datetime.now() + datetime.timedelta(days=1 if request.priority == "critical" else 3 if request.priority == "high" else 7)
    return {
        "scheduled": True,
        "machine_id": request.machine_id,
        "maintenance_type": request.maintenance_type,
        "priority": request.priority,
        "scheduled_date": scheduled_date.isoformat(),
        "work_order_id": f"WO-{datetime.datetime.now().strftime('%Y%m%d')}-{request.machine_id[-3:]}"
    }

@router.get("/maintenance/anomaly-history")
async def get_anomaly_history():
    """Get historical anomaly events from assembly line."""
    anomalies = [
        {"timestamp": "2024-01-28T14:32:00", "machine_id": "STATION-WELD", "type": "LASER_FOCUS_DRIFT", "severity": "WARNING", "value": 0.15, "threshold": 0.1, "resolved": False, "description": "Laser focus position drifting - weld depth affected"},
        {"timestamp": "2024-01-28T10:15:00", "machine_id": "STATION-EOL", "type": "HIPOT_FAIL_RATE", "severity": "INFO", "value": 2.1, "threshold": 3.0, "resolved": True, "description": "HIPOT failure rate slightly elevated"},
        {"timestamp": "2024-01-27T16:45:00", "machine_id": "STATION-STACK", "type": "ALIGNMENT_ERROR", "severity": "WARNING", "value": 0.8, "threshold": 0.5, "resolved": True, "description": "Cell stack misalignment detected and corrected"},
        {"timestamp": "2024-01-27T09:20:00", "machine_id": "STATION-TIM", "type": "DISPENSE_VOLUME", "severity": "INFO", "value": 14.2, "threshold": 15.0, "resolved": True, "description": "TIM dispense volume slightly low - nozzle cleaned"},
        {"timestamp": "2024-01-26T11:30:00", "machine_id": "STATION-BUSBAR", "type": "TORQUE_DEVIATION", "severity": "CRITICAL", "value": 12.5, "threshold": 10.0, "resolved": True, "description": "Torque wrench calibration drift - recalibrated"},
    ]
    return {"anomalies": anomalies, "unresolved": sum(1 for a in anomalies if not a["resolved"])}

# --- SUPPLY CHAIN ---

class SupplyRiskRequest(BaseModel):
    bom: List[dict] # [{"part": "X", "origin": "Y"}]

@router.post("/supply/risk")
async def check_supply_risk(request: SupplyRiskRequest):
    return await gemini_service.monitor_supply_risk(request.bom)

class InventoryRequest(BaseModel):
    material: str
    usage_rate_per_day: float
    lead_time_days: int
    market_trend: str

@router.post("/supply/forecast")
async def forecast_inv(request: InventoryRequest):
    return await gemini_service.forecast_inventory(request.model_dump())

# --- PROCESS CONTROL ---

class ProcessLoopRequest(BaseModel):
    process: str
    ph_level: float
    copper_thickness_removed: float
    target: float

@router.post("/process/control-loop")
async def control_loop(request: ProcessLoopRequest):
    return await gemini_service.analyze_process_control_loop(request.model_dump())

# --- BATTERY FORMATION & WELDING ---

class FormationProtocolRequest(BaseModel):
    cell_chemistry: str  # "NMC", "LFP", "NCA", "LTO"
    capacity_ah: float
    ambient_temp: float = 25.0
    target_cycles: int = 3

@router.post("/process/formation-protocol")
async def optimize_formation(request: FormationProtocolRequest):
    """AI-powered formation cycling protocol optimization."""
    return await gemini_service.optimize_formation_protocol(
        request.cell_chemistry,
        request.capacity_ah,
        request.ambient_temp,
        request.target_cycles
    )

class TabWeldingRequest(BaseModel):
    material: str  # "nickel", "aluminum", "copper"
    thickness_mm: float
    weld_type: str = "laser"  # "laser" or "ultrasonic"

@router.post("/process/tab-welding")
async def optimize_tab_welding(request: TabWeldingRequest):
    """AI-powered tab welding parameter optimization."""
    return await gemini_service.optimize_tab_welding(
        request.material,
        request.thickness_mm,
        request.weld_type
    )

class BatteryInspectionRequest(BaseModel):
    inspection_type: str = "general"  # "weld", "pouch", "busbar", "thermal_paste", "general"

@router.post("/vision/battery-inspect")
async def inspect_battery_assembly(
    file: UploadFile = File(...),
    inspection_type: str = Form("general")
):
    """AI-powered battery assembly visual inspection."""
    contents = await file.read()
    return await gemini_service.inspect_battery_assembly(
        contents,
        file.content_type or "image/jpeg",
        inspection_type
    )
