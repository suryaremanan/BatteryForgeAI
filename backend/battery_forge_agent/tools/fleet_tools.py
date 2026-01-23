"""
Fleet Control Tools for Battery Pack Management
Real-time fleet monitoring, charging control, and emergency actions.
"""
import asyncio
from typing import Optional, List


def get_fleet_status(pack_ids: Optional[List[str]] = None) -> dict:
    """
    Gets the current status of the battery fleet.
    
    Args:
        pack_ids: Optional list of specific pack IDs to query
    
    Returns:
        dict: Fleet status with pack health, temperatures, and alerts
    """
    try:
        from services.fleet_service import fleet_service
        
        fleet_data = fleet_service.get_current_data()
        
        packs = fleet_data.get("packs", [])
        
        # Filter if specific packs requested
        if pack_ids:
            packs = [p for p in packs if p.get("id") in pack_ids]
        
        # Calculate summary statistics
        if packs:
            statuses = [p.get("status", "Unknown") for p in packs]
            temps = [p.get("temperature", 25) for p in packs]
            sohs = [p.get("soh", 100) for p in packs]
            
            summary = {
                "total_packs": len(packs),
                "healthy": statuses.count("Healthy"),
                "warning": statuses.count("Warning"),
                "critical": statuses.count("Critical"),
                "avg_temperature": round(sum(temps) / len(temps), 1),
                "max_temperature": max(temps),
                "min_soh": min(sohs),
                "avg_soh": round(sum(sohs) / len(sohs), 1)
            }
        else:
            summary = {"total_packs": 0}
        
        # Identify critical packs
        critical_packs = [
            {"id": p.get("id"), "issue": p.get("status"), "temp": p.get("temperature"), "soh": p.get("soh")}
            for p in packs
            if p.get("status") == "Critical" or p.get("temperature", 0) > 55
        ]
        
        return {
            "status": "success",
            "timestamp": fleet_data.get("timestamp"),
            "summary": summary,
            "critical_alerts": critical_packs,
            "packs": packs[:20] if len(packs) > 20 else packs,  # Limit for response size
            "full_data_available": len(packs)
        }
    except Exception as e:
        return {
            "status": "error",
            "error": str(e),
            "message": "Could not retrieve fleet status"
        }


def control_charging_rate(
    pack_id: str,
    new_c_rate: float,
    reason: str = "Optimization"
) -> dict:
    """
    Adjusts the charging rate for a specific battery pack.
    
    Args:
        pack_id: Battery pack identifier
        new_c_rate: New C-rate (e.g., 0.5, 1.0, 2.0)
        reason: Reason for adjustment
    
    Returns:
        dict: Confirmation of charging rate adjustment
    """
    # Validate C-rate range
    if not 0.1 <= new_c_rate <= 3.0:
        return {
            "status": "error",
            "error": "C-rate must be between 0.1 and 3.0",
            "pack_id": pack_id
        }
    
    # Safety check for high C-rates
    if new_c_rate > 2.0:
        warning = "WARNING: High C-rate may accelerate degradation and increase thermal risk"
    elif new_c_rate < 0.5:
        warning = "NOTE: Low C-rate will extend charging time significantly"
    else:
        warning = None
    
    # In production, this would send command to BMS
    result = {
        "status": "success",
        "pack_id": pack_id,
        "previous_c_rate": 1.0,  # Would be fetched from actual pack state
        "new_c_rate": new_c_rate,
        "reason": reason,
        "applied": True,
        "estimated_charge_time_hours": round(1.0 / new_c_rate, 2),
        "summary": f"Charging rate for {pack_id} adjusted to {new_c_rate}C. Reason: {reason}"
    }
    
    if warning:
        result["warning"] = warning
    
    return result


def initiate_emergency_shutdown(
    pack_id: str,
    reason: str,
    force: bool = False
) -> dict:
    """
    Initiates emergency shutdown of a battery pack.
    THIS IS A CRITICAL SAFETY ACTION - Should require Human-in-the-Loop confirmation.
    
    Args:
        pack_id: Battery pack identifier
        reason: Emergency reason (e.g., 'Thermal Runaway Detected', 'Fire', 'Smoke')
        force: Force immediate shutdown without confirmation (use with extreme caution)
    
    Returns:
        dict: Shutdown status and confirmation requirements
    """
    import datetime
    
    timestamp = datetime.datetime.now()
    incident_id = f"EMG-{pack_id}-{timestamp.strftime('%Y%m%d%H%M%S')}"
    
    # Safety severity assessment
    critical_keywords = ["fire", "thermal runaway", "smoke", "explosion", "flame"]
    is_critical = any(kw in reason.lower() for kw in critical_keywords)
    
    if is_critical or force:
        # Immediate action required
        action_taken = "SHUTDOWN_INITIATED"
        confirmation_required = False
        message = f"⚠️ EMERGENCY SHUTDOWN INITIATED for {pack_id}. Reason: {reason}"
    else:
        # Require confirmation for non-critical shutdowns
        action_taken = "PENDING_CONFIRMATION"
        confirmation_required = True
        message = f"Shutdown requested for {pack_id}. Awaiting operator confirmation."
    
    result = {
        "status": action_taken,
        "incident_id": incident_id,
        "pack_id": pack_id,
        "reason": reason,
        "timestamp": timestamp.isoformat(),
        "severity": "CRITICAL" if is_critical else "HIGH",
        "confirmation_required": confirmation_required,
        "message": message,
        "next_steps": [
            "Evacuate personnel from immediate area" if is_critical else "Review pack status",
            "Activate fire suppression if needed" if is_critical else "Verify shutdown justification",
            "Contact emergency services" if is_critical else "Document incident"
        ]
    }
    
    if confirmation_required:
        result["confirmation_prompt"] = f"Confirm emergency shutdown of pack {pack_id}? Reason: {reason}. Type 'CONFIRM' to proceed."
    
    return result


def send_operator_alert(
    severity: str,
    message: str,
    pack_id: Optional[str] = None,
    channels: Optional[List[str]] = None
) -> dict:
    """
    Sends an alert to operators through specified channels.
    
    Args:
        severity: Alert severity ('info', 'warning', 'critical', 'emergency')
        message: Alert message
        pack_id: Optional related pack ID
        channels: Alert channels ('dashboard', 'email', 'sms', 'alarm')
    
    Returns:
        dict: Alert dispatch confirmation
    """
    import datetime
    
    if channels is None:
        # Default channels based on severity
        channels = {
            "info": ["dashboard"],
            "warning": ["dashboard", "email"],
            "critical": ["dashboard", "email", "sms"],
            "emergency": ["dashboard", "email", "sms", "alarm"]
        }.get(severity.lower(), ["dashboard"])
    
    timestamp = datetime.datetime.now()
    alert_id = f"ALR-{timestamp.strftime('%Y%m%d%H%M%S')}-{abs(hash(message)) % 1000:03d}"
    
    # Dispatch to channels (in production, would actually send)
    dispatch_results = []
    for channel in channels:
        dispatch_results.append({
            "channel": channel,
            "status": "dispatched",
            "timestamp": timestamp.isoformat()
        })
    
    return {
        "status": "success",
        "alert_id": alert_id,
        "severity": severity,
        "message": message,
        "pack_id": pack_id,
        "channels_notified": channels,
        "dispatch_results": dispatch_results,
        "summary": f"Alert {alert_id} ({severity.upper()}) dispatched to {len(channels)} channel(s)"
    }
