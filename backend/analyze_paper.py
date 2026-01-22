from pydantic import BaseModel
from pypdf import PdfReader
import sys

# Read the file
reader = PdfReader("backend/data/pdfs/BatteryGPT.pdf")
text = ""
# Read first 3 pages (Abstract, Intro, Methodology usually here)
for i in range(min(5, len(reader.pages))):
    text += reader.pages[i].extract_text() + "\n"

print("--- PAPER CONTENT START ---")
print(text[:5000]) # First 5k chars should be enough for planning
print("--- PAPER CONTENT END ---")
