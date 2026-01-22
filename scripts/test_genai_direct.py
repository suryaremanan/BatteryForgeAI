import google.generativeai as genai
import os
from dotenv import load_dotenv

load_dotenv()
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

model_name = 'models/gemini-3-flash-preview'
print(f"Testing model: {model_name}")

except Exception as e:
    print(f"Error: {e}")

with open("test_out.txt", "w") as f:
    f.write(f"Testing model: {model_name}\n")
    try:
        model = genai.GenerativeModel(model_name)
        response = model.generate_content("Hello, can you hear me?")
        f.write(f"Response: {response.text}\n")
    except Exception as e:
        f.write(f"Error: {e}\n")
