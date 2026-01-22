
import sys
import os
import pandas as pd
import io

# Add backend to path
sys.path.append(os.path.join(os.getcwd(), 'backend'))

from services.charging_service import charging_service

# Mock CSV Content with TRICKY headers
csv_content = """Test_Time (s), Cell Potential (V), Current (Amps)
0, 3.2, 1.0
10, 3.3, 1.0
20, 3.4, 1.0
"""

def test_parser():
    print("Testing parser with mock CSV...")
    df = charging_service.parse_cycling_data(csv_content.encode('utf-8'))
    
    print("Columns found:", df.columns.tolist())
    
    assert 'time' in df.columns
    assert 'voltage' in df.columns
    assert 'current' in df.columns
    assert len(df) == 3
    
    print("Test Passed: DataFrame shape is correct.")

if __name__ == "__main__":
    try:
        test_parser()
    except Exception as e:
        print(f"Test Failed: {e}")
        sys.exit(1)
