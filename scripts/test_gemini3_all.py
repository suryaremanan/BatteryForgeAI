import google.generativeai as genai
import os
from dotenv import load_dotenv

load_dotenv('backend/.env')
key = os.getenv("GEMINI_API_KEY")
if not key:
    print("[ERROR] Could not load GEMINI_API_KEY from backend/.env")
else:
    print(f"[INFO] Loaded API Key: {key[:5]}...")
genai.configure(api_key=key)

# Candidates found in models_log.txt
candidates = [
    'models/gemini-3-flash-preview',
    'models/gemini-3-pro-preview',
    'models/gemini-3-pro-image-preview',
    'models/gemini-exp-1206', # Often a newer preview
    'models/gemini-2.0-flash-exp' # Fallback check
]

print("Testing Gemini 3 Candidates...\n")

with open("gemini3_test_results.txt", "w") as f:
    for model_name in candidates:
        print(f"Testing {model_name}...")
        try:
            model = genai.GenerativeModel(model_name)
            response = model.generate_content("Ping")
            result = f"[SUCCESS] {model_name}: {response.text.strip()}"
            print(result)
            f.write(result + "\n")
        except Exception as e:
            result = f"[FAILED] {model_name}: {e}"
            print(result)
            f.write(result + "\n")
