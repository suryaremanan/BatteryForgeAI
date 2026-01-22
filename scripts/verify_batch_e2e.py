
import sys
import os
import requests
import json

API_URL = "http://127.0.0.1:8000"

def verify_batch_e2e():
    print("1. Preparing Batch Upload...")
    
    # Mock files
    files = [
        ('files', ('batch_test_1.csv', 'time, voltage, current\n0,3.2,1.0\n10,3.3,1.0', 'text/csv')),
        ('files', ('batch_test_2.csv', 'Freq, Z_real, Z_imag\n1000, 50, -2', 'text/csv'))
    ]
    
    try:
        response = requests.post(f"{API_URL}/analyze/batch", files=files)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"Batch Result: Processed {data['processed']}/{data['total_files']}")
            if data['processed'] == 2:
                print("PASS: Batch upload handled correctly.")
            else:
                print("FAIL: Not all files processed.")
        else:
            print(f"FAIL: Batch upload failed. {response.text}")
            return

    except Exception as e:
        print(f"FAIL: Request error: {e}")
        return

    print("\n2. Checking History...")
    try:
        response = requests.get(f"{API_URL}/history")
        history = response.json()
        print(f"History Count: {len(history)}")
        
        found_test_1 = any(r['filename'] == 'batch_test_1.csv' for r in history)
        found_test_2 = any(r['filename'] == 'batch_test_2.csv' for r in history)
        
        if found_test_1 and found_test_2:
            print("PASS: Both batch files found in history.")
        else:
            print("FAIL: Batch files missing from history.")
            
    except Exception as e:
         print(f"FAIL: History fetch error: {e}")

if __name__ == "__main__":
    verify_batch_e2e()
