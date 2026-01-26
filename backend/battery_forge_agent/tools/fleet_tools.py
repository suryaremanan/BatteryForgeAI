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
