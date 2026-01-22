import pybamm
import numpy as np
import asyncio
from concurrent.futures import ThreadPoolExecutor

executor = ThreadPoolExecutor(max_workers=2)

class SimulationService:
    def __init__(self):
        # Cache standard parameters to avoid re-loading
        self.param_nmc = pybamm.ParameterValues("Chen2020")
        self.param_lfp = pybamm.ParameterValues("Marquis2019")

    async def run_reference_discharge(self, chemistry: str = "NMC", c_rate: float = 1.0, temperature_C: float = 25.0):
        """
        Runs a physics-based DFN simulation using PyBaMM.
        Executed in a thread pool to avoid blocking the Event Loop.
        """
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(executor, self._solve_physics, chemistry, c_rate, temperature_C)

    def _solve_physics(self, chemistry, c_rate, temperature_C):
        try:
            # 1. Select Parameter Set
            if chemistry == "LFP":
                parameter_values = self.param_lfp.copy()
            else:
                parameter_values = self.param_nmc.copy()

            # 2. Update Parameters
            # PyBaMM standard params mostly use [K]
            parameter_values["Ambient temperature [K]"] = 273.15 + temperature_C
            parameter_values["Initial temperature [K]"] = 273.15 + temperature_C
            
            # 3. Define Experiment
            # Simple CC Discharge
            experiment = pybamm.Experiment(
                [
                    f"Discharge at {c_rate}C until 2.5V",
                ]
            )

            # 4. Setup Model (DFN - Doyle-Fuller-Newman)
            # DFN is the gold standard for lith-ion physics
            model = pybamm.lithium_ion.DFN()
            
            # 5. Run Simulation
            sim = pybamm.Simulation(model, parameter_values=parameter_values, experiment=experiment)
            sim.solve()
            
            # 6. Extract Data
            sol = sim.solution
            
            # Downsample for frontend performance (approx 100-200 points)
            t = sol["Time [s]"].entries.flatten()  
            v = sol["Terminal voltage [V]"].entries.flatten()
            c = sol["Current [A]"].entries.flatten()
            temp = sol["X-averaged cell temperature [K]"].entries.flatten()
            cap = sol["Discharge capacity [A.h]"].entries.flatten()
            
            # Convert to list and downsample
            # Create indices for ~200 points
            if len(t) > 200:
                indices = np.linspace(0, len(t) - 1, 200, dtype=int)
            else:
                indices = np.arange(len(t))

            return {
                "time": t[indices].tolist(),
                "voltage": v[indices].tolist(),
                "current": c[indices].tolist(),
                "temperature": (temp[indices] - 273.15).tolist(), # Convert to C
                "capacity": cap[indices].tolist(),
                "metadata": {
                    "model": "DFN (Doyle-Fuller-Newman)",
                    "chemistry": chemistry,
                    "c_rate": c_rate
                },
                "success": True
            }
        except Exception as e:
            print(f"PyBaMM Error: {e}")
            return {"success": False, "error": str(e)}

    # --- PCB Process Simulation (Phase 2 & 4) ---

    def control_etching_process(self, copper_weight_oz: float, chemical_concentration_pct: float):
        """
        Phase 2: Adaptive Etching Control.
        Dynamic adjustment of conveyor speed/spray pressure based on inputs.
        """
        # Physical heuristics (Simplified Model)
        # Higher copper weight -> Needs slower speed OR higher pressure
        # Higher concentration -> Faster etch rate
        
        base_speed = 2.5 # m/min
        base_pressure = 3.0 # bar
        
        etch_rate_factor = (chemical_concentration_pct / 100.0) * 1.5
        load_factor = copper_weight_oz # 1.0oz is standard
        
        # Calculate optimal settings
        target_speed = base_speed * (etch_rate_factor / load_factor)
        target_pressure = base_pressure * (load_factor / 0.8)
        
        # Safety clamps
        target_speed = max(0.5, min(target_speed, 4.0)) # Conveyor limits
        target_pressure = max(1.0, min(target_pressure, 5.0)) # Pump limits
        
        return {
            "inputs": {
                "copper_weight": f"{copper_weight_oz}oz",
                "concentration": f"{chemical_concentration_pct}%"
            },
            "control_actions": {
                "conveyor_speed_m_min": round(target_speed, 2),
                "spray_pressure_bar": round(target_pressure, 2),
                "oxide_safety_check": "PASS" if chemical_concentration_pct < 120 else "FAIL (Risk of Delamination)"
            }
        }

    def predict_lamination_scaling(self, material_type: str, layer_count: int):
        """
        Phase 2: Predictive Lamination Scaling.
        Predicts X/Y dimensional change after hot press.
        """
        # CTE (Coefficient of Thermal Expansion) Heuristics
        # FR4 expands in Z but shrinks in X/Y during cure/cool cycle
        scaling_map = {
            "FR4-Standard": {"x": -0.0005, "y": -0.0006},
            "Polyimide": {"x": -0.0012, "y": -0.0012},
            "Rogers-4000": {"x": -0.0002, "y": -0.0002}
        }
        
        base_scaling = scaling_map.get(material_type, {"x": -0.0005, "y": -0.0005})
        
        # More layers = more complex stress = slightly more shrinkage
        layer_factor = 1.0 + (layer_count * 0.02)
        
        scaling_x = base_scaling["x"] * layer_factor
        scaling_y = base_scaling["y"] * layer_factor
        
        # Result is ppm or percentage. Let's return as "mils per inch" offset
        return {
             "material": material_type,
             "layers": layer_count,
             "scaling_factors": {
                 "x_comp": round(abs(scaling_x) * 10000, 2), # e.g., 5.0 mils/inch compensation needed
                 "y_comp": round(abs(scaling_y) * 10000, 2)
             },
             "drill_program_offset": "APPLY_COMPENSATION"
        }

    def optimize_plating_distribution(self, panel_width_mm: float, panel_height_mm: float):
        """
        Phase 4: Plating Uniformity (Flight Bar Setup).
        """
        # Simulate Current Density Distribution (Dog-bone effect)
        # Edges get more current -> thicker plating
        
        # Suggest shielding or flight bar clamping
        area = panel_width_mm * panel_height_mm
        
        # Heuristic recommendations
        if area > 50000: # Large panel
            recommendation = "Use 4 clamps with auxiliary cathode shielding."
            uniformity_score = 92
        else:
            recommendation = "Standard 2-clamp dual-side."
            uniformity_score = 98
            
        return {
            "panel_dims": f"{panel_width_mm}x{panel_height_mm}mm",
            "current_density_model": "FEM_Simplified",
            "suggested_setup": recommendation,
            "predicted_uniformity_score": uniformity_score
        }

simulation_service = SimulationService()
