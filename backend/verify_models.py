import google.generativeai as genai
import os
from dotenv import load_dotenv

load_dotenv()

api_key = os.getenv("GEMINI_API_KEY")
if not api_key:
    print("Error: GEMINI_API_KEY not found in .env")
    exit(1)

genai.configure(api_key=api_key)

print("Listing available models...")

with open("models_log.txt", "w") as f:
    try:
        models = [m.name for m in genai.list_models()]
        
        required_models = [
            "gemini-3-pro",
            "gemini-3-flash"
        ]
        
        print("Available Models:")
        for m in models:
            f.write(f"{m}\n")
            print(f"- {m}")
            
        print("\nVerifying Requirement Compliance:")
        for req in required_models:
            # Flexible matching for preview/exp versions
            match = next((m for m in models if req in m or req.replace("-", ".") in m), None)
            if match:
                msg = f"✅ {req} FOUND as {match}"
            else:
                msg = f"⚠️ {req} NOT FOUND (Ensure you have access or use aliases)"
            print(msg)
            f.write(msg + "\n")

    except Exception as e:
        msg = f"Error listing models: {e}"
        print(msg)
        f.write(msg)
