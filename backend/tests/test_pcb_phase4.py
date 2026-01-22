import pytest
import sys
import os

sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from services.fleet_service import fleet_service
from services.simulation_service import simulation_service

def test_drill_api_logic():
    print("\n--- Testing Drill Logic ---")
    
    # Check standard drill
    res = fleet_service.check_drill_wear("D-TEST-1", 500)
    print(f"Drill 500: {res['wear_status']}")
    assert res['wear_status'] == "GOOD"
    
    # Check worn drill
    res2 = fleet_service.check_drill_wear("D-TEST-OLD", 1600)
    print(f"Drill 1600: {res2['wear_status']}")
    assert res2['wear_status'] == "CRITICAL"

def test_plating_api_logic():
    print("\n--- Testing Plating Logic ---")
    
    # Check simple board
    res = simulation_service.optimize_plating_distribution(100, 200)
    print(f"Small Board: {res['suggested_setup']}")
    assert "Standard" in res['suggested_setup']
    
    # Check huge board
    res2 = simulation_service.optimize_plating_distribution(1000, 1000)
    print(f"Giant Board: {res2['suggested_setup']}")
    assert "shielding" in res2['suggested_setup']

if __name__ == "__main__":
    test_drill_api_logic()
    test_plating_api_logic()
