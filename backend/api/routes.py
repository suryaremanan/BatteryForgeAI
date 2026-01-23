from fastapi import APIRouter, UploadFile, File, Form, HTTPException, WebSocket
from pydantic import BaseModel
from typing import Optional, List
from services.gemini_service import gemini_service

router = APIRouter()

class LogRequest(BaseModel):
    log_text: str
    context: Optional[dict] = None

@router.post("/analyze/defect")
async def analyze_defect_endpoint(file: UploadFile = File(...)):
    if not file.content_type.startswith('image/'):
        raise HTTPException(status_code=400, detail="File must be an image")
    
    contents = await file.read()
    result = await gemini_service.analyze_defect(contents, file.content_type)
    return result

@router.post("/analyze/log")
async def analyze_log_endpoint(request: LogRequest):
    if not request.log_text:
        raise HTTPException(status_code=400, detail="Log text is empty")
    
    # 1. Fast Scan (Latency Fix) - Local Regex
    from services.regex_log_service import regex_log_service
    fast_result = regex_log_service.scan(request.log_text)
    
    # If Critical, Return Immediately (0 latency)
    if fast_result["urgency"] == "Critical":
        return fast_result

    # 2. Deep Analysis (Gemini) - with Context
    # If safe/warning, let Gemini provide deeper insights
    gemini_result = await gemini_service.parse_fault_log(request.log_text, request.context)
    
    # Merge results (Gemini is primary for Safe/Warning, but keep Regex "Warning" flag if present)
    if fast_result["urgency"] == "Warning":
        gemini_result["urgency"] = "Warning" 
        gemini_result["description"] = f"[REGEX DETECTED: {fast_result['description']}] " + gemini_result.get("description", "")
        
    return gemini_result

@router.post("/analyze/log/file")
async def analyze_log_file_endpoint(file: UploadFile = File(...), context: Optional[str] = Form(None)):
    import json
    
    # Read content
    content = await file.read()
    try:
        log_text = content.decode('utf-8', errors='ignore')
    except Exception:
        log_text = str(content)
        
    if not log_text:
        raise HTTPException(status_code=400, detail="Log file is empty")

    # Parse context if provided
    context_dict = None
    if context:
        try:
            context_dict = json.loads(context)
        except:
            pass # Ignore invalid context JSON

    # REUSE LOGIC: 1. Fast Scan (Latency Fix) - Local Regex
    from services.regex_log_service import regex_log_service
    fast_result = regex_log_service.scan(log_text)
    
    # If Critical, Return Immediately (0 latency)
    if fast_result["urgency"] == "Critical":
        return fast_result

    # 2. Deep Analysis (Gemini) - with Context
    gemini_result = await gemini_service.parse_fault_log(log_text, context_dict)
    
    # Merge results
    if fast_result["urgency"] == "Warning":
        gemini_result["urgency"] = "Warning" 
        gemini_result["description"] = f"[REGEX DETECTED: {fast_result['description']}] " + gemini_result.get("description", "")
        
    return gemini_result

class RAGRequest(BaseModel):
    query: str

@router.post("/rag/query")
async def rag_query_endpoint(request: RAGRequest):
    if not request.query:
        raise HTTPException(status_code=400, detail="Query is empty")
    
    # Lazy load/import to avoid circular deps if any, or just standard import
    from services.rag_service import rag_service
    results = rag_service.search(request.query)
    return {"results": results}

class ChatRequest(BaseModel):
    message: str
    history: list = [] # List of {"role": "user"|"model", "parts": [...]}
    image: Optional[str] = None # Base64 data URI
    context: Optional[dict] = None # ADK Agent State (Workspace Context)
    session_id: Optional[str] = None  # Session ID for conversation continuity
    user_id: Optional[str] = None  # User ID for multi-user support

@router.post("/chat/send")
async def chat_endpoint(request: ChatRequest):
    """
    Agentic Chat Endpoint - Routes to multi-agent system.
    Supports ADK-based agents with fallback to legacy gemini_service.
    """
    try:
        # Use the new agent service
        from services.agent_service import agent_service
        
        result = await agent_service.chat(
            message=request.message,
            session_id=request.session_id or "default",
            user_id=request.user_id or "default",
            context=request.context,
            history=request.history
        )
        
        return {
            "response": result.get("response", "No response generated"),
            "actions": result.get("actions", []),
            "trace": result.get("trace", []),
            "agent_mode": result.get("agent_mode", "unknown")
        }
    except Exception as e:
        import traceback
        import datetime
        error_msg = traceback.format_exc()
        print(f"Agent Error: {e}")
        with open("error_log.txt", "a") as f:
            f.write(f"\n[{datetime.datetime.now()}] Error: {error_msg}\n")
        return {"response": f"I encountered an error processing that request: {str(e)}"}

@router.post("/generate/synthetic")
async def generate_synthetic_data(defect_type: str = "swelling"):
    # Lazy load
    from services.synthetic_data import SyntheticDataService
    import os
    service = SyntheticDataService(os.getenv("GEMINI_API_KEY"))
    result = await service.generate_defect_image(defect_type)
    return result

@router.post("/analyze/charging")
async def analyze_charging(file: UploadFile = File(...), local_mode: bool = Form(False), chemistry_type: str = Form("NMC")):
    from services.charging_service import charging_service
    from services.gemini_service import gemini_service
    import base64
    
    # 1. Read and Process File (Universal)
    # Save to Disk First
    from services.storage_service import storage_service
    file_path = await storage_service.save_file(file)
    
    contents = await file.read()
    try:
        # A. Universal Analysis (Supports Privacy Mode)
        df, metadata = await charging_service.process_universal_file(contents, local_mode=local_mode, chemistry_type=chemistry_type)
        
        # B. Generate Dynamic Plot (Legacy Image)
        plot_config = metadata.get('plot_recommendation', {})
        plot_buf = charging_service.generate_generic_plot(df, plot_config)
        plot_b64 = base64.b64encode(plot_buf.getvalue()).decode('utf-8')
        
        # B2. Generate Interactive Plot Data (New for Phase 5)
        # Resample to max 2000 points for frontend
        plot_data_json = charging_service.resample_to_json(df, max_points=2000)
        
        # C. Attempt Metrics (Only if it looks like cycling)
        metrics = None
        if metadata.get('is_standard_cycling', False) or metadata.get('dataset_type') == 'Cycling':
            try:
                # Re-parse strict for metrics
                df_std = await charging_service.parse_cycling_data(contents)
                metrics = charging_service.calculate_metrics(df_std)
            except Exception as e:
                print(f"Metric calculation skipped: {e}")

    # D. Return Result
        
        # Save to DB (Single File History)
        from services.database_service import database_service
        database_service.save_record(
            filename=file.filename,
            dataset_type=metadata.get('dataset_type', 'Unknown'),
            metrics=metrics,
            summary=metadata.get('summary', 'No summary.'),
            plot_data=None, # Don't bloat DB
            file_path=file_path
        )

        response_payload = {
            "plot_image": f"data:image/png;base64,{plot_b64}",
            "plot_data": plot_data_json, # For Recharts
            "plot_config": plot_config,  # For Axes labels
            "analysis": {
                "diagnosis": metadata.get('dataset_type', 'Unknown'),
                "description": metadata.get('summary', 'No summary available.'),
                "recommendation": "Review plot for details.",
                "anomaly_detected": False 
            },
            "metrics": metrics,
            # NEW: Column info for user selection UI
            "available_columns": list(df.columns),
            "numeric_columns": [c for c in df.columns if df[c].dtype in ['int64', 'float64', 'int32', 'float32']],
            "plot_suggestions": metadata.get('plot_suggestions', None)
        }
        
        # E. Deep Dive Telemetry Analysis (Added Phase 5)
        # Check if we successfully parsed optional columns like Temperature
        if metrics and 'temperature' in df_std.columns:
            # Create a compact textual summary of the data for the LLM
            # Sampling every Nth row to fit context
            sample_str = df_std.iloc[::max(1, len(df_std)//50)].to_csv(index=False)
            deep_dive = await gemini_service.analyze_telemetry_deep_dive(sample_str)
            if deep_dive:
                 response_payload["deep_dive_analysis"] = deep_dive
                 
        # F. Digital Twin Check (Phase 2 Add-on)
        # If we have valid cycling data, run the shadow mode.
        if metrics:
            from services.digital_twin_service import digital_twin_service
            twin_result = await digital_twin_service.run_shadow_simulation(df_std)
            # Merge into response
            response_payload["digital_twin"] = twin_result
            
            # If critical, override the main analysis
            if twin_result.get("safety_status") == "CRITICAL":
                response_payload["analysis"]["anomaly_detected"] = True
                response_payload["analysis"]["diagnosis"] = f"AI BASELINE ALERT: {twin_result['anomaly_reason']}"
                response_payload["analysis"]["recommendation"] = "ABORT TEST IMMEDIATELY."

        # G. Physics Engine Integration (PyBaMM) - Phase 1 Fix
        # Now we run this AFTER we have valid 'metrics' and 'df_std' (standardized columns)
        if metrics:
            try:
                from services.simulation_service import simulation_service
                
                # Estimate C-rate from Metrics
                capacity = metrics.get('capacity_ah', 2.0)
                max_current = metrics.get('max_current', 2.0)
                est_c_rate = max(0.1, round(max_current / (capacity if capacity > 0 else 1.0), 2))
                
                # Run Simulation
                sim_data = await simulation_service.run_reference_discharge(chemistry=chemistry_type, c_rate=est_c_rate)
                
                if sim_data:
                    # Attach to Analysis
                    response_payload["analysis"]["physics_twin"] = {
                         'engine': 'PyBaMM DFN',
                         'parameters': {'chemistry': f'{chemistry_type}_Standard', 'c_rate': est_c_rate},
                         'data': sim_data
                    }
            except Exception as sim_err:
                 print(f"Physics Engine Route Error: {sim_err}")
                 # Non-blocking
        
        # H. Calculate Scientific Safety Score (Determinisitc)
        # Uses Physics Twin (if available) and Voltage Stability
        if metrics and 'df_std' in locals():
            physics_data = response_payload.get("analysis", {}).get("physics_twin", {}).get("data")
            safety_audit = charging_service.calculate_scientific_safety(df_std, physics_data)
            
            # Inject into response
            response_payload["metrics"]["safety_score"] = safety_audit["score"]
            response_payload["metrics"]["safety_breakdown"] = safety_audit["breakdown"]

        # G. EIS Special Handling (Phase 5 Add-on)
        dataset_type = metadata.get('dataset_type', '').lower()
        if 'impedance' in dataset_type or 'eis' in dataset_type:
             try:
                 from services.eis_service import eis_service
                 # We already have bytes in 'contents'
                 # We simply call the dedicated EIS service to parse and analyze specifically for Nyquist
                 eis_result = await eis_service.process_eis_file(contents)
                 
                 # Merge EIS results: OVERWRITE specific fields to ensure frontend switches mode
                 response_payload["type"] = "EIS" # Explicit flag for frontend
                 response_payload["data"] = eis_result # Nested rich data
                 # Optionally update plot_data if eis_service provides better plot points
                 # But frontend uses response_payload.data.nyquist_data for the ScatterChart
             except Exception as e:
                 print(f"EIS Processing Failed: {e}")
                 response_payload["analysis"]["description"] += f" (EIS Analysis Failed: {str(e)})"

        return response_payload

    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=400, detail=f"Analysis failed: {str(e)}")


@router.post("/analyze/batch")
async def analyze_batch(files: List[UploadFile] = File(...)):
    from services.batch_service import batch_service
    return await batch_service.process_batch(files)

@router.get("/history")
async def get_history():
    from services.database_service import database_service
    return database_service.get_history()

class ComparisonRequest(BaseModel):
    ids: List[int]

@router.post("/analyze/comparison")
async def analyze_comparison(request: ComparisonRequest):
    from services.database_service import database_service
    from services.charging_service import charging_service
    import base64
    
    paths = database_service.get_files_by_ids(request.ids)
    if not paths:
        raise HTTPException(status_code=400, detail="No files found for provided IDs")
    
    plot_buf = await charging_service.generate_comparison_plot(paths)
    plot_b64 = base64.b64encode(plot_buf.getvalue()).decode('utf-8')
    
    return {"plot_image": f"data:image/png;base64,{plot_b64}"}

@router.get("/history/export")
async def export_history():
    from services.database_service import database_service
    from fastapi.responses import Response
    import csv
    import io
    
    history = database_service.get_history(limit=1000)
    
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(['ID', 'Filename', 'Type', 'Capacity (Ah)', 'Energy (Wh)', 'Upload Time', 'Summary'])
    
    for row in history:
        metrics = row.get('metrics') or {}
        writer.writerow([
            row['id'],
            row['filename'],
            row['dataset_type'],
            metrics.get('capacity_ah', ''),
            metrics.get('energy_wh', ''),
            row['upload_time'],
            row['summary']
        ])
        
    return Response(content=output.getvalue(), media_type="text/csv", headers={"Content-Disposition": "attachment; filename=battery_history.csv"})


class AgingRequest(BaseModel):
    current_capacity_ah: Optional[float] = None
    nominal_capacity_ah: Optional[float] = 3.0

@router.post("/analyze/aging")
async def analyze_aging(request: AgingRequest = AgingRequest()):
    from services.aging_service import aging_service
    from services.gemini_service import gemini_service
    
    # 1. Simulate Data/Project curve based on REAL current capacity if provided
    data = await aging_service.generate_aging_curve(
        current_capacity_ah=request.current_capacity_ah,
        nominal_capacity_ah=request.nominal_capacity_ah
    )
    
    # 2. Predict with Gemini
    # prediction = await gemini_service.predict_battery_aging(...)
    
    return {
        "analysis": "Aging Analysis Placeholder",
        "aging_curve": data 
    }

# --- FLEET MONITOR ROUTES (Added Phase 2b) ---

@router.get("/fleet/data")
async def get_fleet_data():
    from services.fleet_service import fleet_service
    return fleet_service.get_current_data()

class SimulationRequest(BaseModel):
    scenario: str

@router.post("/fleet/simulate")
async def simulate_fleet_scenario(request: SimulationRequest):
    from services.fleet_service import fleet_service
    success = await fleet_service.update_simulation(request.scenario)
    return {"status": "Simulation Applied", "scenario": request.scenario, "success": success}

# --- PROCESS AUTOMATION ROUTES (Added Phase 1) ---

class MaterialRequest(BaseModel):
    type: str = "FR4-Core"
    quantity: int = 10

@router.post("/fleet/material-selection")
async def optimize_materials(request: MaterialRequest):
    from services.fleet_service import fleet_service
    return fleet_service.optimize_material_selection(request.model_dump())

@router.post("/gerber/analyze")
async def analyze_gerber(file: UploadFile = File(...)):
    from services.gerber_service import gerber_service
    from services.storage_service import storage_service
    
    # Save file to disk
    file_path = await storage_service.save_file(file)
    
    # Read content for AI (Rewind handled by save_file, but let's be safe or just read from disk/memory)
    # storage_service.save_file resets the cursor to 0.
    content_bytes = await file.read()
    try:
        content_str = content_bytes.decode('utf-8', errors='ignore')
    except:
        content_str = ""
    
    # Process
    results = await gerber_service.analyze_gerber(file.filename, file_content=content_str)
    
    # Generate EQ if needed
    eq = await gerber_service.generate_eq(results)
    
    return {"analysis": results, "engineering_questions": eq}

class EtchingRequest(BaseModel):
    copper_weight_oz: float = 1.0
    chemical_concentration_pct: float = 100.0

@router.post("/process/etching-control")
async def control_etching(request: EtchingRequest):
    from services.simulation_service import simulation_service
    return simulation_service.control_etching_process(request.copper_weight_oz, request.chemical_concentration_pct)

class LaminationRequest(BaseModel):
    material_type: str = "FR4-Standard"
    layer_count: int = 4

@router.post("/process/lamination-scaling")
async def predict_scaling(request: LaminationRequest):
    from services.simulation_service import simulation_service
    return simulation_service.predict_lamination_scaling(request.material_type, request.layer_count)


# --- VISION ROUTES (Added Phase 3) ---

@router.post("/vision/classify")
async def vision_classify(file: UploadFile = File(...)):
    from services.vision_service import vision_service
    from services.storage_service import storage_service
    
    # Save file to disk
    file_path = await storage_service.save_file(file)
    
    # Read image bytes for AI
    image_bytes = await file.read()
    
    metadata = {
        "filename": file.filename, 
        "image_data": image_bytes,
        "mime_type": file.content_type
    }
    return await vision_service.classify_defect(metadata)

@router.get("/vision/inspect-mask/{panel_id}")
async def inspect_mask(panel_id: str):
    from services.vision_service import vision_service
    return await vision_service.inspect_solder_mask(panel_id)


# --- DRILL & PLATING ROUTES (Added Phase 4) ---

class DrillRequest(BaseModel):
    drill_id: str
    current_hit_count: int

@router.post("/fleet/drill-check")
async def check_drill(request: DrillRequest):
    from services.fleet_service import fleet_service
    return fleet_service.check_drill_wear(request.drill_id, request.current_hit_count)

class PlatingRequest(BaseModel):
    panel_width_mm: float
    panel_height_mm: float

@router.post("/process/plating-optimization")
async def optimize_plating(request: PlatingRequest):
    from services.simulation_service import simulation_service
    return simulation_service.optimize_plating_distribution(request.panel_width_mm, request.panel_height_mm)


# --- COMPLIANCE ROUTES (Added Phase 5) ---

class ETestRequest(BaseModel):
    batch_id: str
    measurements: List[dict] # [{"board_id": 1, "type": "CONTINUITY", "value_ohm": 0.5}, ...]

@router.post("/compliance/electrical-test")
async def verify_etext(request: ETestRequest):
    from services.compliance_service import compliance_service
    return await compliance_service.verify_electrical_test(request.model_dump())

@router.post("/compliance/check-packaging")
async def check_package(file: UploadFile = File(...)):
    from services.compliance_service import compliance_service
    # Mock
    return await compliance_service.check_packaging({"filename": file.filename})

class CoCRequest(BaseModel):
    batch_id: str
    customer: str
    part_number: str

@router.post("/compliance/generate-certificate")
async def generate_coc(request: CoCRequest):
    from services.compliance_service import compliance_service
    return await compliance_service.generate_certificate(request.model_dump())

@router.websocket("/ws/logs")
async def websocket_logs(websocket: WebSocket):
    from services.log_stream import log_stream_service
    await log_stream_service.connect(websocket)
    try:
        while True:
            # Keep the connection alive
            await websocket.receive_text()
    except Exception:
        log_stream_service.disconnect(websocket)


# --- AGENTIC AI ROUTES (ADK Multi-Agent System) ---

class WorkflowRequest(BaseModel):
    workflow_name: str  # 'pack_audit', 'continuous_monitor'
    session_id: Optional[str] = None
    parameters: Optional[dict] = None

@router.post("/agent/workflow")
async def trigger_workflow(request: WorkflowRequest):
    """
    Trigger a Marathon Agent workflow.
    These are long-running autonomous tasks.
    """
    from services.agent_service import agent_service
    
    result = await agent_service.run_workflow(
        workflow_name=request.workflow_name,
        session_id=request.session_id or "default",
        parameters=request.parameters
    )
    return result

@router.get("/agent/session/{session_id}")
async def get_agent_session(session_id: str):
    """Get the current state of an agent session."""
    from services.agent_service import agent_service
    
    state = agent_service.get_session_state(session_id)
    return {"session_id": session_id, "state": state}

@router.get("/agent/status")
async def get_agent_status():
    """Check if the ADK agent system is available."""
    try:
        from services.agent_service import agent_service
        agent_service._initialize()
        
        return {
            "status": "online",
            "adk_available": agent_service._initialized,
            "mode": "adk" if agent_service._initialized else "fallback",
            "agents": [
                "BatteryForgeCommander",
                "DefectAnalysisAgent",
                "ChargingOptimizationAgent",
                "FleetCommanderAgent",
                "SafetyGuardianAgent",
                "PredictiveMaintenanceAgent"
            ],
            "workflows": [
                "PackAuditWorkflow",
                "ContinuousMonitorWorkflow"
            ]
        }
    except Exception as e:
        return {
            "status": "error",
            "error": str(e),
            "mode": "offline"
        }

@router.websocket("/ws/agent")
async def agent_websocket(websocket: WebSocket):
    """
    WebSocket for real-time agent streaming.
    Provides live updates on agent execution, tool calls, and responses.
    """
    await websocket.accept()
    
    try:
        from battery_forge_agent.shared.callbacks import agent_callbacks
        agent_callbacks.set_websocket(websocket)
        
        while True:
            # Receive messages from client
            data = await websocket.receive_json()
            
            # Handle incoming commands
            if data.get("type") == "chat":
                from services.agent_service import agent_service
                result = await agent_service.chat(
                    message=data.get("message", ""),
                    session_id=data.get("session_id", "default"),
                    context=data.get("context")
                )
                await websocket.send_json({
                    "type": "response",
                    "data": result
                })
            elif data.get("type") == "workflow":
                from services.agent_service import agent_service
                result = await agent_service.run_workflow(
                    workflow_name=data.get("workflow_name"),
                    session_id=data.get("session_id", "default"),
                    parameters=data.get("parameters")
                )
                await websocket.send_json({
                    "type": "workflow_result",
                    "data": result
                })
            elif data.get("type") == "ping":
                await websocket.send_json({"type": "pong"})
                
    except Exception as e:
        print(f"Agent WebSocket error: {e}")
    finally:
        try:
            from battery_forge_agent.shared.callbacks import agent_callbacks
            agent_callbacks.set_websocket(None)
        except:
            pass
