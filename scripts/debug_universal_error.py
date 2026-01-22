
import sys
import os
sys.path.append(os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'backend'))

import asyncio
import re
from services.charging_service import charging_service

async def reproduce():
    print("--- 1. Testing Float in Regex ---")
    try:
        re.search("pattern", 1.5)
    except Exception as e:
        print(f"Result (float subject): {type(e).__name__}: {e}")

    try:
        re.search(1.5, "string")
    except Exception as e:
        print(f"Result (float pattern): {type(e).__name__}: {e}")

    print("\n--- 2. Testing Float Headers in Processing ---")
    csv_content = b"0.1, 0.2\n1, 2\n" 
    # This might result in headers as strings "0.1", "0.2" or floats if read specially. 
    # But read_csv defaults to first row as header.
    
    try:
        df, meta = await charging_service.process_universal_file(csv_content)
        print("Universal Process Success")
    except Exception as e:
        print(f"Universal Process Error: {type(e).__name__}: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(reproduce())
