import random
import asyncio
from services.log_stream import log_stream_service

class VisionService:
    def __init__(self):
        # Mock Defect Taxonomy
        self.defect_classes = {
            "OPEN_CIRCUIT": {"severity": "FATAL", "action": "SCRAP"},
            "SHORT_CIRCUIT": {"severity": "REPAIRABLE", "action": "MANUAL_REPAIR"},
            "EXCESS_COPPER": {"severity": "REPAIRABLE", "action": "TRIM"},
            "MOUSE_BITE": {"severity": "WARNING", "action": "INSPECT"},
            "SOLDER_MASK_ON_PAD": {"severity": "CRITICAL", "action": "STRIP_AND_RECOAT"}
        }

    async def classify_defect(self, image_metadata: dict):
        """
        Phase 3: Enhanced Defect Classification.
        Simulates AI inference on AOI/AVI images.
        """
        from services.gemini_service import gemini_service
        
        # In a real app, we'd pass the file object or bytes. 
        # For this demo refactor, we assume image_metadata might contain 'bytes' or we mock it if not present,
        # but the request flows from routes. So let's check if 'image_data' key exists or filename.
        
        if "image_data" in image_metadata:
             # REAL AI PATH
             result = await gemini_service.analyze_pcb_defect(image_metadata["image_data"], image_metadata.get("mime_type", "image/jpeg"))
             
             # Map Gemini result to our internal schema if needed (or just pass through)
             # The implementations match closely.
             
             # Log it
             log_level = "ERROR" if result.get("severity") == "FATAL" else "WARNING"
             await log_stream_service.emit_log("VisionAI", f"Gemini Detected: {result.get('defect_type')} ({result.get('confidence')})", log_level)
             return result

        else:
            # FALLBACK MOCK (If no real image passed, e.g. legacy tests)
            await asyncio.sleep(0.5)
            hint = image_metadata.get("filename", "").upper()
            
            if "OPEN" in hint:
                defect_type = "OPEN_CIRCUIT"
            elif "SHORT" in hint:
                defect_type = "SHORT_CIRCUIT"
            elif "MASK" in hint:
                defect_type = "SOLDER_MASK_ON_PAD"
            else:
                defect_type = "MOUSE_BITE"

            classification = self.defect_classes.get(defect_type, self.defect_classes["MOUSE_BITE"])
            
            result = {
                "defect_type": defect_type,
                "confidence": 0.88,
                "severity": classification["severity"],
                "recommended_action": classification["action"],
                "bbox": [100, 100, 150, 150] 
            }
            
            await log_stream_service.emit_log("VisionAI", f"Simulated Detect: {defect_type}", "WARNING")
            return result

    async def inspect_solder_mask(self, panel_id: str):
        """
        Phase 3: Solder Mask & Surface Finish Inspection.
        Checks registration and coverage.
        """
        # Simulate registration check
        offset_x = random.uniform(-0.05, 0.05) # mm
        offset_y = random.uniform(-0.05, 0.05)
        
        # Rule: Offset > 0.03mm is failure
        status = "PASS"
        if abs(offset_x) > 0.035 or abs(offset_y) > 0.035:
            status = "FAIL_ALIGNMENT"
            
        return {
            "panel_id": panel_id,
            "mask_registration": {
                "offset_x_mm": round(offset_x, 4),
                "offset_y_mm": round(offset_y, 4),
                "status": status
            },
            "surface_finish": "ENIG",
            "solderability_risk": "LOW" if status == "PASS" else "HIGH"
        }

vision_service = VisionService()
