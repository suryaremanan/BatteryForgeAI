
import requests
import json
import time

API_URL = "http://127.0.0.1:8000/api"

def verify_phase5():
    print("--- Starting Phase 5 Verification (A+ Upgrade) ---")
    
    # Create a dummy CSV
    csv_content = "Time,Voltage,Current\n0,3.0,0.5\n10,3.1,0.5\n20,3.2,0.5"
    files = [('file', ('phase5_test.csv', csv_content, 'text/csv'))]
    
    # 1. Test Privacy/Local Mode
    print("\n1. Testing Privacy Mode (Local Analysis)...")
    try:
        # Send local_mode = True
        payload = {'local_mode': 'true'}
        r = requests.post(f"{API_URL}/analyze/charging", files=files, data=payload)
        
        if r.status_code == 200:
            data = r.json()
            
            # Check Summary
            summary = data.get('analysis', {}).get('description', '')
            print(f"Summary: {summary}")
            if "Privacy Mode" in summary or "Local" in summary:
                print("PASS: Privacy Mode detected.")
            else:
                print("FAIL: Did not detect Privacy Mode in summary.")
                
            # Check Plot Data (JSON)
            plot_data = data.get('plot_data')
            if plot_data and isinstance(plot_data, list) and len(plot_data) > 0:
                print(f"PASS: Received Interactive Plot Data ({len(plot_data)} points).")
            else:
                print("FAIL: Missing plot_data JSON.")
                
        else:
            print(f"FAIL: Request failed {r.status_code} - {r.text}")
            
    except Exception as e:
        print(f"FAIL: Error {e}")

    # 2. Test Standard Mode (Gemini)
    print("\n2. Testing Standard Mode (Gemini)...")
    try:
        # Reset file pointer
        files = [('file', ('phase5_std.csv', csv_content, 'text/csv'))]
        r = requests.post(f"{API_URL}/analyze/charging", files=files) 
        
        if r.status_code == 200:
            data = r.json()
            # Check Plot Data exists here too
            if data.get('plot_data'):
                 print("PASS: Standard mode also returns plot data.")
            else:
                 print("FAIL: Standard mode missing plot data.")
        else:
            print(f"FAIL: Standard request failed {r.status_code}")

    except Exception as e:
        print(f"FAIL: Error {e}")

if __name__ == "__main__":
    verify_phase5()
