import google.generativeai as genai
import os
from dotenv import load_dotenv
from pathlib import Path

load_dotenv()
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

# Use a model that supports PDF/Multimodal
# trying the one we verified exists, or standard pro
model_name = 'models/gemini-1.5-pro' 
# If not available, we try the one from service
if not model_name:
     model_name = 'models/gemini-robotics-er-1.5-preview'

model = genai.GenerativeModel(model_name)

pdf_path = Path("backend/data/pdfs/BatteryGPT.pdf")

if not pdf_path.exists():
    print("PDF not found")
    exit()

print(f"Analyzing {pdf_path} with {model_name}...")

try:
    with open(pdf_path, "rb") as f:
        pdf_data = f.read()

    prompt = """
    You are an expert Battery Researcher.
    Analyze this research paper "BatteryGPT".
    
    1. What is the core innovation?
    2. List typically 3-4 key features or algorithms proposed (e.g. Transformer for SOH, RUL prediction).
    3. How can we implement a simplified version of this in a Python backend?
    
    Output valid JSON:
    {
      "core_innovation": "...",
      "features": ["feature1", "feature2"],
      "implementation_guide": "..."
    }
    """

    response = model.generate_content([
        prompt,
        {"mime_type": "application/pdf", "data": pdf_data}
    ])

    print(response.text)

except Exception as e:
    print(f"Error: {e}")
