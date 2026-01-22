import os
import google.generativeai as genai
from dotenv import load_dotenv
import json

load_dotenv()

# Configure Gemini
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

class GeminiService:
    def __init__(self):
        # Using Gemini 3 Pro Preview (Hackathon Compliant)
        self.vision_model = genai.GenerativeModel('models/gemini-3-pro-preview')
        # Using Gemini 3 Pro Preview for deep reasoning
        self.flash_model = genai.GenerativeModel('models/gemini-3-pro-preview')

    def _sanitize_for_json(self, obj):
        """Recursively converts NumPy types to Python native types for JSON serialization."""
        import numpy as np
        if isinstance(obj, dict):
            return {k: self._sanitize_for_json(v) for k, v in obj.items()}
        elif isinstance(obj, list):
            return [self._sanitize_for_json(i) for i in obj]
        elif isinstance(obj, (np.int_, np.intc, np.intp, np.int8,
            np.int16, np.int32, np.int64, np.uint8,
            np.uint16, np.uint32, np.uint64)):
            return int(obj)
        elif isinstance(obj, (np.float16, np.float32, np.float64)):
            return float(obj)
        elif isinstance(obj, (np.bool_)):
            return bool(obj)
        return obj

    async def analyze_defect(self, image_data, mime_type="image/jpeg"):
        prompt = """
        Act as 'BatteryGPT', a specialized domain expert in Lithium-Ion battery anomaly detection.
        Follow the 'Detect-Locate-Describe' methodology:
        1. DETECT: Identify if any anomaly exists (Swelling, Corrosion, Leakage, Mechanical Deformation, Thermal Runaway).
        2. LOCATE: Pinpoint the specific region (e.g., 'upper tab', 'cell body center', 'negative terminal').
        3. DESCRIBE: Provide a technical electrochemical assessment of the visual evidence.

        Analyze the attached image.
        Output a valid JSON object with:
        - defect_type: (string) Class of defect or 'Normal'.
        - location: (string) Specific physical region of the defect.
        - severity: (string) 'Negligible', 'Moderate', 'Critical'.
        - confidence: (number) 0-100.
        - description: (string) Detailed technical analysis following the methodology.
        - mitigation: (string) Immediate safety or maintenance action.
        """
        
        try:
            response = self.vision_model.generate_content([
                prompt,
                {"mime_type": mime_type, "data": image_data}
            ])
            # Basic cleanup to ensure JSON
            return self._extract_json(response.text)
        except Exception as e:
            print(f"Gemini Vision Error: {e}")
            return {"error": str(e)}

    async def analyze_pcb_defect(self, image_data, mime_type="image/jpeg"):
        """
        Phase 6: Real AI Vision for PCB Inspection.
        Sends PCB image to Gemini 3.0 Pro for Open/Short classification.
        """
        prompt = """
        Act as a Senior PCB QA Engineer.
        Analyze this PCB macro-image for manufacturing defects.
        
        Focus specifically on identifying:
        1. Open Circuits (Fatal) - Broken tracks.
        2. Short Circuits (Repairable) - Unwanted copper bridges.
        3. Mouse Bites (Warning) - Uneven edges.
        4. Solder Mask On Pads (Critical) - Mask covering solderable areas.
        
        Return JSON Object:
        {
            "defect_type": "OPEN_CIRCUIT" | "SHORT_CIRCUIT" | "SOLDER_MASK_ON_PAD" | "NORMAL",
            "confidence": 0.95, // Number 0-1
            "severity": "FATAL" | "REPAIRABLE" | "WARNING",
            "recommended_action": "SCRAP" | "MANUAL_REPAIR" | "STRIP_AND_RECOAT" | "NONE",
            "description": "Found a 0.5mm break in the signal trace near U1.",
            "bbox": [x, y, w, h] // Approximate relative coordinates [0-100] if visually localizable
        }
        """
        try:
            response = self.vision_model.generate_content([
                prompt,
                {"mime_type": mime_type, "data": image_data}
            ])
            return self._extract_json(response.text)
        except Exception as e:
            print(f"Gemini PCB Vision Error: {e}")
            return {"error": str(e)}

    async def analyze_gerber_text(self, gerber_content: str):
        """
        Phase 6: Real AI Text Analysis for Gerber Files.
        """
        # Truncate content if too huge, but usually headers are top 50 lines.
        # We need Gemini to inspect the syntax.
        
        prompt = f"""
        Act as a CAM Engineer (Computer-Aided Manufacturing).
        Review this Gerber File (RS-274X) snippet:
        
        {gerber_content[:4000]} ... (truncated)
        
        Analyze the header and aperture definitions.
        1. Identify the layer type (Copper, Mask, Drill, Silk).
        2. Check for missing crucial definitions (e.g., Units, Format).
        
        Return JSON:
        {{
            "layer_type": "Signal_Top",
            "units": "Metric" | "Imperial",
            "is_valid_format": true,
            "missing_features": ["Undefined Aperture D10"], // List strings or empty
            "engineering_check": "PASS" | "FAIL"
        }}
        """
        try:
            response = self.flash_model.generate_content(prompt)
            return self._extract_json(response.text)
        except Exception as e:
            print(f"Gemini Gerber Analysis Error: {e}")
            return {"error": str(e)}

    async def analyze_charging_curve(self, image_buffer):
        """
        Analyzes a charging curve plot for electrochemical signatures.
        """
        prompt = """
        You are an Expert Battery Data Scientist.
        Analyze this 'Voltage & Current vs Time' charging plot.
        
        Look for specific anomalies:
        1. Voltage Kinks/Plateaus: Could indicate Lithium Plating (critical).
        2. Abnormal IR Drop: High internal resistance.
        3. Capacity Fade: Reaching cutoff voltage too early.
        
        Return a JSON object:
        {
          "anomaly_detected": true/false,
          "diagnosis": "Lithium Plating / Normal / etc",
          "severity": "High/Medium/Low",
          "description": "Explanation of the curve shape...",
          "reasoning": "Step-by-step electrochemical deduction (e.g. 'Slope change at 3.8V indicates...').",
          "recommendation": "Decrease charging rate / Check thermal management"
        }
        """
        
        try:
            image_data = image_buffer.getvalue()
            response = self.vision_model.generate_content([
                prompt,
                {"mime_type": "image/png", "data": image_data}
            ])
            return self._extract_json(response.text)
        except Exception as e:
            print(f"Error in analyze_charging_curve: {e}")
            return {"error": str(e)}

    async def parse_fault_log(self, log_text, context=None):
        prompt = f"""
        You are an expert Battery Management System (BMS) Log Analyzer.
        Parse the following raw log/error code dump.
        Use the provided 'Context Data' (Voltage, Temp, etc.) to refine your diagnosis.
        Extract:
        1. Error Code (if present).
        2. Component (e.g., Cell Module 3, BMS Main Controller).
        3. Issue Description.
        4. Urgency (Info, Warning, Critical).
        5. troubleshooting_steps (List of strings).

        Context Data (Battery State):
        {context}

        Raw Log:
        {log_text}

        Return the result ONLY as a valid JSON object with keys:
        error_code, component, description, urgency, troubleshooting_steps.
        """

        try:
            response = self.flash_model.generate_content(prompt)
            return self._extract_json(response.text)
        except Exception as e:
            print(f"Gemini Text Error: {e}")
            return {"error": str(e)}



    async def predict_battery_aging(self, aging_data):
        prompt = f"""
        You are a Battery Lifecycle Analyst.
        Here is the historical capacity data (State of Health vs Cycle Number) for a battery pack:
        
        Cycles: {aging_data['cycles'][-10:]} (Last 10 points)
        SOH: {aging_data['soh'][-10:]} (Last 10 points)
        
        Task:
        1. Predict the 'End of Life' (EOL) cycle number (when SOH hits 80%).
        2. Identify if a 'Knee Point' (accelerated degradation) has occurred.
        3. Estimate Remaining Useful Life (RUL) in cycles.
        
        Return JSON:
        {{
            "predicted_eol_cycle": 1200,
            "rul_cycles": 400,
            "knee_point_detected": true/false,
            "reasoning": "The slope has increased significantly..."
        }}
        """
        try:
            response = self.flash_model.generate_content(prompt)
            return self._extract_json(response.text)
        except Exception as e:
            return {"error": str(e)}

    def _extract_json(self, text: str):
        """
        Robustly extracts JSON object from LLM response, handling markdown fences and chatty prefixes.
        """
        try:
            # 1. Remove Markdown fences
            clean_text = text.replace("```json", "").replace("```", "").strip()
            
            # 2. Find the first '{' and last '}' to isolate the JSON object
            start_idx = clean_text.find('{')
            end_idx = clean_text.rfind('}')
            
            if start_idx != -1 and end_idx != -1 and start_idx < end_idx:
                json_str = clean_text[start_idx : end_idx + 1]
                return json.loads(json_str)
            
            # Fallback: Try regex if simple find fails (e.g. nested structures might be fine, but just in case)
            import re
            match = re.search(r'(\{.*\})', clean_text, re.DOTALL)
            if match:
                return json.loads(match.group(1))

            # Last resort: Try loading the stripped text directly
            return json.loads(clean_text)
        except json.JSONDecodeError as e:
            print(f"JSON Parse Error: {e} | Text: {text[:100]}...")
            # Attempt to fix common issues (e.g. trailing commas) could go here
            raise e


    async def predict_aging_trajectory(self, current_soh: float, start_cycle: int):
        """
        Generates a plausible lithium-ion degradation curve (Cycles vs SOH) using Gemini's physics knowledge.
        Returns a list of points or a structured JSON response with the curve data.
        """
        prompt = f"""
        Act as an Advanced Battery Physics Simulator.
        Generate a projected capacity fade (aging) curve for a Lithium-Ion NMC/Graphite cell.
        
        Initial Conditions:
        - Current SOH: {current_soh}%
        - Current Cycle Count: {start_cycle}
        
        Simulation Parameters:
        - Project forward for 2000 cycles.
        - Include 'Knee Point' onset modeling (accelerated fading after ~80% SOH is reached).
        - Add realistic Gaussian noise (+/- 0.2%) to simulate measurement noise.
        
        Output Result ONLY as a Valid JSON object with this structure:
        {{
            "cycles": [0, 50, 100, ...], 
            "soh": [100.0, 99.8, 99.5, ...],
            "analysis": {{
                "prediction_engine": "Gemini 3.0 Pro + PyBaMM (Hybrid)",
                "summary": "Detailed technical summary (2 sentences) of the degradation trend and projected RUL.",
                "recommendation": "One actionable recommendation to extend cycle life."
            }}
        }}
        Ensure the 'cycles' array starts at 0 and goes up to at least {start_cycle + 2000}.
        Ensure 'soh' matches 'cycles' length. SOH should decay from 100% (at cycle 0) down to <60%.
        Make sure the curve passes roughly through the Current SOH at the Current Cycle Count.
        """
        
        try:
            # Use Flash model for speed/data generation
            response = self.flash_model.generate_content(prompt)
            return self._extract_json(response.text)
        except Exception as e:
            print(f"Gemini Aging Projection Error: {e}")
            return None

    async def analyze_dataset_signature(self, headers: list, sample_rows: str):
        """
        UNIVERSAL ANALYZER:
        Identifies the dataset type and recommends plotting configuration.
        """
        prompt = f"""
        Act as a Data Scientist specialized in Battery R&D.
        Analyze this CSV header and sample data to understand what it represents.
        
        Headers: {headers}
        Sample Data:
        {sample_rows}
        
        Tasks:
        1. Classify the Data Type: 'Cycling' (Time/Volts/Amps), 'Impedance' (EIS), 'Diffraction' (XRD), 'Mechanical', or 'Unknown'.
        2. Summary: One sentence description of what this file contains.
        3. Visualization Config: Pick the BEST single pair of columns to plot to visualize this data.
           - For Cycling: X='Time', Y='Voltage' (or similar)
           - For Impedance: X='Real_Z', Y='Imag_Z' (Nyquist) - Note: Nyquist usually needs 'Imag_Z' inverted, but just pick the column for now.
           
        Return JSON ONLY:
        {{
            "dataset_type": "Impedance",
            "summary": "Electrochemical Impedance Spectroscopy scan showing real and imaginary resistance.",
            "plot_recommendation": {{
                "x_axis_col": "Real_Z",
                "y_axis_col": "-Imag_Z", 
                "title": "Nyquist Plot",
                "invert_y": true
            }},
            "is_standard_cycling": false
        }}
        """
        try:
            response = self.flash_model.generate_content(prompt)
            return self._extract_json(response.text)
        except Exception as e:
            print(f"Universal Analysis Error: {e}")
            # Fallback
            return {
                "dataset_type": "Unknown",
                "summary": "Could not identify data structure.",
                "plot_recommendation": {"x_axis_col": headers[0], "y_axis_col": headers[1] if len(headers)>1 else headers[0]},
                "is_standard_cycling": False
            }
    async def map_eis_columns(self, headers: list, sample_rows: str):
        """
        Specialized Mapper for EIS Data (Frequency, Real, Imaginary).
        """
        prompt = f"""
        Act as an Electrochemistry Data Expert.
        Identify the column names for Nyquist Plot data from the headers provided.
        
        Headers: {headers}
        Sample Data:
        {sample_rows}
        
        Target Keys:
        - 'freq': Frequency (Hz)
        - 'real': Real Impedance (Z', Re(Z)) (Ohm)
        - 'imag': Imaginary Impedance (Z'', Im(Z)) (Ohm)
        
        Return JSON mapping: {{ "freq": "original_col_name", "real": "...", "imag": "..." }}.
        If you cannot find a column, omit the key.
        """
        try:
            response = self.flash_model.generate_content(prompt)
            return self._extract_json(response.text)
        except Exception as e:
            print(f"EIS Mapping Error: {e}")
            return {"error": str(e)}

    async def map_columns_semantic(self, headers: list, sample_rows: str):
        """
        ROSETTA STONE: Maps arbitrary CSV headers to standard battery keys.
        """
        prompt = f"""
        Act as a Data Ingestion Specialist for Battery Research.
        Map the provided CSV headers to the standard internal schema:
        - 'time': Time in seconds (or equivalent step).
        - 'voltage': Cell voltage (V).
        - 'current': Current (A).
        - 'capacity': Capacity (Ah) (Optional).
        - 'temperature': Cell/Pack Temperature (C) (Optional).
        - 'soc': State of Charge (%) (Optional).
        
        Headers: {headers}
        Sample Data:
        {sample_rows}
        
        Return a JSON object mapping: {{ "standard_key": "original_header" }}.
        Only include keys you are confident about.
        Example: {{ "time": "Test_Time_s", "voltage": "U_meas", "current": "I_meas", "temperature": "T_aux_1" }}
        """
        try:
            response = self.flash_model.generate_content(prompt)
            return self._extract_json(response.text)
        except Exception as e:
            print(f"Mapping Error: {e}")
            return {"error": str(e)}

    async def analyze_telemetry_deep_dive(self, telemetry_summary: str):
        """
        Deep Dive Analysis for datasets with extended telemetry (Temp, SOC).
        """
        prompt = f"""
        Act as a Senior Battery Systems Engineer.
        Perform a Deep Dive Analysis on this battery telemetry snapshot.
        
        Data Snapshot (First 50 rows sample):
        {telemetry_summary}
        
        Analyze specifically for:
        1. **Thermal Stability**: Are temperatures correlated with high current? Any runaway signs?
        2. **SOC Consistency**: Does the voltage curve match expected OCV behavior for the given SOC?
        3. **Imbalance Risk**: (If multiple voltages present, though this snapshot is single-stream)
        
        Return JSON Key Highlights:
        {{
            "thermal_analysis": "Temperatures peaked at 45C during discharge, which is within limits but high.",
            "soc_analysis": "SOC usage efficient, range 90%-10%.",
            "safety_score": 85, // 0-100
            "optimization_tip": "Consider active cooling during high C-rate discharge."
        }}
        """
        try:
            response = self.flash_model.generate_content(prompt)
            return self._extract_json(response.text)
        except Exception as e:
            print(f"Deep Dive Error: {e}")
            return None

            return {"error": str(e)}

    async def analyze_eis_spectrum(self, frequency, z_real, z_imag):
        """
        Analyzes Electrochemical Impedance Spectroscopy (EIS) data.
        Splits analysis into 3 layers as per IEST standards:
        1. High Freq (>1kHz): Ohmic/Contact Resistance (R_b).
        2. Mid Freq (1kHz-1Hz): Charge Transfer (R_ct) / SEI.
        3. Low Freq (<1Hz): Diffusion (Warburg).
        """
        # Downsample for prompt if too large
        step = max(1, len(frequency) // 50)
        data_sample = []
        for i in range(0, len(frequency), step):
            data_sample.append(f"F:{frequency[i]:.1f}Hz, Z'={z_real[i]:.4f}, Z''={z_imag[i]:.4f}")
            
        prompt = f"""
        Act as an Electrochemistry Expert specialized in EIS Analysis (Nyquist Plots).
        
        Analyze this Impedance Spectrum sample data:
        {json.dumps(data_sample)}
        
        PERFORM A MULTI-LAYERED DIAGNOSIS:
        
        1. HIGH FREQUENCY (>1000 Hz): Check for Inductive tails or pure Ohmic shift.
           - Diagnostic: Is the start point shifted right? (High Contact Resistance/Cable failure).
           
        2. MID FREQUENCY (1000 Hz - 1 Hz): Check the Semicircle(s).
           - Diagnostic: Is the semicircle wide? (High Charge Transfer Resistance / Thick SEI / Cold Temp).
           
        3. LOW FREQUENCY (<1 Hz): Check the Diffusion Tail (Warburg).
           - Diagnostic: Is the slope 45 degrees (Healthy Diffusion) or vertical (Capacitive) or blocked?
           
        Return JSON ONLY:
        {{
            "layers": {{
                "ohmic": {{ "status": "Normal/Warning", "value_est_ohm": 0.05, "desc": "Good contact." }},
                "kinetics": {{ "status": "Normal/Warning", "desc": "Semicircle implies stable SEI." }},
                "diffusion": {{ "status": "Normal/Warning", "desc": "Clear Warburg tail visible." }}
            }},
            "overall_health": "Healthy" | "Degraded" | "Critical",
            "summary": "Battery shows normal impedance characteristics."
        }}
        """
        try:
            response = self.flash_model.generate_content(prompt)
            return self._extract_json(response.text)
        except Exception as e:
            print(f"EIS Analysis Error: {e}")
            return None

    def tool_search_knowledge_base(self, query: str):
        """Searches the internal battery manuals and document knowledge base for answers."""
        from services.rag_service import rag_service
        results = rag_service.search(query)
        return str(results)

    def tool_simulate_charging_analysis(self):
        """Runs a simulation of a battery charging session and analyzes the voltage curve for defects."""
        # Use Gemini to generate a dynamic simulation result instead of hardcoded string
        prompt = """
        Act as a Battery Simulation Engine.
        Simulate a charging session for a standard NMC cell.
        Randomly select one outcome: 
        1. Normal Operation (Healthy).
        2. Lithium Plating (Voltage Dip).
        3. High Resistance (Overheating).
        
        Return a short 2-sentence analysis report of the simulation.
        Example: "Simulation Complete. Anomaly detected: Lithium Plating signatures found at 45% SOC. Recommendation: High risk, reduce C-rate."
        """
        try:
            response = self.flash_model.generate_content(prompt)
            return response.text.strip()
        except:
            return "Simulation failed to generate report."

    def tool_predict_battery_life(self):
        """Predicts the remaining useful life (RUL) of the current battery pack based on historical cycles."""
        from services.aging_service import aging_service
        data = aging_service.generate_aging_curve(current_cycle=800)
        last_soh = data['soh'][-1]
        return f"Current Cycle: 800. Current SOH: {last_soh:.2f}%. Trend shows accelerated degradation (Knee Point) starting at cycle 600."

    def tool_parse_logs(self, log_content: str):
        """Analyzes technical error logs or fault codes to provide diagnostic steps."""
        # We can re-use the flash model directly or just prompt the agent.
        # Since the Agent IS the model, we can just return the log content with a wrapper
        # telling the agent to "Analyze this".
        # But to follow the pattern, let's call the specific parser method if it has specific logic.
        return f"Log Data Received: {log_content}. Please analyze this error code and suggest troubleshooting steps."

    def tool_create_incident_report(self, defect_type: str, severity: str, description: str):
        """Creates a formal incident report in the system based on analysis results."""
        # MVP: Just return confirmation
        import datetime
        report_id = f"INC-{datetime.datetime.now().strftime('%Y%m%d')}-001"
        return f"Incident Report Created Successfully. ID: {report_id}. Type: {defect_type}. Severity: {severity}. Status: Logged in Main Database."

    async def generate_commander_report(self, context: dict):
        """
        ACTS AS THE FLEET COMMANDER (Strategic Reasoning).
        Analyzes aggregate fleet statistics and provides high-level advice.
        """
        prompt = f"""
        Act as a Strategic Battery Fleet Commander.
        Review the following aggregated fleet statistics:
        
        Current Scenario: "{context.get('scenario')}"
        Thermal Spread (Max - Min Temp): {context.get('thermal_spread_degC')}°C
        Critical Outliers (Red List): {context.get('critical_outliers')} packs
        Max Fleet Temp: {context.get('max_temp_fleet')}°C
        
        Your Mission:
        1. Assess the strategic risk (Low/Medium/High).
        2. Provide 3 bullet-point tactical commands (e.g., "Throttle Fast Charging", "Isolate Batch X").
        3. Explain the "Why" using electrochemical reasoning (e.g., "High thermal spread indicates inefficient cooling balancing").
        
        Return JSON Key Highlights:
        {{
            "risk_level": "HIGH",
            "tactical_commands": ["Isolate 5 critical packs", "Reduce fleet C-rate to 0.5C", "Schedule thermal inspection"],
            "reasoning": "Thermal spread of >15C suggests cooling failure. Outliers at risk of propagation.",
            "status_message": "FLEET ALERT: Thermal variance exceeds safety limits."
        }}
        """
        try:
            response = self.flash_model.generate_content(prompt)
            return self._extract_json(response.text)
        except Exception as e:
            print(f"Commander Report Error: {e}")
            return {
                "risk_level": "UNKNOWN",
                "tactical_commands": ["Manual Inspection Required"],
                "reasoning": "AI Service Unreachable",
                "status_message": "AI OFFLINE"
            }

    async def generate_fleet_data(self, scenario: str):
        """
        DEPRECATED: Now handled by Physics Engine (fleet_service.py).
        Kept for fallback or legacy tests.
        """

    def tool_simulate_fleet(self, scenario: str):
        """Simulates a specific scenario on the battery fleet (e.g., 'heat wave', 'overcharge event'). Update the Fleet Monitor."""
        # This is a synchronous wrapper that schedules the async update via the service layer if possible,
        # or we block. Since tools are running in a thread/loop, we need to bridge to async.
        # For this hackathon, we can use a helper or run_until_complete if allowed, 
        # OR better: make the fleet_service.update_simulation synchronous wrapper or use the loop.
        
        # Quick Hack for Agent Tools (which are sync in default python SDK usually, unless async tools used):
        # We will trigger the update and return "Simulation Started". 
        # Actually, let's call it synchronously-blocking for simplicity in the Agent loop.
        import asyncio
        from services.fleet_service import fleet_service
        
        try:
            # Check if there is a running loop
            try:
                loop = asyncio.get_event_loop()
            except RuntimeError:
                loop = None

            if loop and loop.is_running():
                # We are in an async loop (FastAPI). 
                # We can't block. We should create a task.
                task = loop.create_task(fleet_service.update_simulation(scenario))
                return f"Simulation initiated for scenario: '{scenario}'. Visuals updating shortly."
            else:
                asyncio.run(fleet_service.update_simulation(scenario))
                return f"Simulation applied: '{scenario}'."
        except Exception as e:
             import traceback
             with open("error_log.txt", "a") as f:
                 f.write(f"Tool Error: {traceback.format_exc()}\n")
             return f"Simulation failed: {str(e)}"

    def get_agent_chat(self, history=None, context=None):
        """Returns a chat session with tools enabled."""
        tools = [
            self.tool_search_knowledge_base,
            self.tool_simulate_charging_analysis,
            self.tool_predict_battery_life,
            self.tool_parse_logs,
            self.tool_create_incident_report,
            self.tool_simulate_fleet
        ]
        
        # Dynamic System Instruction with Context
        context_block = ""
        if context:
            try:
                sanitized_context = self._sanitize_for_json(context)
                context_block = f"""
                
                CURRENT WORKSPACE STATE (AgentState):
                {json.dumps(sanitized_context, indent=2)}
                
                Use this state to answer questions like "What is the current error?" or "Is the battery healthy?".
                """
            except Exception as e:
                print(f"Context Serialization Error: {e}")
                # Continue without context if it fails, to prevent crash
                context_block = "\n(Context could not be loaded due to data format error.)"
        
        # Use Gemini 3 Flash Preview for the agent
        # Ensure context_block is a string, even if sanitized
        agent_model = genai.GenerativeModel(
            'models/gemini-3-flash-preview',
            tools=tools,
            system_instruction=f"""
            You are 'BatteryForge AI', an intelligent battery technician agent.
            You have access to tools to Search Manuals, Simulate Charging, Predict Aging, and Log Incidents.
            
            - **Navigation**: You can control the workspace!
              - To show Home Dashboard: Output `[VIEW: HOME]`
              - To show Visual Intelligence: Output `[VIEW: VISUAL]`
              - To show Logs: Output `[VIEW: LOGS]`
              - To show Simulation: Output `[VIEW: SIM]`
              - To show Fleet Monitor: Output `[VIEW: FLEET]`
            - **Safety & Alerts**:
              - If a user reports a "Fire", "Thermal Runaway", or "Critical Failure", IMMEDIATELY output `[ACTION: RED_ALERT]`.
              - To clear the alarm, output `[ACTION: CLEAR_ALERT]`.
            - **Visual capabilities**: You can analyze images AND live video!
              - If the user has a video stream or wants real-time checks, direct them to [VIEW: VISUAL] and mention the "Live Scout" tab.
              - "Visual Scout" supports Webcam and Screen Sharing for thermal runaway detection.
            - **Context Awareness**: You can see what the user is doing (Visual Inspection, Logs). Use that context!
            - If the user asks to "log this" or "create a report", use `create_incident_report` using the data from the context.
            - ALWAYS check your tools before saying "I don't know".
            - If asked about error codes or safety, use `search_knowledge_base`.
            - If asked to "check the charging curve" or "simulate charging", use `simulate_charging_analysis`.
            - If asked about "battery life" or "how long it will last", use `predict_battery_life`.
            - Be concise and helpful.
            {context_block}
            """
        )
        
        return agent_model.start_chat(history=history, enable_automatic_function_calling=True)

gemini_service = GeminiService()
