import asyncio
from datetime import datetime
from services.log_stream import log_stream_service

class GerberService:
    def __init__(self):
        self.standard_specs = {
            "min_track_width": 0.1,  # mm
            "min_spacing": 0.1,      # mm
            "min_drill_size": 0.2,   # mm
            "layers_required": ["Top", "Bottom", "Outline", "Drill"]
        }

    async def analyze_gerber(self, file_path: str, specs: dict = None, file_content: str = None):
        """
        Simulates parsing a Gerber file and checking against specifications.
        Updated Phase 6: Supports Real AI Text Analysis.
        """
        await log_stream_service.emit_log("GerberAnalyzer", f"Analyzing file: {file_path}", "INFO")
        
        results = {
            "file": file_path,
            "timestamp": datetime.now().isoformat(),
            "issues": [],
            "status": "PASS"
        }

        # REAL AI PATH
        if file_content:
            from services.gemini_service import gemini_service
            ai_analysis = await gemini_service.analyze_gerber_text(file_content)
            
            if "error" not in ai_analysis:
                if ai_analysis.get("engineering_check") == "FAIL":
                    results["status"] = "WTF_FAIL" # Work To Fix
                    results["issues"].append({
                        "type": "AI_DETECTED_ISSUE", 
                        "severity": "WARNING", 
                        "message": str(ai_analysis.get("missing_features", "Unknown Issue"))
                    })
                else:
                    results["ai_metadata"] = ai_analysis # Store valid metadata
            
        # Mock/Legacy path (for logical fallback if AI fails or no content)
        if "incomplete" in file_path.lower():
            results["issues"].append({
                "type": "MISSING_LAYER",
                "severity": "CRITICAL",
                "message": "Bottom solder mask layer missing."
            })
            results["status"] = "FAIL"

        if results["status"] != "PASS":
             await log_stream_service.emit_log("GerberAnalyzer", f"Issues found: {len(results['issues'])}", "WARNING")
        else:
             await log_stream_service.emit_log("GerberAnalyzer", "Analysis passed. Specs compliant.", "SUCCESS")

        return results

    async def generate_eq(self, analysis_results: dict):
        """
        Generates an Engineering Question (EQ) form based on analysis issues.
        """
        if not analysis_results.get("issues"):
            return None

        eq_id = f"EQ-{datetime.now().strftime('%Y%m%d')}-{hash(analysis_results['timestamp']) % 10000}"
        
        questions = []
        for issue in analysis_results["issues"]:
            questions.append({
                "issue_type": issue["type"],
                "description": issue["message"],
                "suggested_action": "Please provide missing layer" if issue["type"] == "MISSING_LAYER" else "Confirm acceptance of violation or modify design."
            })

        eq_document = {
            "id": eq_id,
            "created_at": datetime.now().isoformat(),
            "related_file": analysis_results["file"],
            "questions": questions,
            "status": "PENDING_CUSTOMER_REPLY"
        }
        
        await log_stream_service.emit_log("GerberAnalyzer", f"Generated EQ: {eq_id}", "INFO")
        return eq_document

gerber_service = GerberService()
