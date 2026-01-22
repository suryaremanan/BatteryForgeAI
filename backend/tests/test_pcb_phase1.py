import pytest
import asyncio
import sys
import os

# Add backend to path
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from services.gerber_service import gerber_service
from services.fleet_service import fleet_service

@pytest.mark.asyncio
async def test_gerber_analysis():
    print("\n--- Testing Gerber Analysis ---")
    
    # Test 1: Normal File
    res1 = await gerber_service.analyze_gerber("Layer1.gbr")
    assert res1["status"] == "PASS"
    print(f"Normal File: {res1['status']}")

    # Test 2: Missing Layer (Simulated by filename)
    res2 = await gerber_service.analyze_gerber("Incomplete_Board.gbr")
    assert res2["status"] == "FAIL"
    assert "MISSING_LAYER" in [i['type'] for i in res2['issues']]
    print(f"Missing Layer File: {res2['status']} - Issues: {len(res2['issues'])}")

    # Test 3: EQ Generation
    eq = await gerber_service.generate_eq(res2)
    assert eq is not None
    assert eq["status"] == "PENDING_CUSTOMER_REPLY"
    print(f"EQ Generated ID: {eq['id']}")

def test_material_optimization():
    print("\n--- Testing Material Optimization ---")
    
    # Test 1: Success FIFO
    req = {"type": "FR4-Core", "quantity": 100}
    res = fleet_service.optimize_material_selection(req)
    assert res["success"] == True
    print(f"Allocation for 100: {len(res['allocation'])} batches used.")

    # Test 2: Insufficient Stock
    req_fail = {"type": "FR4-Core", "quantity": 10000}
    res_fail = fleet_service.optimize_material_selection(req_fail)
    assert res_fail["success"] == False
    print(f"Excessive Request: {res_fail['message']}")

def test_drill_wear():
    print("\n--- Testing Drill Wear ---")
    
    # Test 1: Good Drill
    status = fleet_service.check_drill_wear("D-001", 500)
    assert status["wear_status"] == "GOOD"
    print(f"Drill 500 hits: {status['wear_status']}")

    # Test 2: Warning
    status_warn = fleet_service.check_drill_wear("D-002", 1300)
    assert status_warn["wear_status"] == "WARNING"
    print(f"Drill 1300 hits: {status_warn['wear_status']}")

    # Test 3: Critical
    status_crit = fleet_service.check_drill_wear("D-003", 2000)
    assert status_crit["wear_status"] == "CRITICAL"
    print(f"Drill 2000 hits: {status_crit['wear_status']}")

if __name__ == "__main__":
    # Manually running async loop for this script if called directly
    loop = asyncio.new_event_loop()
    loop.run_until_complete(test_gerber_analysis())
    test_material_optimization()
    test_drill_wear()
