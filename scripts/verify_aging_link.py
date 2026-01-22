
import sys
import os
sys.path.append(os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'backend')) # Add backend to path

import asyncio
from services.charging_service import charging_service
from services.aging_service import aging_service

# Mock CSV Content (Real formatted)
csv_content = b"""Time, Voltage (V), Current (A)
0, 3.2, 1.0
100, 3.3, 1.0
200, 3.4, 1.0
300, 3.5, 1.0
400, 3.6, 1.0
3600, 4.2, 1.0
"""
# 1 Amp for 3600 seconds = 1 Ah

async def verify_link():
    print("1. Parsing CSV and Calculating Metrics...")
    df = await charging_service.parse_cycling_data(csv_content)
    metrics = charging_service.calculate_metrics(df)
    print(f"Metrics: {metrics}")
    
    capacity = metrics['capacity_ah']
    # Expected approx 1.0 Ah (trapezoidal integration might differ slightly but close)
    
    print("\n2. Feeding Capacity to Aging Service...")
    # Nominal is 3.0Ah. So 1Ah is ~33% SOH (Very degraded battery!)
    aging_data = aging_service.generate_aging_curve(current_capacity_ah=capacity, nominal_capacity_ah=3.0)
    
    current_metrics = aging_data['current_metrics']
    print(f"Aging Sim Start State: {current_metrics}")
    
    if abs(current_metrics['calculated_soh'] - 35) < 5: 
        print("SUCCESS: Aging simulation correctly initialized from calculated capacity!")
    else:
        print(f"FAILURE: SOH {current_metrics['calculated_soh']} is not consistent with input.")

    print("\n3. Generated Curve Preview:")
    print(f"First 5 Cycles: {aging_data['cycles'][:5]}")
    print(f"First 5 SOH: {aging_data['soh'][:5]}")

if __name__ == "__main__":
    asyncio.run(verify_link())
