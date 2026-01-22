
import sys
import os
sys.path.append(os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'backend')) # Add backend to path

import asyncio
from services.charging_service import charging_service

# Mock IMPEDANCE CSV Content
csv_content = b"""Sense_current, Battery_current, Current_ratio, Battery_impedance, Rectified_Impedance
0.1, 0.1, 1.0, 50.0, 50.0
0.2, 0.2, 1.0, 51.0, 51.0
"""

async def verify_rejection():
    print("Testing Impedance File Rejection...")
    try:
        df = await charging_service.parse_cycling_data(csv_content)
        print("FAILURE: Parser accepted the file (Unexpected).")
    except ValueError as e:
        print(f"SUCCESS: Parser rejected the file with error: {e}")
        if "Impedance (EIS)" in str(e):
             print("(Correct Error Message Confirmed)")
        else:
             print("(Warning: Error message differs from expected)")
    except Exception as e:
        print(f"FAILURE: Unexpected error type: {type(e)} - {e}")

if __name__ == "__main__":
    asyncio.run(verify_rejection())
