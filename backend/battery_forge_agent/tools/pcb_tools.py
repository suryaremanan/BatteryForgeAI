"""
PCB Manufacturing Tools for AI Commander Agent
Wraps gemini_service PCB methods and provides simulated factory data.
"""
import os
import json
import asyncio
import random
import base64
from typing import Optional, List

import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

# Vision model for PCB inspection
vision_model = genai.GenerativeModel('gemini-3-flash-preview')


# ==========================================
# DESIGN TOOLS
# ==========================================

def generate_pcb_design(specs: str) -> dict:
    """
    Generates a PCB design critique and preliminary design plan from specifications.
    Acts as an engineering intern — asks clarifying questions if info is missing,
    otherwise produces a block diagram and constraint definitions.

    Args:
        specs: Natural language description of the PCB requirements (e.g. 'BMS for 4S LiPo, USB-C, CAN bus')

    Returns:
        dict: Design plan with blocks, interconnections, and constraint definitions,
              or clarifying questions if specs are insufficient.
    """
    try:
        from services.gemini_service import gemini_service
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        try:
            result = loop.run_until_complete(
                gemini_service.generate_pcb_design_critique(specs)
            )
            return result
        finally:
            loop.close()
    except Exception as e:
        return {"error": str(e)}


def explore_pcb_routing(
    grid_size: int = 10,
    start: str = "0,0",
    target: str = "9,9",
    obstacles: str = "2,2;2,3",
    current_head: str = "4,4"
) -> dict:
    """
    Uses AI-powered reinforcement learning to find the optimal next routing step
    on a PCB grid, avoiding obstacles and minimizing trace length.

    Args:
        grid_size: Size of the routing grid (e.g. 10 for a 10x10 grid)
        start: Start coordinate as 'x,y' (e.g. '0,0')
        target: Target coordinate as 'x,y' (e.g. '9,9')
        obstacles: Semicolon-separated obstacle coordinates (e.g. '2,2;2,3')
        current_head: Current routing head position as 'x,y' (e.g. '4,4')

    Returns:
        dict: Next move recommendation with action, confidence, and reasoning
    """
    try:
        from services.gemini_service import gemini_service

        # Parse string inputs to lists
        start_list = [int(x) for x in start.split(",")]
        target_list = [int(x) for x in target.split(",")]
        current_head_list = [int(x) for x in current_head.split(",")]
        obstacle_list = [[int(x) for x in obs.split(",")] for obs in obstacles.split(";") if obs]

        grid_state = {
            "grid_size": [grid_size, grid_size],
            "obstacles": obstacle_list,
            "start": start_list,
            "target": target_list,
            "current_head": current_head_list
        }

        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        try:
            result = loop.run_until_complete(
                gemini_service.explore_design_space(grid_state)
            )
            return result
        finally:
            loop.close()
    except Exception as e:
        return {"error": str(e)}


# ==========================================
# QUALITY / VISION TOOLS
# ==========================================

def inspect_pcb_aoi(image_base64: str, mime_type: str = "image/jpeg") -> dict:
    """
    Performs AI-powered Automated Optical Inspection (AOI) on a PCB image.
    Detects solder bridges, cold joints, tombstoning, missing components,
    and other manufacturing defects visible under optical inspection.

    Args:
        image_base64: Base64 encoded image of the PCB to inspect
        mime_type: MIME type of the image (e.g. 'image/jpeg', 'image/png')

    Returns:
        dict: Inspection results with defects found, severity, and recommended actions
    """
    prompt = """
    Act as a Senior SMT Vision Inspector (AOI Expert).
    Analyze this PCB image for manufacturing defects.

    Detect: Solder bridges, solder voids, cold joints, tombstoning,
    missing components, component misalignment, scratches, delamination.

    Filter false positives: Exclude cosmetic variations (laser marking glare,
    silk screen irregularities, harmless flux residue).

    Classify severity per IPC-A-610 Class 2:
    - FATAL: Open Circuit / Short Circuit / Missing Component
    - COSMETIC: Acceptable per IPC-A-610

    Return JSON:
    {
        "defects_found": [
            {"type": "Solder Bridge", "severity": "FATAL", "location": "U1 Pin 3-4", "confidence": 98, "action": "Rework"}
        ],
        "verdict": "PASS" | "FAIL",
        "summary": "Description of findings",
        "fatal_count": 0,
        "cosmetic_count": 0,
        "inspection_standard": "IPC-A-610 Class 2"
    }
    """
    try:
        image_data = base64.b64decode(image_base64)
        response = vision_model.generate_content([
            prompt,
            {"mime_type": mime_type, "data": image_data}
        ])
        text = response.text.replace("```json", "").replace("```", "").strip()
        start_idx = text.find('{')
        end_idx = text.rfind('}')
        if start_idx != -1 and end_idx != -1:
            return json.loads(text[start_idx:end_idx + 1])
        return {"error": "Could not parse response", "raw": text}
    except Exception as e:
        return {"error": str(e)}


def inspect_pcb_xray(image_base64: str, mime_type: str = "image/jpeg") -> dict:
    """
    Performs AI-powered X-ray inspection of PCB internals.
    Detects hidden defects like BGA voids, barrel distortion,
    layer misalignment, and head-in-pillow defects.

    Args:
        image_base64: Base64 encoded X-ray image of the PCB
        mime_type: MIME type of the image (e.g. 'image/jpeg', 'image/png')

    Returns:
        dict: X-ray analysis with BGA void analysis, layer alignment status, and anomalies
    """
    prompt = """
    Act as an AXI (Automated X-ray Inspection) Expert.
    Analyze this X-ray image of a PCB/BGA component.

    Check for:
    1. Head-in-Pillow (HiP) defects
    2. Voids > 25% of ball area
    3. Via Barrel Distortion
    4. Layer Misalignment / Pad Offset

    Return JSON:
    {
        "inspection_type": "3D AXI",
        "bga_analysis": {
            "voids_found": true,
            "max_void_percentage": 15.0,
            "status": "PASS" | "FAIL"
        },
        "layer_alignment": {
            "misalignment_um": 5,
            "status": "GOOD" | "WARNING" | "FAIL",
            "barrel_distortion_detected": false
        },
        "anomalies": ["description of any anomalies found"]
    }
    """
    try:
        image_data = base64.b64decode(image_base64)
        response = vision_model.generate_content([
            prompt,
            {"mime_type": mime_type, "data": image_data}
        ])
        text = response.text.replace("```json", "").replace("```", "").strip()
        start_idx = text.find('{')
        end_idx = text.rfind('}')
        if start_idx != -1 and end_idx != -1:
            return json.loads(text[start_idx:end_idx + 1])
        return {"error": "Could not parse response", "raw": text}
    except Exception as e:
        return {"error": str(e)}


# ==========================================
# PACK ASSEMBLY & LINE MONITORING TOOLS
# ==========================================

def get_cnc_fleet_status() -> dict:
    """
    Returns status of battery pack assembly line stations.
    Simulates realistic production data for demo purposes.
    Includes cell sorting, module stacking, tab welding, and EOL testing stations.

    Returns:
        dict: Pack assembly line status with stations and summary statistics
    """
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
            "last_maintenance": "2024-01-25"
        },
        {
            "id": "STATION-TIM",
            "name": "Thermal Interface Application",
            "type": "Thermal",
            "status": "RUNNING",
            "throughput_pph": 42,
            "current_batch": "BATCH-2024-0892",
            "tim_coverage_pct": round(random.uniform(94, 98), 1),
            "dispense_volume_ml": 15.2,
            "uptime_hours": 1580,
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
            "last_maintenance": "2024-01-22"
        }
    ]
    return {
        "stations": stations,
        "line_efficiency": 0.87,
        "daily_target": 500,
        "daily_actual": 435,
        "shift": "Day Shift A",
        "total": len(stations),
        "running": sum(1 for s in stations if s["status"] == "RUNNING"),
        "warnings": sum(1 for s in stations if s["status"] == "WARNING")
    }


def get_drill_inventory() -> dict:
    """
    Returns cell inventory status for battery pack assembly.
    Includes cell SKUs from major vendors with quantity, grade, and status.

    Returns:
        dict: Cell inventory with list of cell types and summary statistics
    """
    cells = [
        {"sku": "NMC-21700-50E", "vendor": "Samsung SDI", "qty": 12500, "status": "OK", "grade": "A", "capacity_ah": 5.0, "voltage_nominal": 3.6, "location": "CELL-STORAGE-A1"},
        {"sku": "NMC-21700-50E", "vendor": "Samsung SDI", "qty": 1200, "status": "OK", "grade": "B", "capacity_ah": 4.8, "voltage_nominal": 3.6, "location": "CELL-STORAGE-A2"},
        {"sku": "LFP-280AH-CATL", "vendor": "CATL", "qty": 450, "status": "LOW", "grade": "A", "capacity_ah": 280, "voltage_nominal": 3.2, "min_qty": 500, "location": "CELL-STORAGE-B1"},
        {"sku": "NCA-18650-35E", "vendor": "Samsung SDI", "qty": 8000, "status": "OK", "grade": "A", "capacity_ah": 3.5, "voltage_nominal": 3.6, "location": "CELL-STORAGE-C1"},
        {"sku": "LFP-100AH-EVE", "vendor": "EVE Energy", "qty": 620, "status": "OK", "grade": "A", "capacity_ah": 100, "voltage_nominal": 3.2, "location": "CELL-STORAGE-B2"},
        {"sku": "NMC-POUCH-60AH", "vendor": "LG Chem", "qty": 180, "status": "CRITICAL", "grade": "A", "capacity_ah": 60, "voltage_nominal": 3.7, "min_qty": 200, "location": "CELL-STORAGE-D1"},
        {"sku": "NMC-21700-50G", "vendor": "Samsung SDI", "qty": 5500, "status": "OK", "grade": "A", "capacity_ah": 5.0, "voltage_nominal": 3.6, "location": "CELL-STORAGE-A3"},
        {"sku": "LFP-BLADE-138AH", "vendor": "BYD", "qty": 340, "status": "OK", "grade": "A", "capacity_ah": 138, "voltage_nominal": 3.2, "location": "CELL-STORAGE-B3"}
    ]
    return {
        "cells": cells,
        "total_skus": len(cells),
        "low_stock_alerts": sum(1 for c in cells if c["status"] == "LOW"),
        "ok": sum(1 for c in cells if c["status"] == "OK"),
        "warning": sum(1 for c in cells if c["status"] == "LOW"),
        "critical": sum(1 for c in cells if c["status"] == "CRITICAL")
    }


def analyze_cnc_thermal(
    machine_id: str = "CNC-DRILL-01",
    spindle_temp: float = 65.0,
    ambient_temp: float = 25.0,
    load: float = 80.0
) -> dict:
    """
    Analyzes CNC machine thermal health using AI. Detects bearing wear,
    coolant issues, and overheating risks based on spindle temperature,
    ambient temperature, and current load percentage.

    Args:
        machine_id: Machine identifier (e.g. 'CNC-DRILL-01')
        spindle_temp: Current spindle temperature in Celsius
        ambient_temp: Ambient temperature in Celsius
        load: Current machine load as percentage (0-100)

    Returns:
        dict: Thermal analysis with status, diagnosis, risk factors, and recommended actions
    """
    try:
        from services.gemini_service import gemini_service
        thermal_data = {
            "machine_id": machine_id,
            "spindle_temp_c": spindle_temp,
            "ambient_temp_c": ambient_temp,
            "load_percent": load
        }
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        try:
            result = loop.run_until_complete(
                gemini_service.analyze_thermal_health(thermal_data)
            )
            return result
        finally:
            loop.close()
    except Exception as e:
        return {"error": str(e)}


def predict_drill_life(
    hits: int = 8000,
    resin_smear: str = "medium",
    feed_deviation: float = 0.05
) -> dict:
    """
    Predicts remaining useful life of a drill bit based on usage metrics.
    Analyzes hit count, resin smear level, and feed rate deviation to
    estimate breakage probability and recommend replacement timing.

    Args:
        hits: Number of hits (holes drilled) so far
        resin_smear: Resin smear level ('none', 'low', 'medium', 'high')
        feed_deviation: Feed rate deviation from nominal (0.0 = perfect, higher = worse)

    Returns:
        dict: Drill life prediction with RUL, breakage probability, and action
    """
    try:
        from services.gemini_service import gemini_service
        tool_logs = {
            "hits": hits,
            "resin_smear_level": resin_smear,
            "feed_rate_deviation": feed_deviation
        }
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        try:
            result = loop.run_until_complete(
                gemini_service.predict_tool_life(tool_logs)
            )
            return result
        finally:
            loop.close()
    except Exception as e:
        return {"error": str(e)}


def analyze_vibration_signals(
    machine_id: str = "CNC-DRILL-01",
    fft_peaks: str = "1200:0.5;800:0.3",
    rms_vibration: float = 1.2
) -> dict:
    """
    Analyzes vibration sensor data from CNC machines to detect
    bearing wear, loose belts, and spindle runout. Uses FFT frequency
    peaks and RMS vibration levels for predictive maintenance.

    Args:
        machine_id: Machine identifier (e.g. 'CNC-DRILL-01')
        fft_peaks: FFT peaks as 'freq:amp' pairs separated by semicolons (e.g. '1200:0.5;800:0.3')
        rms_vibration: RMS vibration level in mm/s

    Returns:
        dict: Vibration analysis with health status, diagnosis, and maintenance window
    """
    try:
        from services.gemini_service import gemini_service

        # Parse FFT peaks from string format
        peaks = []
        for peak_str in fft_peaks.split(";"):
            if ":" in peak_str:
                parts = peak_str.split(":")
                peaks.append({"freq": float(parts[0]), "amp": float(parts[1])})

        sensor_payload = {
            "machine_id": machine_id,
            "fft_peaks": peaks,
            "rms_vibration": rms_vibration
        }
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        try:
            result = loop.run_until_complete(
                gemini_service.analyze_maintenance_signals(sensor_payload)
            )
            return result
        finally:
            loop.close()
    except Exception as e:
        return {"error": str(e)}


# ==========================================
# SUPPLY CHAIN TOOLS
# ==========================================

def check_supply_chain_risk(components: str = "IC-XYZ,CAP-100uF,RES-10K") -> dict:
    """
    Analyzes PCB BOM components for supply chain risks including
    geopolitical risks, end-of-life concerns, and sole-source dependencies.
    Suggests alternative components when risks are identified.

    Args:
        components: Comma-separated list of component part numbers to analyze

    Returns:
        dict: Risk analysis with high-risk components and suggested alternatives
    """
    try:
        from services.gemini_service import gemini_service
        component_list = [c.strip() for c in components.split(",")]
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        try:
            result = loop.run_until_complete(
                gemini_service.monitor_supply_risk(component_list)
            )
            return result
        finally:
            loop.close()
    except Exception as e:
        return {"error": str(e)}


def forecast_material_inventory(
    material: str = "Copper Foil 1oz",
    usage_rate: float = 50.0,
    lead_time: int = 14,
    trend: str = "Stable"
) -> dict:
    """
    Forecasts material inventory needs for PCB manufacturing.
    Calculates strategic buffer stock based on usage rate,
    lead time, and market conditions.

    Args:
        material: Material name (e.g. 'Copper Foil 1oz', 'FR-4 Laminate')
        usage_rate: Daily usage rate in units
        lead_time: Supplier lead time in days
        trend: Market trend ('Stable', 'Shortage', 'Surplus')

    Returns:
        dict: Inventory forecast with recommended order quantity and urgency
    """
    try:
        from services.gemini_service import gemini_service
        usage_data = {
            "material": material,
            "usage_rate_per_day": usage_rate,
            "lead_time_days": lead_time,
            "market_trend": trend
        }
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        try:
            result = loop.run_until_complete(
                gemini_service.forecast_inventory(usage_data)
            )
            return result
        finally:
            loop.close()
    except Exception as e:
        return {"error": str(e)}


# ==========================================
# PROCESS CONTROL TOOLS
# ==========================================

def control_etching_process(
    process: str = "Etching",
    ph_level: float = 3.2,
    copper_removed: float = 15.0,
    target: float = 18.0
) -> dict:
    """
    Analyzes real-time etching/lamination process sensor data and recommends
    PLC parameter adjustments. Detects under-etching and over-etching conditions
    and provides closed-loop feedback for process control.

    Args:
        process: Process type (e.g. 'Etching', 'Lamination')
        ph_level: Current pH level of the etchant
        copper_removed: Copper thickness removed in micrometers
        target: Target copper removal in micrometers

    Returns:
        dict: Process control recommendation with adjustment commands
    """
    try:
        from services.gemini_service import gemini_service
        sensor_readings = {
            "process": process,
            "ph_level": ph_level,
            "copper_thickness_removed": copper_removed,
            "target": target
        }
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        try:
            result = loop.run_until_complete(
                gemini_service.analyze_process_control_loop(sensor_readings)
            )
            return result
        finally:
            loop.close()
    except Exception as e:
        return {"error": str(e)}
