
import sys
import os
sys.path.append(os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'backend'))

from services.database_service import database_service

def verify_db():
    print("1. Initializing DB...")
    # Should happen automatically on import, but we can check if file exists
    if os.path.exists("battery_forge.db"):
        print("PASS: DB file exists.")
    else:
        print("FAIL: DB file not found.")
        
    print("\n2. Saving Record...")
    pk = database_service.save_record(
        filename="test_dataset_001.csv",
        dataset_type="Cycling",
        metrics={"capacity_ah": 2.5, "energy_wh": 9.2},
        summary="Test summary.",
        plot_data="base64string..."
    )
    print(f"Record Saved with ID: {pk}")
    
    print("\n3. Retrieving History...")
    history = database_service.get_history(limit=5)
    if len(history) > 0:
        latest = history[0]
        print(f"Latest Record: {latest['filename']} | {latest['dataset_type']}")
        if latest['filename'] == "test_dataset_001.csv" and latest['metrics']['capacity_ah'] == 2.5:
             print("PASS: Data integrity confirmed.")
        else:
             print("FAIL: Data mismatch.")
    else:
        print("FAIL: No history returned.")

if __name__ == "__main__":
    verify_db()
