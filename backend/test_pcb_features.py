import asyncio
import os
import sys
import base64
import json

# Ensure backend directory is in path
sys.path.append(os.path.join(os.getcwd(), 'backend'))

from services.gemini_service import gemini_service

async def test_phase2_features():
    print("🚀 Starting Gemini 3 PHASE 2 Verification...\n")
    
    # Valid 1x1 JPEG for Vision Tests
    valid_jpeg = base64.b64decode("/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=")

    # 1. Automated Design
    print("🔹 Testing Feature 1a: Schematic Generator (Gemini 3 Pro)...")
    try:
        res = await gemini_service.generate_pcb_design_critique("BMS for 4S LiPo with USB-C PD input and I2C comms.")
        print(f"   ✅ Schematic Plan: {str(res)[:100]}...")
    except Exception as e: print(f"   ❌ Error: {e}")
    
    print("🔹 Testing Feature 1b: RL Routing Agent (Gemini 3 Pro)...")
    try:
        grid = {"grid_size": [5,5], "start": [0,0], "target": [4,4], "obstacles": [[2,2]]}
        res = await gemini_service.explore_design_space(grid)
        print(f"   ✅ RL Move: {str(res)[:100]}...")
    except Exception as e: print(f"   ❌ Error: {e}")

    # 2. Quality Control
    print("\n🔹 Testing Feature 2a: Advanced Defect Classification (Gemini 3 Pro)...")
    try:
        res = await gemini_service.analyze_production_defect(valid_jpeg)
        print(f"   ✅ Defect Result: {str(res)[:100]}...")
    except Exception as e: print(f"   ❌ Error: {e}")

    print("🔹 Testing Feature 2b: X-Ray Analysis (Gemini 3 Pro)...")
    try:
        res = await gemini_service.analyze_xray_inspection(valid_jpeg)
        print(f"   ✅ X-Ray Result: {str(res)[:100]}...")
    except Exception as e: print(f"   ❌ Error: {e}")

    # 3. Predictive Maintenance
    print("\n🔹 Testing Feature 3a: Maintenance FFT Analysis (Gemini 3 Flash)...")
    try:
        payload = { "machine_id": "Drill-01", "fft_peaks": [{"freq": 1200, "amp": 0.8}], "rms_vibration": 1.5 }
        res = await gemini_service.analyze_maintenance_signals(payload)
        print(f"   ✅ Maint Result: {str(res)[:100]}...")
    except Exception as e: print(f"   ❌ Error: {e}")

    print("🔹 Testing Feature 3b: Tool Life Prediction (Gemini 3 Flash)...")
    try:
        logs = { "hits": 8000, "resin_smear_level": "high", "feed_rate_deviation": 0.12 }
        res = await gemini_service.predict_tool_life(logs)
        print(f"   ✅ Tool Life Result: {str(res)[:100]}...")
    except Exception as e: print(f"   ❌ Error: {e}")

    # 4. Supply Chain
    print("\n🔹 Testing Feature 4: Supply Chain Risk (Gemini 3 Pro)...")
    try:
        bom = [{"part": "STM32F4", "origin": "Taiwan"}, {"part": "Resistor", "origin": "Generic"}]
        res = await gemini_service.monitor_supply_risk(bom)
        print(f"   ✅ Risk Result: {str(res)[:100]}...")
    except Exception as e: print(f"   ❌ Error: {e}")

    # 5. Process Control
    print("\n🔹 Testing Feature 5: Adaptive Process Control (Gemini 3 Flash)...")
    try:
        sensor = { "process": "Etching", "ph_level": 3.0, "copper_thickness_removed": 14, "target": 18 }
        res = await gemini_service.analyze_process_control_loop(sensor)
        print(f"   ✅ Process Loop: {str(res)[:100]}...")
    except Exception as e: print(f"   ❌ Error: {e}")

    print("\n🎉 PHASE 2 Verification Complete!")

if __name__ == "__main__":
    asyncio.run(test_phase2_features())
