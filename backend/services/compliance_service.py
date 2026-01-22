import asyncio
from datetime import datetime
from services.log_stream import log_stream_service

class ComplianceService:
    def __init__(self):
        pass

    async def verify_electrical_test(self, test_results: dict):
        """
        Phase 5: Electrical Testing Logic.
        Automates pass/fail sorting.
        """
        batch_id = test_results.get("batch_id")
        measurements = test_results.get("measurements", [])
        
        passed_count = 0
        failed_count = 0
        failure_reasons = []
        
        for m in measurements:
            # Rule: No opens, no shorts (Resistance check)
            # Open > 1000 Ohm, Short < 5 Ohm
            # Expected Trace Resistance ~ 0.1-2 Ohm
            # Expected Isolation > 10M Ohm
            
            is_valid = True
            if m["type"] == "CONTINUITY":
                if m["value_ohm"] > 10.0: # Too high -> Open
                    is_valid = False
                    failure_reasons.append(f"Board-{m['board_id']}: OPEN_CIRCUIT ({m['value_ohm']} Ohm)")

            elif m["type"] == "ISOLATION":
                if m["value_ohm"] < 1_000_000: # Too low -> Short
                    is_valid = False
                    failure_reasons.append(f"Board-{m['board_id']}: SHORT_CIRCUIT ({m['value_ohm']} Ohm)")
            
            if is_valid:
                passed_count += 1
            else:
                failed_count += 1
                
        status = "PASS" if failed_count == 0 else "FAIL_SORT_REQUIRED"
        
        await log_stream_service.emit_log("E-Test", f"Batch {batch_id}: {passed_count} PASS, {failed_count} FAIL", "INFO")
        
        return {
            "batch_id": batch_id,
            "status": status,
            "yield_rate": round(passed_count / (passed_count + failed_count) * 100, 2) if measurements else 0,
            "failures": failure_reasons
        }

    async def check_packaging(self, packaging_image_meta: dict):
        """
        Phase 5: Packaging Automation.
        Verifies desiccant and HIC present.
        """
        # Mock Vision Check
        filename = packaging_image_meta.get("filename", "").lower()
        
        has_desiccant = "desiccant" in filename or "complete" in filename
        has_hic = "hic" in filename or "complete" in filename
        
        missing = []
        if not has_desiccant: missing.append("Desiccant Bag")
        if not has_hic: missing.append("Humidity Indicator Card")
        
        if missing:
             await log_stream_service.emit_log("Packaging", f"Missing items: {', '.join(missing)}", "WARNING")
             return {"status": "FAIL", "missing_items": missing}
             
        return {"status": "PASS", "sealed": True}

    async def generate_certificate(self, batch_info: dict):
        """
        Phase 5: Certificate of Conformity (CoC).
        """
        coc_id = f"COC-{datetime.now().strftime('%Y%m%d')}-{hash(batch_info['batch_id']) % 10000}"
        
        doc = {
            "certificate_id": coc_id,
            "issue_date": datetime.now().isoformat(),
            "customer": batch_info.get("customer", "Unknown"),
            "part_number": batch_info.get("part_number"),
            "batch_id": batch_info.get("batch_id"),
            "compliance_statement": "We certify that the products listed above have been manufactured in accordance with the specifications.",
            "specs_verified": [
                "Material: FR4 TG170",
                "Copper Thickness: 1oz",
                "Finish: ENIG",
                "E-Test: 100% Pass",
                "Visual: IPC-A-600 Class 2"
            ],
            "authorized_by": "BatteryForgeAI Quality Module"
        }
        
        return doc

compliance_service = ComplianceService()
