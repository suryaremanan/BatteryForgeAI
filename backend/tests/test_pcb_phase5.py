import pytest
import asyncio
import sys
import os

sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from services.compliance_service import compliance_service

@pytest.mark.asyncio
async def test_electrical_verification():
    print("\n--- Testing E-Test Logic ---")
    
    # Batch with 1 Fail
    data = {
        "batch_id": "B-101",
        "measurements": [
            {"board_id": 1, "type": "CONTINUITY", "value_ohm": 0.5}, # Good
            {"board_id": 2, "type": "CONTINUITY", "value_ohm": 9999.0}, # Open (Bad)
            {"board_id": 3, "type": "ISOLATION", "value_ohm": 10**8} # Good
        ]
    }
    
    res = await compliance_service.verify_electrical_test(data)
    print(f"Batch B-101: {res['status']} (Yield: {res['yield_rate']}%)")
    assert res['status'] == "FAIL_SORT_REQUIRED"
    assert res['yield_rate'] < 100.0

@pytest.mark.asyncio
async def test_packaging_check():
    print("\n--- Testing Packaging Logic ---")
    
    # Good Package
    res1 = await compliance_service.check_packaging({"filename": "pack_complete_123.jpg"})
    assert res1['status'] == "PASS"
    
    # Bad Package
    res2 = await compliance_service.check_packaging({"filename": "pack_missing_stuff.jpg"})
    assert res2['status'] == "FAIL"
    assert "Desiccant" in res2['missing_items'][0]

@pytest.mark.asyncio
async def test_coc_gen():
    print("\n--- Testing CoC Generation ---")
    
    req = {"batch_id": "B-999", "customer": "Tesla", "part_number": "PCB-X-2025"}
    doc = await compliance_service.generate_certificate(req)
    print(f"Certificate: {doc['certificate_id']}")
    assert "Tesla" in doc['customer']
    assert "100% Pass" in doc['specs_verified'][3]

if __name__ == "__main__":
    loop = asyncio.new_event_loop()
    loop.run_until_complete(test_electrical_verification())
    loop.run_until_complete(test_packaging_check())
    loop.run_until_complete(test_coc_gen())
