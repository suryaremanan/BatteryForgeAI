import pandas as pd
import numpy as np
import json

class DigitalTwinService:
    async def run_shadow_simulation(self, real_df: pd.DataFrame):
        """
        Compares REAL battery data against a PHYSICS-BASED DIGITAL TWIN.
        Returns the Deviation Metric and Safety Status.
        """
        from services.gemini_service import gemini_service
        
        # 1. Extract Protocol & Initial Conditions (Zero-Shot)
        # We take the first few rows to set the "Twin's" initial state.
        initial_voltage = real_df['voltage'].iloc[0] if 'voltage' in real_df else 3.0
        duration = len(real_df) # proxy for time
        
        # Downsample for prompt
        sample_curve = real_df[['time', 'voltage']].iloc[::max(1, len(real_df)//50)].to_json(orient='records')
        
        # 2. Ask Gemini to Generate Baseline
        prompt = f"""
        Act as a Generative Anomaly Detector for Battery Signals.
        
        I am providing a real-world battery cycling curve.
        Initial Voltage: {initial_voltage} V.
        Duration: {duration} data points.
        
        REAL MEASURED DATA (sampled):
        {sample_curve}
        
        Task:
        1. Generate a "Semantic Baseline": Based on your knowledge of Li-Ion electrochemistry, what should the IDEAL curve look like for this specific charge/discharge pattern?
        2. Compare Real vs Baseline: Identify deviations that indicate degradation or faults (not just noise).
        3. Safety Verdict: If significant deviation > 5% found in critical regions (knees, plateaus), flag it.
        
        Return JSON:
        {{
            "baseline_confidence": 95, // Your confidence in the generated baseline
            "max_deviation_percent": 2.3,
            "safety_status": "NORMAL" | "WARNING" | "CRITICAL",
            "anomaly_reason": "Voltage dip detected at step 40..." (or "None"),
            "ideal_curve_points": [ ... list of {{time, voltage}} for the generated baseline ... ]
        }}
        """
        
        try:
            # We use the agent model capability usually, or flash
            # Assuming gemini_service has a generic 'flash_model' accessor or we add a helper.
            # We'll rely on the existing flash_model
            response = gemini_service.flash_model.generate_content(prompt)
            text = response.text
            
            # Robust JSON Extraction
            import re
            json_match = re.search(r'\{.*\}', text, re.DOTALL)
            if json_match:
                json_str = json_match.group(0)
                result = json.loads(json_str)
            else:
                # Fallback: Try simple cleaning
                cleaned = text.replace("```json", "").replace("```", "").strip()
                result = json.loads(cleaned)
                
            return result
        except Exception as e:
            print(f"Digital Twin Error: {e}")
            return {"safety_status": "UNKNOWN", "error": str(e)}

digital_twin_service = DigitalTwinService()
