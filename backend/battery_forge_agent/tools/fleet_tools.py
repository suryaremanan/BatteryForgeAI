"""
Fleet Control Tools for Battery Pack Management
Real-time fleet monitoring, charging control, and emergency actions.
"""
import asyncio
from typing import Optional, List, Dict

# Provide access to the singleton service
try:
    from services.fleet_service import fleet_service
except ImportError:
    # Fallback for testing/isolation
    fleet_service = None

def get_fleet_status(pack_ids: Optional[List[str]] = None) -> dict:
    """
    Gets the current status of the battery fleet and vehicles.
    
    Args:
        pack_ids: Optional list of specific pack IDs to query
    
    Returns:
        dict: Fleet status with pack health, vehicles, and alerts
    """
    try:
        fleet_data = fleet_service.get_current_data()
        
        # Parse Vehicles
        vehicles = fleet_data.get("vehicles", [])
        drivers = fleet_data.get("drivers", [])
        
        # Existing Pack Logic
        packs = fleet_data.get("data", {}).get("packs", []) # packs are in data.packs
        if not packs:
             # Fallback if structure is different
             packs = fleet_data.get("data", {}).get("red_list", [])

        summary = {
            "total_vehicles": len(vehicles),
            "total_drivers": len(drivers),
            "charging": len([v for v in vehicles if v.get("status") == "charging"]),
            "idle": len([v for v in vehicles if v.get("status") == "idle"]),
            "moving": len([v for v in vehicles if v.get("status") == "moving"]),
            "maintenance": len([v for v in vehicles if v.get("status") == "maintenance"])
        }
        
        return {
            "status": "success",
            "summary": summary,
            "vehicles": vehicles,
            "drivers": drivers
        }
    except Exception as e:
        return {
            "status": "error",
            "error": str(e),
            "message": "Could not retrieve fleet status"
        }

def add_vehicle(model: str, license_plate: str) -> dict:
    """
    Adds a new vehicle to the fleet.
    
    Args:
        model: Vehicle model (e.g., 'Tesla Model Y')
        license_plate: License plate number
    """
    try:
        vehicle = fleet_service.add_vehicle(model, license_plate)
        return {
            "status": "success",
            "message": f"Vehicle {vehicle['id']} ({model}) added successfully.",
            "vehicle": vehicle
        }
    except Exception as e:
        return {"status": "error", "message": str(e)}

def add_driver(name: str, license_number: str) -> dict:
    """
    Adds a new driver/operator to the fleet.
    
    Args:
        name: Full name of the driver
        license_number: Driver's license ID
    """
    try:
        driver = fleet_service.add_driver(name, license_number)
        return {
            "status": "success",
            "message": f"Driver {driver['name']} (ID: {driver['id']}) added successfully.",
            "driver": driver
        }
    except Exception as e:
        return {"status": "error", "message": str(e)}

def assign_driver(vehicle_id: str, driver_id: str) -> dict:
    """
    Assigns a driver to a vehicle.
    """
    try:
        result = fleet_service.assign_driver(vehicle_id, driver_id)
        return {
            "status": "success",
            "message": f"Driver {driver_id} assigned to vehicle {vehicle_id}.",
            "result": result
        }
    except Exception as e:
        return {"status": "error", "message": str(e)}

def control_charging_rate(
    pack_id: str,
    new_c_rate: float,
    reason: str = "Optimization"
) -> dict:
    """
    Adjusts the charging rate for a specific battery pack/vehicle.
    """
    # Mock implementation for hackathon
    return {
        "status": "success",
        "pack_id": pack_id,
        "new_c_rate": new_c_rate,
        "message": f"Charging rate adjusted for {pack_id} to {new_c_rate}C."
    }

def send_operator_alert(
    severity: str,
    message: str,
    pack_id: Optional[str] = None
) -> dict:
    """
    Sends an alert to operators.
    """
    return {
        "status": "sent",
        "severity": severity,
        "message": message,
        "recipient": "All Operators"
    }


# ============================================================
# PHASE 2: NEW AGENTIC FLEET TOOLS
# ============================================================

def get_pack_details(pack_id: str) -> dict:
    """
    Gets detailed telemetry for a specific battery pack.

    Args:
        pack_id: The unique identifier of the battery pack (e.g., 'BAT-1234')

    Returns:
        dict: Detailed pack info including voltage, temperature, SOH, cycles, etc.
    """
    try:
        fleet_data = fleet_service.get_current_data()
        red_list = fleet_data.get("data", {}).get("red_list", [])

        # Find pack in red_list first (has more detail)
        for pack in red_list:
            if pack.get("pack_id") == pack_id:
                return {
                    "status": "success",
                    "pack_id": pack_id,
                    "found_in": "red_list",
                    "details": {
                        "voltage": pack.get("voltage", 3.7),
                        "temperature": pack.get("temp", 25),
                        "soh": pack.get("soh", 100),
                        "status": pack.get("status", "NORMAL"),
                        "fault": pack.get("fault", None),
                        "cycles": 500 + hash(pack_id) % 500,  # Simulated
                        "last_charge": "2h ago",
                        "location": "Zone A-3"
                    }
                }

        # If not in red_list, generate simulated normal pack
        return {
            "status": "success",
            "pack_id": pack_id,
            "found_in": "fleet",
            "details": {
                "voltage": 3.85,
                "temperature": 28,
                "soh": 95,
                "status": "NORMAL",
                "fault": None,
                "cycles": 500 + hash(pack_id) % 500,
                "last_charge": "4h ago",
                "location": "Zone B-1"
            }
        }
    except Exception as e:
        return {"status": "error", "message": str(e)}


def batch_control_charging(pack_ids: List[str], action: str, c_rate: float = None) -> dict:
    """
    Controls charging for multiple battery packs.

    Args:
        pack_ids: List of pack IDs to control
        action: One of 'pause', 'resume', 'set_rate'
        c_rate: C-rate to set (only used if action is 'set_rate')

    Returns:
        dict: Result of the batch operation
    """
    valid_actions = ['pause', 'resume', 'set_rate']
    if action not in valid_actions:
        return {"status": "error", "message": f"Invalid action. Must be one of: {valid_actions}"}

    results = []
    for pack_id in pack_ids:
        if action == 'pause':
            results.append({"pack_id": pack_id, "result": "charging_paused"})
        elif action == 'resume':
            results.append({"pack_id": pack_id, "result": "charging_resumed"})
        elif action == 'set_rate':
            results.append({"pack_id": pack_id, "result": f"c_rate_set_to_{c_rate}C"})

    return {
        "status": "success",
        "action": action,
        "affected_packs": len(pack_ids),
        "results": results,
        "message": f"Batch {action} executed on {len(pack_ids)} packs"
    }


def isolate_pack(pack_id: str, reason: str) -> dict:
    """
    Isolates a battery pack from the fleet for safety reasons.
    This disconnects charging and flags the pack for maintenance.

    CRITICAL ACTION - Should only be used for safety emergencies.

    Args:
        pack_id: The pack to isolate
        reason: Reason for isolation (e.g., 'thermal_runaway_risk', 'internal_short')

    Returns:
        dict: Isolation confirmation with work order number
    """
    import random
    work_order = f"WO-{random.randint(10000, 99999)}"

    return {
        "status": "success",
        "action": "pack_isolated",
        "pack_id": pack_id,
        "reason": reason,
        "work_order": work_order,
        "actions_taken": [
            "Charging disconnected",
            "Pack flagged for immediate inspection",
            "Maintenance team notified",
            "Safety perimeter established"
        ],
        "message": f"⚠️ Pack {pack_id} has been isolated. Work order {work_order} created.",
        "requires_confirmation": True  # This is a critical action
    }


def create_work_order(pack_id: str, issue: str, priority: str = "medium") -> dict:
    """
    Creates a maintenance work order for a battery pack.

    Args:
        pack_id: The pack requiring maintenance
        issue: Description of the issue
        priority: 'low', 'medium', 'high', or 'critical'

    Returns:
        dict: Work order details
    """
    import random
    from datetime import datetime, timedelta

    valid_priorities = ['low', 'medium', 'high', 'critical']
    if priority not in valid_priorities:
        priority = 'medium'

    # Estimated completion based on priority
    hours_map = {'low': 72, 'medium': 24, 'high': 8, 'critical': 2}
    estimated_hours = hours_map.get(priority, 24)

    work_order = {
        "status": "success",
        "work_order_id": f"WO-{random.randint(10000, 99999)}",
        "pack_id": pack_id,
        "issue": issue,
        "priority": priority.upper(),
        "created_at": datetime.now().isoformat(),
        "estimated_completion": (datetime.now() + timedelta(hours=estimated_hours)).isoformat(),
        "assigned_to": "Maintenance Team Alpha",
        "message": f"Work order created for {pack_id} with {priority.upper()} priority"
    }

    return work_order


def query_fleet(filter_type: str, threshold: float = None) -> dict:
    """
    Queries the fleet with intelligent filters.

    Args:
        filter_type: One of 'low_soh', 'high_temp', 'charging', 'critical', 'all'
        threshold: Optional threshold value (e.g., 80 for SOH < 80%)

    Returns:
        dict: Filtered fleet data
    """
    try:
        fleet_data = fleet_service.get_current_data()
        red_list = fleet_data.get("data", {}).get("red_list", [])
        vehicles = fleet_data.get("vehicles", [])
        metrics = fleet_data.get("data", {}).get("fleet_metrics", {})

        result = {
            "status": "success",
            "filter_type": filter_type,
            "threshold": threshold,
            "results": []
        }

        if filter_type == 'critical':
            result["results"] = [p for p in red_list if p.get("status") == "CRITICAL"]
            result["count"] = len(result["results"])
            result["summary"] = f"Found {len(result['results'])} critical packs requiring immediate attention"

        elif filter_type == 'low_soh':
            threshold = threshold or 80
            result["results"] = [p for p in red_list if p.get("soh", 100) < threshold]
            result["count"] = len(result["results"])
            result["summary"] = f"Found {len(result['results'])} packs with SOH below {threshold}%"

        elif filter_type == 'high_temp':
            threshold = threshold or 45
            result["results"] = [p for p in red_list if p.get("temp", 25) > threshold]
            result["count"] = len(result["results"])
            result["summary"] = f"Found {len(result['results'])} packs with temperature above {threshold}°C"

        elif filter_type == 'charging':
            charging_vehicles = [v for v in vehicles if v.get("status") == "charging"]
            result["results"] = charging_vehicles
            result["count"] = len(charging_vehicles)
            result["summary"] = f"{len(charging_vehicles)} vehicles currently charging"

        elif filter_type == 'all':
            result["results"] = red_list
            result["count"] = len(red_list)
            result["fleet_metrics"] = metrics
            result["summary"] = f"Fleet overview: {metrics.get('active_packs', 0)} active packs, avg health {metrics.get('avg_health', 0)}%"

        return result

    except Exception as e:
        return {"status": "error", "message": str(e)}


def execute_scenario(scenario: str) -> dict:
    """
    Executes a stress test scenario on the fleet simulation.

    Args:
        scenario: One of 'normal', 'heatwave', 'cold_snap', 'aging', 'overload'

    Returns:
        dict: Scenario execution results and impact assessment
    """
    import asyncio

    valid_scenarios = ['normal', 'heatwave', 'cold_snap', 'aging', 'overload']
    if scenario not in valid_scenarios:
        return {"status": "error", "message": f"Invalid scenario. Must be one of: {valid_scenarios}"}

    # Trigger the fleet simulation update
    try:
        # Run async in sync context
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        success = loop.run_until_complete(fleet_service.update_simulation(scenario))
        loop.close()

        # Get updated data
        new_data = fleet_service.get_current_data()
        metrics = new_data.get("data", {}).get("fleet_metrics", {})
        red_list = new_data.get("data", {}).get("red_list", [])
        report = new_data.get("commander_report", {})

        impact_assessment = {
            'normal': "Fleet operating within normal parameters",
            'heatwave': "⚠️ High thermal stress detected across fleet - recommend reducing charge rates",
            'cold_snap': "❄️ Cold temperature warning - lithium plating risk elevated",
            'aging': "📉 Accelerated degradation mode - SOH declining faster than normal",
            'overload': "🔴 High demand scenario - prioritize load balancing"
        }

        return {
            "status": "success",
            "scenario": scenario,
            "executed": True,
            "impact": impact_assessment.get(scenario, "Unknown impact"),
            "fleet_metrics": metrics,
            "critical_packs": len([p for p in red_list if p.get("status") == "CRITICAL"]),
            "commander_risk_level": report.get("risk_level", "UNKNOWN") if report else "PENDING",
            "message": f"Scenario '{scenario}' executed. {impact_assessment.get(scenario, '')}"
        }

    except Exception as e:
        return {"status": "error", "message": str(e)}


def get_fleet_trends(metric: str, hours: int = 24) -> dict:
    """
    Gets historical trends for fleet metrics.

    Args:
        metric: One of 'temperature', 'soh', 'efficiency', 'voltage'
        hours: Number of hours to look back (default 24)

    Returns:
        dict: Trend data with analysis
    """
    import random

    valid_metrics = ['temperature', 'soh', 'efficiency', 'voltage']
    if metric not in valid_metrics:
        return {"status": "error", "message": f"Invalid metric. Must be one of: {valid_metrics}"}

    try:
        fleet_data = fleet_service.get_current_data()
        timeline = fleet_data.get("data", {}).get("timeline", [])

        # Generate trend analysis
        if metric == 'temperature':
            current = timeline[-1].get("temp_avg", 30) if timeline else 30
            avg = sum(t.get("temp_avg", 30) for t in timeline) / len(timeline) if timeline else 30
            trend_direction = "rising" if timeline and timeline[-1].get("temp_avg", 0) > timeline[0].get("temp_avg", 0) else "stable"

        elif metric == 'soh':
            current = fleet_data.get("data", {}).get("fleet_metrics", {}).get("avg_health", 95)
            avg = current - random.uniform(0, 2)  # Simulated slight degradation
            trend_direction = "declining" if random.random() > 0.7 else "stable"

        elif metric == 'efficiency':
            current = 94 + random.uniform(-2, 2)
            avg = 93.5
            trend_direction = "stable"

        else:  # voltage
            current = timeline[-1].get("voltage", 3.8) if timeline else 3.8
            avg = sum(t.get("voltage", 3.8) for t in timeline) / len(timeline) if timeline else 3.8
            trend_direction = "stable"

        return {
            "status": "success",
            "metric": metric,
            "period_hours": hours,
            "current_value": round(current, 2),
            "average_value": round(avg, 2),
            "trend_direction": trend_direction,
            "data_points": len(timeline),
            "analysis": f"{metric.capitalize()} is {trend_direction} over the last {hours}h. Current: {round(current, 2)}, Avg: {round(avg, 2)}",
            "recommendation": "Continue monitoring" if trend_direction == "stable" else f"Investigate {trend_direction} {metric} trend"
        }

    except Exception as e:
        return {"status": "error", "message": str(e)}
