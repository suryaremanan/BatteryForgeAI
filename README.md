# 🔋 BatteryForge AI

**Multi-Agent Battery Intelligence Platform** powered by Google Gemini 3 & ADK

An advanced agentic AI system for battery manufacturing defect detection, physics-based optimization, and fleet management. Built with Google's Agent Development Kit (ADK) for seamless multi-agent orchestration.

[![Gemini 3](https://img.shields.io/badge/Gemini-3.0-blue?style=for-the-badge&logo=google)](https://deepmind.google/technologies/gemini/)
[![ADK](https://img.shields.io/badge/Google-ADK-orange?style=for-the-badge)](https://ai.google.dev/adk)
[![PyBaMM](https://img.shields.io/badge/PyBaMM-Physics-green?style=for-the-badge)](https://www.pybamm.org/)

---

## 🎯 Overview

BatteryForge AI revolutionizes battery quality control and fleet management through **5 specialized AI agents** working in harmony:

| Agent | Role | Capabilities |
|-------|------|-------------|
| **🎖️ BatteryForge Commander** | Strategic Orchestrator | Routes requests, coordinates workflows, ensures safety protocols |
| **👁️ Defect Analysis Agent** | Visual Inspection Expert | Real-time defect detection, PCB/BMS inspection, thermal runaway monitoring |
| **⚡ Charging Optimization Agent** | Electrochemistry Specialist | EIS analysis, PyBaMM physics simulation, capacity fade prediction |
| **🚀 Fleet Commander Agent** | Strategic Planner | Fleet monitoring, scenario simulation, risk assessment |
| **🛡️ Safety Guardian Agent** | Emergency Response | HITL emergency shutdown, thermal event detection, safety protocols |
| **🔧 Predictive Maintenance Agent** | Lifecycle Expert | RUL prediction, aging analysis, maintenance scheduling |

---

## ✨ Key Features

### 🤖 Multi-Agent Orchestration (ADK)
- **Autonomous delegation** - Commander intelligently routes tasks to specialist agents
- **Real-time trace visualization** - See agent transfers and tool calls in action
- **Context-aware responses** - Agents share workspace state and session history
- **Marathon workflows** - Long-running tasks (pack audits, continuous monitoring)

### 👁️ Visual Intelligence
- **Real-time analysis** - Webcam, screen share, or YouTube video defect detection
- **"Detect-Locate-Describe"** methodology for precise classification
- **Multi-modal support** - Images, videos, live streams, thermal cameras
- **PCB inspection** - Open circuits, shorts, solder mask defects via Gemini Vision

### ⚡ Physics-Based Simulation
- **PyBaMM integration** - Doyle-Fuller-Newman (DFN) physics modeling
- **Universal CSV parser** - AI-powered semantic column mapping for any format
- **Interactive visualization** - Multi-plot Recharts with voltage, current, temperature
- **EIS analysis** - Layer-by-layer impedance diagnosis (Ohmic, Kinetics, Diffusion)

### 🚀 Fleet Management
- **100+ pack monitoring** - Real-time health, temperature, and SOH tracking
- **Scenario simulation** - Heat waves, cold snaps, fast charging stress tests
- **Strategic insights** - Thermal spread analytics, risk assessment, tactical commands
- **Pack drill-down** - Individual battery maintenance recommendations

### 🏭 PCB Manufacturing
- **Gerber file analysis** - Automated CAM validation
- **Adaptive process control** - Etching optimization, lamination scaling
- **Quality assurance** - Automated compliance certificate generation
- **Flight bar optimization** - Plating uniformity prediction

### 🧠 RAG Knowledge Assistant
- **ChromaDB vector store** - Semantic search across technical documentation
- **Gemini embeddings** - Context-aware retrieval
- **Chat integration** - Ask questions with automatic knowledge injection
- **PDF ingestion** - Battery safety standards, manuals, protocols

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                  React Frontend (Vite)                  │
│  ┌──────────┬──────────┬──────────┬─────────┬────────┐ │
│  │  Visual  │ Charging │  Fleet   │   PCB   │  Chat  │ │
│  │   Scout  │ Analysis │  Monitor │  Mfg.   │   AI   │ │
│  └──────────┴──────────┴──────────┴─────────┴────────┘ │
└──────────────────────┬──────────────────────────────────┘
                       │ FastAPI REST + WebSocket
┌──────────────────────┴──────────────────────────────────┐
│              Python Backend (FastAPI)                    │
│  ┌────────────────────────────────────────────────────┐ │
│  │     ADK Multi-Agent System (Runner)                │ │
│  │  ┌──────────┬──────────┬──────────┬─────────────┐ │ │
│  │  │Commander │  Defect  │ Charging │   Fleet     │ │ │
│  │  │  Agent   │  Agent   │  Agent   │   Agent     │ │ │
│  │  └──────────┴──────────┴──────────┴─────────────┘ │ │
│  │  ┌──────────┬──────────────────────────────────┐  │ │
│  │  │  Safety  │  Predictive Maintenance Agent   │  │ │
│  │  └──────────┴──────────────────────────────────┘  │ │
│  └────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────┐ │
│  │              20+ Specialized Tools                 │ │
│  │  Vision • PyBaMM • EIS • Fleet • Reporting • RAG  │ │
│  └────────────────────────────────────────────────────┘ │
│  ┌──────────┬──────────┬─────────────────────────────┐ │
│  │  SQLite  │ ChromaDB │  PyBaMM Physics Engine      │ │
│  └──────────┴──────────┴─────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

---

## 🚀 Quick Start

### Prerequisites
- **Python 3.11+** (3.13 recommended)
- **Node.js 18+**
- **Gemini API Key** ([Get one here](https://aistudio.google.com/))

### Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate (Windows)
.\venv\Scripts\activate

# Activate (macOS/Linux)
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env and add your GEMINI_API_KEY

# Run server
uvicorn main:app --reload
```

Backend will be available at `http://localhost:8000`

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Run development server
npm run dev
```

Frontend will be available at `http://localhost:5173`

---

## 📖 Usage Guide

### 1. Visual Defect Detection

**Upload Mode:**
1. Navigate to **Visual Intelligence** tab
2. Upload battery/PCB image or video
3. Click **Analyze** to detect defects
4. Review classification, severity, and mitigation

**Live Scout Mode:**
1. Go to **Visual Intelligence** → **Live Scout**
2. Select input source (Webcam, Upload, YouTube URL)
3. Click **Start Scout AI** for real-time analysis
4. Monitor live defect logs with timestamps

### 2. Charging Analysis

**Standard Workflow:**
1. Go to **Charging Analysis** tab
2. Upload CSV file (any format - Arbin, BioLogic, Tesla, etc.)
3. System auto-detects columns using AI semantic mapping
4. View interactive plots with voltage, current, temperature
5. Get PyBaMM physics comparison and safety score

**EIS Analysis:**
1. Upload EIS data (frequency, real/imaginary impedance)
2. View Nyquist plot with layer-by-layer diagnosis
3. Get ohmic, kinetics, and diffusion health assessment

### 3. Fleet Monitoring

1. Navigate to **Fleet Monitor**
2. View 100+ battery pack real-time status
3. Run scenario simulations (heat wave, cold snap, fast charging)
4. Review strategic insights and thermal spread analytics
5. Drill down to individual pack maintenance

### 4. AI Chat Assistant

1. Open **Chat Interface**
2. Ask questions or give commands:
   - "Analyze this battery image for defects"
   - "Simulate a heat wave on the fleet"
   - "What is lithium plating?"
   - "Run a full pack audit"
3. Watch agent trace to see specialist collaboration
4. Navigate automatically with `[VIEW: VISUAL]` commands

### 5. PCB Manufacturing

1. Go to **PCB Manufacturing** tab
2. Upload Gerber file for CAM validation
3. Get adaptive etching control recommendations
4. Run lamination scaling predictions
5. Generate compliance certificates

---

## 🛠️ Technology Stack

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
- **Framer Motion** - Smooth animations
- **React Player** - Video playback
- **Tailwind CSS** - Utility-first styling

---

## 📊 API Endpoints

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
- `POST /api/fleet/material-selection` - Material optimization
- `POST /api/fleet/drill-check` - Drill wear analysis

### PCB Manufacturing
- `POST /api/gerber/analyze` - Gerber file validation
- `POST /api/process/etching-control` - Etching optimization
- `POST /api/process/lamination-scaling` - Lamination prediction
- `POST /api/process/plating-optimization` - Plating uniformity

### Knowledge
- `POST /api/rag/query` - RAG knowledge base search

---

## 🎓 Advanced Features

### Marathon Agents (Long-Running Workflows)

**Pack Audit Workflow:**
```python
POST /api/agent/workflow
{
  "workflow_name": "pack_audit",
  "session_id": "audit_session_1",
  "parameters": {
    "pack_id": "PACK-001",
    "depth": "comprehensive"
  }
}
```

**Continuous Monitor Workflow:**
```python
POST /api/agent/workflow
{
  "workflow_name": "continuous_monitor",
  "session_id": "monitor_session_1",
  "parameters": {
    "interval_seconds": 30,
    "alert_threshold": "critical"
  }
}
```

### Custom Agent Tools

All agents have access to 20+ specialized tools:
- **Vision**: `analyze_battery_image`, `analyze_pcb_image`, `analyze_video_stream`
- **Simulation**: `run_pybamm_simulation`, `simulate_fleet_scenario`, `predict_aging_trajectory`
- **Data**: `parse_charging_data`, `analyze_eis_spectrum`, `search_knowledge_base`
- **Fleet**: `get_fleet_status`, `control_charging_rate`, `send_operator_alert`
- **Safety**: `initiate_emergency_shutdown` (HITL confirmation required)

---

## 🔬 Scientific Background

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

## 🎯 Use Cases

### Manufacturing QA
- **Automated visual inspection** at production line speeds
- **PCB defect detection** before assembly
- **Compliance certification** generation
- **Batch quality trending** and analytics

### Battery R&D
- **Charging curve optimization** using physics models
- **Aging mechanism identification** from EIS data
- **Material comparison** via multi-file analysis
- **Protocol validation** against knowledge base

### Fleet Operations
- **Predictive maintenance** scheduling
- **Thermal event monitoring** with live alerts
- **Strategic planning** via scenario simulation
- **Emergency response** with HITL safety controls

### Research & Education
- **Interactive battery physics** visualization
- **AI-powered technical Q&A** with citations
- **Multimodal analysis** demonstrations
- **Agent reasoning transparency** via trace logs

---

## 🤝 Contributing

We welcome contributions! Areas of interest:
- **New specialist agents** (compliance, supply chain, thermal management)
- **Extended tool library** (acoustic analysis, X-ray/CT integration)
- **Custom PyBaMM models** (degradation mechanisms, parameter fitting)
- **Hardware integrations** (BMS live telemetry, thermal cameras)

---

## 📝 License

This project is built for the **Google Gemini 3 Hackathon**. 

⚡ **Powered by Google Gemini 3 & ADK** ⚡

---

## 🙏 Acknowledgments

- **Google Gemini Team** - For the incredible Gemini 3 and ADK framework
- **PyBaMM Community** - For open-source battery modeling tools
- **ChromaDB Team** - For vector database infrastructure
- **React Ecosystem** - For amazing frontend libraries

---

## 📧 Contact & Support

Have questions or want to collaborate?
- **GitHub Issues** - Bug reports and feature requests
- **Discussions** - Technical Q&A and ideas
- **Email** - For partnership inquiries

---

**Built with ❤️ for safer, smarter batteries**
