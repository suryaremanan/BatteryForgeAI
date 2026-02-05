# BatteryForge AI - Technical Documentation

**Multi-Agent Battery Intelligence Platform** powered by Google Gemini 3 & ADK

## Overview

BatteryForge AI is an advanced agentic AI system for battery manufacturing defect detection, physics-based optimization, and fleet management. Built with Google's Agent Development Kit (ADK) for seamless multi-agent orchestration.

---

## Architecture

```
+----------------------------------------------------------+
|                  React Frontend (Vite)                    |
|  +----------+----------+----------+----------+----------+ |
|  |  Visual  | Charging |  Fleet   |   Log    |   Chat   | |
|  |   Scout  | Analysis |  Monitor | Analysis |    AI    | |
|  +----------+----------+----------+----------+----------+ |
+-----------------------------+----------------------------+
                              | FastAPI REST + WebSocket
+-----------------------------+----------------------------+
|              Python Backend (FastAPI)                     |
|  +------------------------------------------------------+ |
|  |          ADK Multi-Agent System (Runner)             | |
|  |  +----------+----------+----------+---------------+  | |
|  |  |Commander | Defect   | Charging |    Fleet      |  | |
|  |  |  Agent   | Agent    |  Agent   |    Agent      |  | |
|  |  +----------+----------+----------+---------------+  | |
|  |  +----------+--------------------------------+       | |
|  |  |  Safety  |  Predictive Maintenance Agent |       | |
|  |  +----------+--------------------------------+       | |
|  +------------------------------------------------------+ |
|  +------------------------------------------------------+ |
|  |               20+ Specialized Tools                  | |
|  |  Vision - PyBaMM - EIS - Fleet - Reporting - RAG    | |
|  +------------------------------------------------------+ |
|  +----------+----------+-------------------------------+ |
|  |  SQLite  | ChromaDB |     PyBaMM Physics Engine     | |
|  +----------+----------+-------------------------------+ |
+----------------------------------------------------------+
```

---

## Agent System

BatteryForge AI uses 6 specialized AI agents working in harmony:

| Agent | Role | Capabilities |
|-------|------|--------------|
| **BatteryForge Commander** | Strategic Orchestrator | Routes requests, coordinates workflows, ensures safety protocols |
| **Defect Analysis Agent** | Visual Inspection Expert | Real-time defect detection, thermal inspection, BMS visual QA |
| **Charging Optimization Agent** | Electrochemistry Specialist | EIS analysis, PyBaMM physics simulation, capacity fade prediction |
| **Fleet Commander Agent** | Strategic Planner | Fleet monitoring, scenario simulation, risk assessment |
| **Safety Guardian Agent** | Emergency Response | HITL emergency shutdown, thermal event detection, safety protocols |
| **Predictive Maintenance Agent** | Lifecycle Expert | RUL prediction, aging analysis, maintenance scheduling |

---

## Key Features

### 1. Multi-Agent Orchestration (ADK)

- **Autonomous delegation** - Commander intelligently routes tasks to specialist agents
- **Real-time trace visualization** - See agent transfers and tool calls in action
- **Context & Memory** - Agents maintain long-term conversation history
- **Marathon workflows** - Long-running tasks (pack audits, continuous monitoring)

### 2. Visual Intelligence

- **Real-time analysis** - Webcam, screen share, or YouTube video defect detection
- **"Detect-Locate-Describe"** methodology for precise classification
- **Multi-modal support** - Images, videos, live streams, thermal cameras
- **Battery inspection** - Tab welding defects, swelling, corrosion, thermal runaway detection

### 3. Physics-Based Simulation

- **PyBaMM integration** - Doyle-Fuller-Newman (DFN) physics modeling
- **Universal CSV parser** - AI-powered semantic column mapping for any format
- **Interactive visualization** - Multi-plot charts with voltage, current, temperature
- **EIS analysis** - Layer-by-layer impedance diagnosis (Ohmic, Kinetics, Diffusion)
- **Safety scoring** - Computed from voltage stability and thermal deviation

### 4. Fleet Management

- **Unified Dashboard** - Real-time tracking of vehicles, drivers, and charging stations
- **Scenario Simulation** - Heat waves, cold snaps, fast charging stress tests
- **Strategic Insights** - Thermal spread analytics, risk assessment, tactical commands
- **Smart Settings** - Configurable thresholds, notifications, and units
- **AI Command Center** - Natural language commands for fleet operations
- **Map View** - Geographic asset tracking powered by Leaflet

### 5. Log Analysis

- **Semantic parsing** - AI-powered BMS error log interpretation
- **Pattern recognition** - Identifies recurring issues and failure modes
- **Diagnostic recommendations** - Actionable insights from log data

### 6. RAG Knowledge Assistant

- **ChromaDB vector store** - Semantic search across technical documentation
- **Gemini embeddings** - Context-aware retrieval
- **Chat integration** - Automatic knowledge injection
- **PDF ingestion** - Parse battery safety standards, manuals, and datasheets
- **Technical Q&A** - Answer questions based on uploaded documentation

---

## Workspaces

| Workspace | Description |
|-----------|-------------|
| **Home** | Dashboard with live fleet stats, system status, and quick navigation |
| **Visual Intelligence** | AI defect detection and live video analysis |
| **Simulation Lab** | Charging curve analysis with PyBaMM physics models |
| **Fleet Monitor** | Real-time EV fleet telemetry and management |
| **Log Analysis** | Semantic BMS error log parsing |

---

## Technology Stack

### AI & Machine Learning
- **Google Gemini 3 Flash Preview** - Multi-agent orchestration & tool calling
- **Google ADK** - Agent Development Kit for workflow coordination
- **Gemini Vision** - Multimodal defect detection
- **ChromaDB** - Vector database for RAG
- **Gemini Embeddings** - Semantic search

### Physics & Simulation
- **PyBaMM** - Python Battery Mathematical Modeling (DFN solver)
- **NumPy** - Numerical computing
- **Pandas** - Data analysis
- **SciPy** - Scientific computing

### Backend
- **FastAPI** - High-performance API framework
- **Uvicorn** - ASGI server
- **Pydantic** - Data validation
- **SQLite** - Analysis history
- **AsyncIO** - Asynchronous programming

### Frontend
- **React 18** - UI framework
- **Vite** - Lightning-fast build tool
- **Recharts** - Scientific data visualization
- **Leaflet** - Lightweight mapping
- **Framer Motion** - Smooth animations
- **React Player** - Video playback
- **Tailwind CSS** - Utility-first styling

### Deployment
- **Docker** - Containerization for consistent deployment
- **Docker Compose** - Multi-container orchestration
- **Nginx** - Production web server and reverse proxy

---

## API Endpoints

### Agent System
- `GET /api/agent/status` - Check ADK agent availability
- `POST /api/chat/send` - Multi-agent chat interface
- `POST /api/agent/workflow` - Trigger marathon workflows
- `GET /api/agent/session/{id}` - Get session state
- `WS /api/ws/agent` - Real-time agent streaming

### Analysis
- `POST /api/analyze/defect` - Visual defect detection
- `POST /api/analyze/charging` - Charging curve analysis
- `POST /api/analyze/log` - Fault log parsing
- `POST /api/analyze/aging` - Battery aging prediction
- `POST /api/analyze/comparison` - Multi-file comparison

### Fleet
- `GET /api/fleet/data` - Real-time fleet status
- `POST /api/fleet/simulate` - Run scenario simulation

### Knowledge
- `POST /api/rag/query` - RAG knowledge base search

---

## Agent Tools

All agents have access to specialized tools:

- **Vision**: `analyze_battery_image`, `analyze_video_stream`
- **Simulation**: `run_pybamm_simulation`, `simulate_fleet_scenario`, `predict_aging_trajectory`
- **Data**: `parse_charging_data`, `analyze_eis_spectrum`, `search_knowledge_base`
- **Fleet**: `get_fleet_status`, `control_charging_rate`, `send_operator_alert`
- **Safety**: `initiate_emergency_shutdown` (HITL confirmation required)

---

## Scientific Background

### Defect Detection Methodology

Follows **"Detect-Locate-Describe"** framework:
1. **Detect** - Identify anomaly presence (swelling, corrosion, thermal runaway)
2. **Locate** - Pinpoint physical region (tab, body, terminal)
3. **Describe** - Technical electrochemical assessment
4. **Recommend** - Immediate mitigation action

### Physics-Based Simulation

Uses **Doyle-Fuller-Newman (DFN)** model - the gold standard for lithium-ion simulation:
- Accounts for solid-state diffusion, electrolyte transport, and electrochemical reactions
- Predicts voltage, current, temperature with high accuracy
- Validates experimental data against first-principles physics

### EIS Analysis Layers

Multi-layer impedance diagnosis per IEST standards:
1. **High Frequency (>1kHz)** - Ohmic resistance (contact, cable, electrolyte)
2. **Mid Frequency (1Hz-1kHz)** - Charge transfer (R_ct), SEI layer
3. **Low Frequency (<1Hz)** - Diffusion (Warburg impedance)

---

## Quick Start

### Docker Deployment (Recommended)

```bash
# Clone and navigate
git clone <repo-url>
cd BatteryForgeAI

# Configure API key
cp .env.example .env
# Edit .env and add: GEMINI_API_KEY=your_key_here

# Launch
docker compose up --build -d
```

### Access Points

| Service | URL |
|---------|-----|
| Frontend | http://localhost |
| Backend API | http://localhost:8000 |
| API Docs | http://localhost:8000/docs |

### Manual Setup

**Backend:**
```bash
cd backend
python -m venv venv
source venv/bin/activate  # or .\venv\Scripts\activate on Windows
pip install -r requirements.txt
cp .env.example .env
uvicorn main:app --reload
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

---

## Use Cases

### Manufacturing QA
- Automated visual inspection at production line speeds
- Batch quality trending and analytics
- Compliance certification generation

### Battery R&D
- Charging curve optimization using physics models
- Aging mechanism identification from EIS data
- Material comparison via multi-file analysis

### Fleet Operations
- Predictive maintenance scheduling
- Thermal event monitoring with live alerts
- Strategic planning via scenario simulation
- Emergency response with HITL safety controls

### Research & Education
- Interactive battery physics visualization
- AI-powered technical Q&A with citations
- Agent reasoning transparency via trace logs

---

## License

Built for the **Google Gemini 3 Hackathon**.

Powered by Google Gemini 3 & ADK
