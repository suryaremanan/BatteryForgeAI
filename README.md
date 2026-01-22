# BatteryForge AI

**Gemini 3 Hackathon Entry**

BatteryForge AI is an advanced agentic coding system for battery manufacturing defect detection, troubleshooting, and aging prediction.

## Key Features

### 1. Defect Detection ("BatteryGPT")
- **Methodology**: Follows "Detect-Locate-Describe" paper.
- **Model**: Gemini Robotics-ER 1.5 Preview.
- **Output**: Defect type, severity, physical location, and mitigation.

### 2. Synthetic Data Engine
- **Innovation**: Generates photorealistic defect samples (simulating Poisson Image Editing) to solve data scarcity.
- **Endpoint**: `/api/generate/synthetic`

### 3. RAG Knowledge Assistant
- **Engine**: ChromaDB (Vector Store) + Gemini Text Embeddings 004.
- **Data**: Ingests PDF manuals (`backend/data/pdfs`) and JSON protocols.
- **Usage**: Ask technical questions in the integrated Chatbot.

### 4. Multimodal Chat
- **Interface**: Chat with the "AI Technician" using text and images.
- **Context**: Automatically pulls relevant RAG docs into the conversation.

### 5. Advanced Simulations
- **Charging Analysis**: Detects electrochemical anomalies (like Li-Plating) from voltage curves using Vision.
- **Predictive Aging**: Estimates RUL (Remaining Useful Life) and detects degradation "Knee Points".

## Setup

### Frontend
1. Navigate to `/frontend` (Ensure Node.js is installed)
2. Run `npm install`
3. Run `npm run dev`

### Backend
1. Navigate to `/backend`
2. Create a python virtual environment: `python -m venv venv`
3. Activate it: `.\venv\Scripts\activate`
4. Install dependencies: `pip install -r requirements.txt`
5. Rename `.env.example` to `.env` and add your Gemini API Key.
6. Run server: `uvicorn main:app --reload`
