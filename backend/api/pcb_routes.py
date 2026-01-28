from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from services.gemini_service import gemini_service
import json

router = APIRouter()

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

# --- ENHANCED MAINTENANCE ENDPOINTS ---

@router.get("/maintenance/fleet-status")
async def get_fleet_status():
    """Get real-time status of all CNC machines in the fleet."""
    import random
    # Simulated fleet data - in production this would come from PLC/SCADA
    machines = [
        {"id": "CNC-DRILL-01", "type": "CNC Drill", "status": "RUNNING", "uptime_hours": 1247, "current_job": "PCB-2024-0892", "spindle_rpm": 42000, "spindle_temp_c": 58, "vibration_rms": round(random.uniform(0.8, 1.5), 2), "last_maintenance": "2024-01-15"},
        {"id": "CNC-DRILL-02", "type": "CNC Drill", "status": "RUNNING", "uptime_hours": 892, "current_job": "PCB-2024-0893", "spindle_rpm": 38000, "spindle_temp_c": 52, "vibration_rms": round(random.uniform(0.6, 1.2), 2), "last_maintenance": "2024-01-20"},
        {"id": "CNC-DRILL-03", "type": "CNC Drill", "status": "WARNING", "uptime_hours": 2105, "current_job": "PCB-2024-0891", "spindle_rpm": 40000, "spindle_temp_c": 72, "vibration_rms": round(random.uniform(1.8, 2.5), 2), "last_maintenance": "2023-12-10"},
        {"id": "CNC-ROUTER-01", "type": "CNC Router", "status": "RUNNING", "uptime_hours": 560, "current_job": "PCB-2024-0894", "spindle_rpm": 24000, "spindle_temp_c": 45, "vibration_rms": round(random.uniform(0.5, 0.9), 2), "last_maintenance": "2024-01-25"},
        {"id": "CNC-ROUTER-02", "type": "CNC Router", "status": "IDLE", "uptime_hours": 1580, "current_job": None, "spindle_rpm": 0, "spindle_temp_c": 28, "vibration_rms": 0.0, "last_maintenance": "2024-01-18"},
        {"id": "LASER-DRILL-01", "type": "Laser Drill", "status": "RUNNING", "uptime_hours": 3200, "current_job": "PCB-2024-0890", "spindle_rpm": 0, "spindle_temp_c": 35, "vibration_rms": round(random.uniform(0.2, 0.5), 2), "last_maintenance": "2024-01-22"},
    ]
    return {"machines": machines, "total": len(machines), "running": sum(1 for m in machines if m["status"] == "RUNNING"), "warnings": sum(1 for m in machines if m["status"] == "WARNING")}

@router.get("/maintenance/drill-inventory")
async def get_drill_inventory():
    """Get status of all drill bits in inventory."""
    import random
    drills = [
        {"id": "DRL-0.3-001", "diameter_mm": 0.3, "hits": 8500, "max_hits": 10000, "status": "WARNING", "resin_smear": "high", "location": "CNC-DRILL-01"},
        {"id": "DRL-0.3-002", "diameter_mm": 0.3, "hits": 2100, "max_hits": 10000, "status": "OK", "resin_smear": "low", "location": "CNC-DRILL-02"},
        {"id": "DRL-0.4-001", "diameter_mm": 0.4, "hits": 9200, "max_hits": 12000, "status": "WARNING", "resin_smear": "medium", "location": "CNC-DRILL-03"},
        {"id": "DRL-0.4-002", "diameter_mm": 0.4, "hits": 500, "max_hits": 12000, "status": "OK", "resin_smear": "none", "location": "STORAGE"},
        {"id": "DRL-0.5-001", "diameter_mm": 0.5, "hits": 11800, "max_hits": 15000, "status": "OK", "resin_smear": "low", "location": "CNC-DRILL-01"},
        {"id": "DRL-0.5-002", "diameter_mm": 0.5, "hits": 14500, "max_hits": 15000, "status": "CRITICAL", "resin_smear": "high", "location": "CNC-DRILL-02"},
        {"id": "DRL-0.8-001", "diameter_mm": 0.8, "hits": 4200, "max_hits": 20000, "status": "OK", "resin_smear": "none", "location": "CNC-DRILL-03"},
        {"id": "DRL-1.0-001", "diameter_mm": 1.0, "hits": 18000, "max_hits": 25000, "status": "OK", "resin_smear": "low", "location": "CNC-ROUTER-01"},
    ]
    return {"drills": drills, "total": len(drills), "ok": sum(1 for d in drills if d["status"] == "OK"), "warning": sum(1 for d in drills if d["status"] == "WARNING"), "critical": sum(1 for d in drills if d["status"] == "CRITICAL")}

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
    """Get historical anomaly events."""
    anomalies = [
        {"timestamp": "2024-01-28T14:32:00", "machine_id": "CNC-DRILL-03", "type": "VIBRATION_SPIKE", "severity": "WARNING", "value": 2.8, "threshold": 2.0, "resolved": False},
        {"timestamp": "2024-01-28T10:15:00", "machine_id": "CNC-DRILL-01", "type": "TEMP_HIGH", "severity": "INFO", "value": 68, "threshold": 70, "resolved": True},
        {"timestamp": "2024-01-27T16:45:00", "machine_id": "CNC-DRILL-02", "type": "SPINDLE_RUNOUT", "severity": "WARNING", "value": 0.015, "threshold": 0.01, "resolved": True},
        {"timestamp": "2024-01-27T09:20:00", "machine_id": "LASER-DRILL-01", "type": "POWER_FLUCTUATION", "severity": "INFO", "value": 4.2, "threshold": 5.0, "resolved": True},
        {"timestamp": "2024-01-26T11:30:00", "machine_id": "CNC-ROUTER-01", "type": "TOOL_WEAR", "severity": "CRITICAL", "value": 95, "threshold": 85, "resolved": True},
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
