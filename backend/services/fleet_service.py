import json
import asyncio
import random
import numpy as np
from datetime import datetime

class FleetService:
    def __init__(self):
        # Initial State: Hybrid Physics Engine
        self.num_packs = 1240
        self.current_stats = self._generate_physics_fleet(scenario="normal")
        self.commander_report = None
        self.last_update = datetime.now()
        
        # Extended Fleet State (Phase 6)
        self.vehicles = self._init_vehicles()
        self.drivers = self._init_drivers()
        self.routes = []
        self.charging_schedules = []

    def _generate_physics_fleet(self, scenario: str = "normal"):
        """
        PHYSICS ENGINE (The "Truth"):
        Generates N=1240 realistic battery packs using Gaussian distributions.
        Injects mathematically precise faults for the "Red List".
        """
        # 1. Base Physics (NMC Chemistry 24h cycle avg)
        # Time points: 00:00 to 23:00
        time_points = [f"{i:02d}:00" for i in range(24)]
        
        # Base Curves (Ideal)
        base_voltage = np.array([4.2, 4.1, 4.0, 3.9, 3.85, 3.8, 3.75, 3.7, 3.68, 3.65, 3.63, 3.6, 3.58, 3.55, 3.5, 3.45, 3.4, 3.35, 3.3, 3.2, 3.4, 3.8, 4.0, 4.15])
        base_temp = np.array([25.0] * 24)
        
        # Scenario Modifiers
        temp_noise_scale = 1.5
        volt_noise_scale = 0.05
        
        if scenario == "heatwave":
            base_temp += 15.0 # Ambient 40C
            temp_noise_scale = 5.0 # High variance
        elif scenario == "aging":
            base_voltage -= 0.2 # Voltage fade
            volt_noise_scale = 0.15 # High variance
            
        # 2. Generate Aggregate Statistics (Thermal Spread)
        # We simulate min/max bands by adding +/- 3 sigma
        avg_voltage = base_voltage + np.random.normal(0, 0.01, 24)
        avg_temp = base_temp + np.random.normal(0, 0.5, 24)
        
        # Min/Max Bands (The "Spread")
        temp_max = avg_temp + (temp_noise_scale * 2) 
        temp_min = avg_temp - (temp_noise_scale * 1.5)
        
        # 3. Fault Injection (The "Red List")
        # Generate 5 critical outliers
        red_list = []
        for i in range(5):
            pid = f"BAT-{random.randint(1000, 9999)}"
            fault_type = random.choice(["Thermal Runaway Risk", "Internal Short", "Capacity Fade"])
            
            if fault_type == "Thermal Runaway Risk":
                p_temp = round(float(np.mean(avg_temp)) + 25.0 + random.random()*10, 1)
                p_volt = 3.9
                s_status = "CRITICAL"
            elif fault_type == "Internal Short":
                p_temp = round(float(np.mean(avg_temp)) + 10.0, 1)
                p_volt = 2.8 # Low voltage
                s_status = "WARNING"
            else:
                p_temp = 28.0
                p_volt = 3.5
                s_status = "DEGRADED"

            red_list.append({
                "pack_id": pid,
                "status": s_status,
                "fault": fault_type,
                "voltage": p_volt,
                "temp": p_temp,
                "soh": random.randint(70, 85)
            })

        # 4. Construct Payload
        timeline_data = []
        for i, t in enumerate(time_points):
            timeline_data.append({
                "time": t,
                "voltage": round(float(avg_voltage[i]), 2),
                "temp_avg": round(float(avg_temp[i]), 1),
                "temp_min": round(float(temp_min[i]), 1),
                "temp_max": round(float(temp_max[i]), 1),
                "efficiency": 95 + np.random.normal(0, 1)
            })

        return {
            "timeline": timeline_data,
            "red_list": red_list,
            "fleet_metrics": {
                "active_packs": self.num_packs,
                "avg_health": 98.2 if scenario == "normal" else 88.5,
                "thermal_spread": round(float(np.max(temp_max) - np.min(temp_min)), 1)
            }
        }

    def get_current_data(self):
        return {
            "data": self.current_stats,
            "commander_report": self.commander_report,
            "vehicles": self.vehicles,
            "drivers": self.drivers,
            "routes": self.routes,
            "schedules": self.charging_schedules
        }

    def _init_vehicles(self):
        """Initialize with some mock vehicles usually found in frontend."""
        return [
            {"id": "EV-001", "model": "Tesla Model 3", "status": "moving", "soc": 82, "temp": 44, "driver_id": "DR-001"},
            {"id": "EV-002", "model": "Chevy Bolt", "status": "maintenance", "soc": 74, "temp": 46, "driver_id": None},
            {"id": "EV-003", "model": "Ford F-150 Lightning", "status": "idle", "soc": 64, "temp": 21, "driver_id": "DR-003"},
            {"id": "EV-004", "model": "Tesla Model Y", "status": "maintenance", "soc": 61, "temp": 45, "driver_id": None},
            {"id": "EV-005", "model": "Tesla Model Y", "status": "idle", "soc": 84, "temp": 34, "driver_id": "DR-005"},
            {"id": "EV-006", "model": "Chevy Bolt", "status": "charging", "soc": 31, "temp": 29, "driver_id": None},
            {"id": "EV-007", "model": "Rivian R1T", "status": "idle", "soc": 82, "temp": 45, "driver_id": "DR-007"},
            {"id": "EV-008", "model": "Tesla Model 3", "status": "charging", "soc": 55, "temp": 35, "driver_id": "DR-008"},
            {"id": "EV-009", "model": "Rivian R1T", "status": "maintenance", "soc": 82, "temp": 49, "driver_id": None},
            {"id": "EV-010", "model": "Rivian R1T", "status": "maintenance", "soc": 88, "temp": 42, "driver_id": None},
        ]

    def _init_drivers(self):
        """Initialize with some mock drivers."""
        return [
            {"id": "DR-001", "name": "John Smith", "status": "active", "vehicle_id": "EV-001"},
            {"id": "DR-003", "name": "Mike Davis", "status": "active", "vehicle_id": "EV-003"},
            {"id": "DR-005", "name": "Chris Brown", "status": "active", "vehicle_id": "EV-005"},
            {"id": "DR-007", "name": "David Martinez", "status": "active", "vehicle_id": "EV-007"},
            {"id": "DR-008", "name": "Lisa Anderson", "status": "active", "vehicle_id": "EV-008"},
        ]

    def add_vehicle(self, model: str, license_plate: str):
        new_id = f"EV-{len(self.vehicles) + 11:03d}"
        vehicle = {
            "id": new_id,
            "model": model,
            "license_plate": license_plate,
            "status": "idle",
            "soc": 100,
            "temp": 25,
            "driver_id": None
        }
        self.vehicles.append(vehicle)
        return vehicle

    def add_driver(self, name: str, license_number: str):
        new_id = f"DR-{len(self.drivers) + 11:03d}"
        driver = {
            "id": new_id,
            "name": name,
            "license_number": license_number,
            "status": "available",
            "vehicle_id": None
        }
        self.drivers.append(driver)
        return driver

    def update_vehicle_status(self, vehicle_id: str, status: str):
        for v in self.vehicles:
            if v["id"] == vehicle_id:
                v["status"] = status
                return v
        return None

    def assign_driver(self, vehicle_id: str, driver_id: str):
        # Unassign previous
        for v in self.vehicles:
            if v["id"] == vehicle_id:
                v["driver_id"] = driver_id
        for d in self.drivers:
            if d["id"] == driver_id:
                d["vehicle_id"] = vehicle_id
                d["status"] = "assigned"
        return {"vehicle_id": vehicle_id, "driver_id": driver_id}

    async def update_simulation(self, scenario: str):
        """
        HYBRID AGENT:
        1. Physics: Generates mathematically valid telemetry.
        2. Gemini: Analyzes the stats to give "Commander" advice.
        """
        from services.gemini_service import gemini_service
        from services.log_stream import log_stream_service
        
        print(f"Hybrid Simulation Component Triggered: {scenario}")
        await log_stream_service.emit_log("FleetPhysics", f"Starting scenario: {scenario.upper()}", "INFO")
        
        # 1. Run Physics Engine
        phys_data = self._generate_physics_fleet(scenario)
        self.current_stats = phys_data
        await log_stream_service.emit_log("PhysicsEngine", f"Generated telemetry for {self.num_packs} packs", "DEBUG")
        
        # 2. Run Commander Agent (Gemini 3)
        # Feed aggregate stats, NOT raw data (Token efficient)
        context = {
            "scenario": scenario,
            "thermal_spread_degC": phys_data['fleet_metrics']['thermal_spread'],
            "critical_outliers": len([p for p in phys_data['red_list'] if p['status'] == 'CRITICAL']),
            "max_temp_fleet": max(d['temp_max'] for d in phys_data['timeline'])
        }
        
        await log_stream_service.emit_log("GeminiAgent", "Analyzing fleet telemetry...", "INFO")
        report = await gemini_service.generate_commander_report(context)
        self.commander_report = report
        
        await log_stream_service.emit_log("GeminiAgent", f"Commander Report Generated: {report.get('risk_level', 'UNKNOWN')}", "SUCCESS")
        
        self.last_update = datetime.now()
        return True

    # --- PCB Manufacturing Extensions ---

    def optimize_material_selection(self, requirements: dict):
        """
        Selects material batches based on FIFO and shelf-life constraints (Phase 1).
        """
        import time
        
        material_type = requirements.get("type", "FR4-Core")
        required_qty = requirements.get("quantity", 10)
        
        # Mock Inventory State
        inventory = [
            {"batch_id": "M-2023-A01", "type": "FR4-Core", "received_date": "2023-01-10", "qty": 50, "status": "EXPIRED"},
            {"batch_id": "M-2023-B05", "type": "FR4-Core", "received_date": "2023-05-20", "qty": 100, "status": "OK"},
            {"batch_id": "M-2023-C12", "type": "FR4-Core", "received_date": "2023-06-01", "qty": 200, "status": "OK"},
            {"batch_id": "P-2023-X99", "type": "Prepreg-1080", "received_date": "2023-07-15", "qty": 500, "status": "OK"}
        ]
        
        # Filter by type and status
        available = [item for item in inventory if item["type"] == material_type and item["status"] == "OK"]
        
        # FIFO Sort (oldest first)
        available.sort(key=lambda x: x["received_date"])
        
        selected_batches = []
        remaining_qty = required_qty
        
        for batch in available:
            if remaining_qty <= 0:
                break
            
            take_qty = min(remaining_qty, batch["qty"])
            selected_batches.append({
                "batch_id": batch["batch_id"],
                "quantity": take_qty,
                "shelf_life_status": "GOOD" # Simplified
            })
            remaining_qty -= take_qty
            
        if remaining_qty > 0:
            return {"success": False, "message": "Insufficient valid inventory.", "shortage": remaining_qty}
            
        return {
            "success": True, 
            "allocation": selected_batches,
            "optimization_method": "FIFO (Shelf-life protected)"
        }

    def check_drill_wear(self, drill_id: str, current_hit_count: int):
        """
        Analyzes drill logs for excessive wear patterns (Phase 4).
        Enhanced with predictive analytics and detailed status messaging.
        """
        # Max standard hits for a 0.2mm drill is roughly 1000-2000 depending on material.
        MAX_SAFE_HITS = 1500
        
        wear_status = "GOOD"
        action_required = "NONE"
        status_message = "Drill operating within normal parameters."
        estimated_remaining = MAX_SAFE_HITS - current_hit_count
        
        # 1. Hard Life Limit
        if current_hit_count > MAX_SAFE_HITS:
            wear_status = "CRITICAL"
            action_required = "REPLACE_IMMEDIATELY"
            status_message = f"⚠️ CRITICAL: Drill exceeded max hits by {current_hit_count - MAX_SAFE_HITS}. Replace immediately to prevent breakage!"
            
        # 2. Predictive Heuristic (Simulated "Resin Smear" detection)
        elif current_hit_count > (MAX_SAFE_HITS * 0.9):
            wear_status = "CRITICAL"
            action_required = "REPLACE_AFTER_PANEL"
            status_message = f"🔴 Drill at {round(current_hit_count/MAX_SAFE_HITS*100)}% life. Schedule replacement after current panel."
            
        elif current_hit_count > (MAX_SAFE_HITS * 0.8):
             wear_status = "WARNING"
             action_required = "INSPECT_TIP"
             status_message = f"🟡 Drill at {round(current_hit_count/MAX_SAFE_HITS*100)}% life. Inspect for resin smear buildup."
             
        else:
            wear_status = "GOOD"
            action_required = "CONTINUE"
            status_message = f"✅ Drill healthy. ~{estimated_remaining} hits remaining."
              
        return {
            "drill_id": drill_id,
            "hits": current_hit_count,
            "max_hits": MAX_SAFE_HITS,
            "wear_status": wear_status,
            "action": action_required,
            "status_message": status_message,
            "estimated_remaining_hits": max(0, estimated_remaining),
            "wear_percentage": round((current_hit_count / MAX_SAFE_HITS) * 100, 1)
        }

fleet_service = FleetService()
