import pytest
import sys
import os

# Add backend to path
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from services.simulation_service import simulation_service

def test_etching_control():
    print("\n--- Testing Etching Control ---")
    
    # Test 1: Standard
    res1 = simulation_service.control_etching_process(1.0, 100.0)
    print(f"Standard (1oz, 100%): {res1['control_actions']}")
    assert 2.0 < res1['control_actions']['conveyor_speed_m_min'] < 3.0

    # Test 2: High Copper (Needs slower speed)
    res2 = simulation_service.control_etching_process(2.0, 100.0)
    print(f"Heavy Copper (2oz): {res2['control_actions']}")
    assert res2['control_actions']['conveyor_speed_m_min'] < res1['control_actions']['conveyor_speed_m_min']

    # Test 3: High Concentration (Faster etch)
    res3 = simulation_service.control_etching_process(1.0, 120.0)
    print(f"High Conc (120%): {res3['control_actions']}")
    assert res3['control_actions']['conveyor_speed_m_min'] > res1['control_actions']['conveyor_speed_m_min']
    assert "FAIL" in res3['control_actions']['oxide_safety_check']

def test_lamination_scaling():
    print("\n--- Testing Lamination Scaling ---")
    
    # Test 1: FR4 Standard
    res1 = simulation_service.predict_lamination_scaling("FR4-Standard", 4)
    print(f"FR4 4-Layer: {res1['scaling_factors']}")
    assert res1['scaling_factors']['x_comp'] > 0

    # Test 2: High Layer Count (More shrinkage)
    res2 = simulation_service.predict_lamination_scaling("FR4-Standard", 16)
    print(f"FR4 16-Layer: {res2['scaling_factors']}")
    assert res2['scaling_factors']['x_comp'] > res1['scaling_factors']['x_comp']

def test_plating_opt():
    print("\n--- Testing Plating Optimization ---")
    
    # Test 1: Small Panel
    res1 = simulation_service.optimize_plating_distribution(100, 100)
    print(f"Small Panel: {res1['suggested_setup']}")
    assert res1['predicted_uniformity_score'] > 95

    # Test 2: Large Panel
    res2 = simulation_service.optimize_plating_distribution(600, 500) # > 50000 area
    print(f"Large Panel: {res2['suggested_setup']}")
    assert "auxiliary cathode" in res2['suggested_setup']

if __name__ == "__main__":
    test_etching_control()
    test_lamination_scaling()
    test_plating_opt()
