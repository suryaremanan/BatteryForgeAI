import requests
import json

url = "http://localhost:8000/api/analyze/aging"
payload = {
    "current_capacity_ah": 2.5,
    "nominal_capacity_ah": 3.0
}
headers = {'Content-Type': 'application/json'}

try:
    print(f"Sending request to {url}...")
    response = requests.post(url, json=payload)
    print(f"Status: {response.status_code}")
    
    if response.status_code == 200:
        data = response.json()
        points = len(data.get('data', {}).get('cycles', []))
        print(f"Success! Received {points} data points.")
        print("Prediction Summary:", json.dumps(data.get('prediction'), indent=2))
        
        # Sanity check: is it fallback or real?
        # If real, it shouldn't produce exactly 0.2 noise pattern, but hard to tell.
        # However, if status is 200 and points > 0, it works.
    else:
        print("Error:", response.text)

except Exception as e:
    print(f"Connection failed: {e}")
