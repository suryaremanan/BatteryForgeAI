
import sys
import os
sys.path.append(os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'backend'))

import asyncio
from services.charging_service import charging_service

# Mock 1: Impedance
impedance_csv = b"""Freq, Z_real, Z_imag
1000, 50.1, -2.0
500, 52.3, -4.5
"""

# Mock 2: Cycling
cycling_csv = b"""Time, Voltage, Current
0, 3.2, 1.0
10, 3.3, 1.0
"""

async def verify_universal():
    print("--- Test 1: Impedance ---")
    df1, meta1 = await charging_service.process_universal_file(impedance_csv)
    print(f"Type: {meta1.get('dataset_type')}")
    print(f"Plot Rec: {meta1.get('plot_recommendation')}")
    
    if meta1.get('dataset_type') != "Cycling":
        print("SUCCESS: Identified non-cycling data correctly.")
    else:
        print(f"FAILURE: Misidentified Impedance as {meta1.get('dataset_type')}")

    print("\n--- Test 2: Cycling ---")
    df2, meta2 = await charging_service.process_universal_file(cycling_csv)
    print(f"Type: {meta2.get('dataset_type')}")
    
    # Check if we can technically re-parse it for metrics (mimicking routes logic)
    if meta2.get('dataset_type') == "Cycling" or meta2.get('is_standard_cycling'):
         print("SUCCESS: Identified cycling data correctly.")
         from services.charging_service import charging_service as cs2
         # Note: process_universal returns raw df. routes.py calls parse_cycling_data separately for metrics.
         # So here we just confirm detection is correct.
    else:
         print(f"FAILURE: Misidentified Cycling as {meta2.get('dataset_type')}")

if __name__ == "__main__":
    asyncio.run(verify_universal())
