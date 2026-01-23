"""
Vision Tools for Battery Defect Analysis
Using Gemini's multimodal capabilities for image and video analysis.
"""
import os
import base64
from typing import Optional, List
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

# Vision model for image analysis
vision_model = genai.GenerativeModel('gemini-3-flash-preview')


def analyze_battery_image(image_base64: str, mime_type: str = "image/jpeg") -> dict:
    """
    Analyzes a battery image for defects using Gemini Vision.
    
    Args:
        image_base64: Base64 encoded image data
        mime_type: MIME type of the image (e.g., 'image/jpeg', 'image/png')
    
    Returns:
        dict: Analysis results with defect_type, severity, location, and recommendations
    """
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
        image_data = base64.b64decode(image_base64)
        response = vision_model.generate_content([
            prompt,
            {"mime_type": mime_type, "data": image_data}
        ])
        
        # Parse JSON from response
        import json
        text = response.text.replace("```json", "").replace("```", "").strip()
        start_idx = text.find('{')
        end_idx = text.rfind('}')
        if start_idx != -1 and end_idx != -1:
            return json.loads(text[start_idx:end_idx + 1])
        return {"error": "Could not parse response", "raw": text}
    except Exception as e:
        return {"error": str(e), "defect_type": "Unknown", "severity": "Unknown"}


def analyze_pcb_image(image_base64: str, mime_type: str = "image/jpeg") -> dict:
    """
    Analyzes a PCB/BMS image for manufacturing defects.
    
    Args:
        image_base64: Base64 encoded image data
        mime_type: MIME type of the image
    
    Returns:
        dict: PCB defect analysis with defect_type, severity, and recommended_action
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
        "confidence": 0.95,
        "severity": "FATAL" | "REPAIRABLE" | "WARNING" | "NORMAL",
        "recommended_action": "SCRAP" | "MANUAL_REPAIR" | "STRIP_AND_RECOAT" | "NONE",
        "description": "Description of the finding",
        "bbox": [x, y, w, h]
    }
    """
    
    try:
        image_data = base64.b64decode(image_base64)
        response = vision_model.generate_content([
            prompt,
            {"mime_type": mime_type, "data": image_data}
        ])
        
        import json
        text = response.text.replace("```json", "").replace("```", "").strip()
        start_idx = text.find('{')
        end_idx = text.rfind('}')
        if start_idx != -1 and end_idx != -1:
            return json.loads(text[start_idx:end_idx + 1])
        return {"error": "Could not parse response"}
    except Exception as e:
        return {"error": str(e)}


def analyze_video_stream(video_frames: List[str], analysis_type: str = "thermal_runaway") -> dict:
    """
    Analyzes video frames for real-time battery monitoring.
    Supports thermal runaway detection and manufacturing line QA.
    
    Args:
        video_frames: A list of base64 encoded video frames.
        analysis_type: Type of analysis ('thermal_runaway', 'assembly_qa', 'defect_scan')
    
    Returns:
        dict: Video analysis results with timestamps and detected events
    """
    prompts = {
        "thermal_runaway": """
            Analyze these sequential battery images for signs of thermal runaway:
            1. Smoke emission
            2. Swelling progression
            3. Color changes (yellowing, browning)
            4. Flame or sparks
            
            Return JSON with: 
            {
                "thermal_event_detected": boolean,
                "severity": "NONE" | "WARNING" | "CRITICAL" | "EMERGENCY",
                "frame_index": number (first detection),
                "description": string,
                "immediate_action": string
            }
        """,
        "assembly_qa": """
            Analyze these manufacturing line frames for assembly quality:
            1. Component alignment
            2. Solder quality
            3. Missing components
            
            Return JSON with detected issues per frame.
        """,
        "defect_scan": """
            Scan these battery images for progressive defect development.
            Track any changes between frames that indicate degradation.
        """
    }
    
    prompt = prompts.get(analysis_type, prompts["thermal_runaway"])
    
    try:
        # Build content with multiple images
        content = [prompt]
        for i, frame_b64 in enumerate(video_frames[:10]):  # Limit to 10 frames
            image_data = base64.b64decode(frame_b64)
            content.append({"mime_type": "image/jpeg", "data": image_data})
        
        response = vision_model.generate_content(content)
        
        import json
        text = response.text.replace("```json", "").replace("```", "").strip()
        start_idx = text.find('{')
        end_idx = text.rfind('}')
        if start_idx != -1 and end_idx != -1:
            return json.loads(text[start_idx:end_idx + 1])
        return {"analysis_type": analysis_type, "raw_response": text}
    except Exception as e:
        return {"error": str(e), "thermal_event_detected": False}
