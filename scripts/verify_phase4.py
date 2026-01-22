
import requests
import time

API_URL = "http://127.0.0.1:8000/api"

def verify_phase4():
    print("--- Starting Phase 4 Verification ---")
    
    # 1. Upload 2 Files (to populate history & disk)
    print("\n1. Uploading Test Files...")
    files1 = [('files', ('comp_test_1.csv', 'time,voltage\n0,3.0\n10,3.5', 'text/csv'))]
    files2 = [('files', ('comp_test_2.csv', 'time,voltage\n0,3.1\n10,3.6', 'text/csv'))]
    
    try:
        # Use batch endpoint as it uses the same underlying save logic now?
        # Actually batch uses batch_service which we updated.
        # Let's use batch for convenience.
        r1 = requests.post(f"{API_URL}/analyze/batch", files=files1)
        r2 = requests.post(f"{API_URL}/analyze/batch", files=files2)
        
        if r1.status_code == 200 and r2.status_code == 200:
            print("PASS: Uploads successful.")
        else:
            print(f"FAIL: Uploads failed. {r1.text} {r2.text}")
            return
            
    except Exception as e:
        print(f"FAIL: Upload error: {e}")
        return

    # 2. Get History ID
    print("\n2. Fetching IDs from History...")
    try:
        r = requests.get(f"{API_URL}/history")
        history = r.json()
        ids = [item['id'] for item in history if 'comp_test' in item['filename']]
        # Take top 2
        ids = ids[:2]
        print(f"Found IDs: {ids}")
        
        if len(ids) < 2:
            print("FAIL: Not enough history records found.")
            return
            
    except Exception as e:
        print(f"FAIL: History fetch error: {e}")
        return

    # 3. Test Export
    print("\n3. Testing CSV Export...")
    try:
        r = requests.get(f"{API_URL}/history/export")
        if r.status_code == 200 and r.headers['content-type'] == 'text/csv':
            content = r.text
            if "Capacity (Ah)" in content and "comp_test_1.csv" in content:
                print("PASS: CSV Export contains expected data.")
            else:
                print("FAIL: CSV content invalid.")
                print(content[:200])
        else:
            print(f"FAIL: Export endpoint failed. {r.status_code}")
    except Exception as e:
        print(f"FAIL: Export error: {e}")

    # 4. Test Comparison
    print("\n4. Testing Comparison Plot...")
    try:
        payload = {"ids": ids}
        r = requests.post(f"{API_URL}/analyze/comparison", json=payload)
        
        if r.status_code == 200:
            data = r.json()
            if "data:image/png;base64" in data.get('plot_image', ''):
                print("PASS: Comparison plot generated.")
            else:
                print("FAIL: No plot image returned.")
        else:
            print(f"FAIL: Comparison endpoint failed. {r.text}")
            
    except Exception as e:
        print(f"FAIL: Comparison error: {e}")

if __name__ == "__main__":
    verify_phase4()
