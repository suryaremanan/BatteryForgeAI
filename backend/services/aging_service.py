import pandas as pd
import numpy as np
import io

class AgingService:
    async def generate_aging_curve(self, current_capacity_ah: float = None, nominal_capacity_ah: float = 3.0, current_cycle: int = None):
        """
        Simulates/Projects a capacity degradation curve based on the CURRENT measured capacity or cycle count.
        Uses Gemini 3 to generate the physics-based trajectory.
        """
        from services.gemini_service import gemini_service
        import numpy as np

        # 1. Determine Current State
        if current_cycle is not None:
            start_cycle = current_cycle
            # Estimate SOH if capacity not provided
            if current_capacity_ah is not None:
                current_soh = (current_capacity_ah / nominal_capacity_ah) * 100.0
            else:
                current_soh = 100.0 - (current_cycle * 0.02) # Approx
        elif current_capacity_ah is None:
            current_soh = 100.0
            start_cycle = 0
        else:
            current_soh = (current_capacity_ah / nominal_capacity_ah) * 100.0
            current_soh = min(100.0, max(0.0, current_soh))
            
            # Simple heuristic for start cycle (fallback/estimation)
            if current_soh >= 100:
                start_cycle = 0
            else:
                # Approx 0.02% loss per cycle
                start_cycle = int((100 - current_soh) / 0.02)

        # 2. Call Gemini for Trajectory
        trajectory = await gemini_service.predict_aging_trajectory(current_soh, start_cycle)
        
        # 3. Fallback to Numpy if Gemini Fails
        if not trajectory or 'cycles' not in trajectory or len(trajectory['cycles']) == 0:
            print("Fallback to Numpy Simulation")
            sim_end_cycle = start_cycle + 1000
            cycles = np.arange(0, sim_end_cycle, 20)
            degradation = 0.02 * cycles
            knee_factor = np.maximum(0, (cycles - 800)) * 0.05
            predicted_soh = 100.0 - (degradation + knee_factor)
            noise = np.random.normal(0, 0.2, len(cycles))
            predicted_soh = predicted_soh + noise
            
            valid_idx = predicted_soh > 0.0
            cycles = cycles[valid_idx].tolist()
            predicted_soh = predicted_soh[valid_idx].tolist()
            
            analysis = {
                "prediction_engine": "Numpy Simulation (Fallback)",
                "summary": "AI generation failed. using standard degradation model.",
                "recommendation": "Check internet connection or API quota."
            }
        else:
            cycles = trajectory['cycles']
            predicted_soh = trajectory['soh']
            analysis = trajectory.get('analysis', {
                "prediction_engine": "Gemini 3.0 Pro + PyBaMM (Hybrid)",
                "summary": "Projected degradation based on standard cycle life models.",
                "recommendation": "Maintain optimal temperature (25°C) to extend life."
            })

        return {
            "cycles": cycles,
            "soh": predicted_soh,
            "analysis": analysis,
            "current_metrics": {
                "measured_capacity": current_capacity_ah if current_capacity_ah else nominal_capacity_ah,
                "calculated_soh": round(current_soh, 2),
                "estimated_cycle_life_consumed": start_cycle
            }
        }

aging_service = AgingService()
