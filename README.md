# 🔋 BatteryForge AI

**Multi-Agent Battery Intelligence Platform** powered by Google Gemini 3 & ADK

An advanced agentic AI system for battery manufacturing defect detection, physics-based optimization, and fleet management. Built with Google's Agent Development Kit (ADK) for seamless multi-agent orchestration.

---

## 🎬 HACKATHON DEMO SCRIPT (2:30)

> **For Judges:** This is a scripted walkthrough demonstrating BatteryForge AI's capabilities. Time markers help pace the presentation.

---

### **[0:00-0:15] THE HOOK - The Problem**

*"Every year, battery failures cause $2 billion in recalls, factory fires, and EV incidents. The problem? Humans can't monitor thousands of battery cells in real-time. But what if AI could?"*

*"This is BatteryForge AI — a multi-agent system where 7 specialized AI agents powered by Gemini 3 work together to prevent the next battery disaster."*

**[Show: Home dashboard with BatteryForge logo]**

---

### **[0:15-0:45] DEMO 1: Agentic Fleet Commander**

*"Let me show you what 'agentic AI' really means."*

**[Navigate to Fleet Monitor → Telemetry tab]**

*"This is our live fleet — 1,240 battery packs across vehicles worldwide. Watch the AI Commander panel on the right — it's already analyzing thermal spread and identifying outliers."*

**[Point to the red list and critical packs]**

*"See these critical packs? The agent detected them automatically. Now watch what happens when I trigger a heat wave scenario..."*

**[Click "Heat Wave" stress test button]**

*"The physics engine just simulated 40°C ambient temperature. Look — the AI Commander instantly recalculated risk levels, and... there — it's flagging thermal runaway risk on Pack BAT-3847."*

**[Open Chat Interface - show "FLEET AWARE" badge]**

*"Here's the magic. I can just ask: 'What should we do about the critical packs?'"*

**[Type: "Show me critical packs and recommend actions"]**

*"Watch the agent trace panel — see how FleetCommanderAgent receives the request, queries the fleet, and returns actionable intelligence with confirmation buttons. This isn't just chat — it's bidirectional control."*

---

### **[0:45-1:15] DEMO 2: Real-Time Visual Intelligence**

*"Now let's catch defects before they ship."*

**[Navigate to Visual Intelligence tab]**

*"I'll upload a battery cell image from our production line."*

**[Upload a battery defect image]**

*"Gemini Vision analyzes this using our 'Detect-Locate-Describe' methodology..."*

**[Results appear]**

*"Detected: Tab welding defect. Location: Positive terminal. Severity: Critical. And look — it's already recommending 'Reject unit, inspect upstream welder' — that's institutional knowledge from our RAG system, trained on 50+ battery safety manuals."*

**[Switch to Live Scout tab if time permits]**

*"This also works in real-time on video streams — imagine this on every manufacturing line, catching defects at camera speed."*

---

### **[1:15-1:45] DEMO 3: Physics-Based Digital Twin**

*"But detection isn't enough. We need to predict failures before they happen."*

**[Navigate to Simulation tab]**

*"I'll upload real charging data from a degraded cell."*

**[Upload a CSV file]**

*"Watch — the AI automatically maps columns regardless of format. Arbin, BioLogic, Tesla — it handles them all using semantic understanding."*

**[Show the interactive chart with PyBaMM comparison]**

*"Here's the breakthrough: This orange line is a physics-based simulation from PyBaMM — the Doyle-Fuller-Newman model running in real-time. The blue line is our actual data."*

*"See where they diverge? That's the digital twin catching anomalies. And this Safety Score — 73 — it's computed from voltage stability and thermal deviation, not guessed by AI."*

**[Point to the EIS Nyquist plot if available]**

*"We even do impedance spectroscopy analysis — layer by layer diagnostics of the cell's electrochemistry."*

---

### **[1:45-2:10] DEMO 4: Multi-Agent Orchestration**

*"All of this is powered by 7 specialized agents working together."*

**[Open Chat Interface and Agent Trace Panel]**

*"Let me demonstrate. I'll ask: 'Analyze the uploaded data and predict remaining useful life.'"*

**[Type the message]**

*"Watch the trace panel: BatteryForgeCommander receives it, routes to ChargingOptimizationAgent for the data, then to PredictiveMaintenanceAgent for RUL... and look — it's calling tools: parse_charging_data, run_pybamm_simulation, predict_aging_trajectory."*

*"This isn't one model — it's a team of specialists, each with their own tools, coordinating like a real engineering team."*

---

### **[2:10-2:25] DEMO 5: Safety-Critical Actions with Human-in-the-Loop**

*"But with great power comes great responsibility."*

**[Type in chat: "Isolate pack BAT-3847 due to thermal runaway risk"]**

*"Watch — it's not executing immediately. Critical actions require human confirmation."*

**[Show the Approve/Reject buttons]**

*"One click isolates the pack, disconnects charging, and creates a work order — but only with explicit approval. This is agentic AI with guardrails."*

**[Click Approve]**

*"✅ Done. Pack isolated, maintenance notified, work order WO-47829 created."*

---

### **[2:25-2:30] THE CLOSE**

*"BatteryForge AI: 7 agents, 20+ tools, physics-based simulation, real-time visual inspection, and human-in-the-loop safety — all orchestrated by Gemini 3."*

*"Because the next billion batteries deserve intelligence that never sleeps."*

**[Return to Home dashboard]**

---

### **BACKUP TALKING POINTS** (if judges ask questions)

- **"How is this different from existing solutions?"** — Most battery monitoring is reactive. We're predictive AND agentic. The AI doesn't just report — it acts, with confirmation.

- **"What's the business model?"** — SaaS for fleet operators ($X/pack/month), Enterprise for manufacturers (site license + support).

- **"What makes Gemini 3 essential?"** — Multi-modal vision, tool calling for agents, semantic understanding for CSV parsing, and low-latency for real-time use.

- **"How accurate is the physics simulation?"** — PyBaMM's DFN model is the gold standard in battery research. We're not approximating — we're computing.

- **"What's next?"** — Acoustic defect detection, thermal camera integration, and real-time BMS telemetry via CAN bus.

---

### **DEMO CHECKLIST**

Before presenting, ensure:
- [ ] Backend running (`docker compose up` or `uvicorn main:app --reload`)
- [ ] Frontend running (`npm run dev` or via Docker)
- [ ] Fleet Monitor has data (visit Telemetry tab first to trigger polling)
- [ ] Sample battery defect image ready
- [ ] Sample CSV charging data ready
- [ ] Chat interface opens smoothly

---

[![Gemini 3](https://img.shields.io/badge/Gemini-3.0-blue?style=for-the-badge&logo=google)](https://deepmind.google/technologies/gemini/)
[![ADK](https://img.shields.io/badge/Google-ADK-orange?style=for-the-badge)](https://ai.google.dev/adk)
[![PyBaMM](https://img.shields.io/badge/PyBaMM-Physics-green?style=for-the-badge)](https://www.pybamm.org/)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com/)
[![License](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)](LICENSE)

## 📋 Table of Contents

- [🎯 Overview](#-overview)
- [✨ Key Features](#-key-features)
- [🏗️ Architecture](#%EF%B8%8F-architecture)
- [🚀 Quick Start](#-quick-start) - **Start Here!**
  - [🐳 Docker Deployment](#-docker-deployment-recommended) (Recommended)
  - [💻 Manual Setup](#-manual-setup-development)
- [📖 Usage Guide](#-usage-guide)
- [🛠️ Technology Stack](#%EF%B8%8F-technology-stack)
- [📊 API Endpoints](#-api-endpoints)
- [🚀 Deployment](#-deployment)
- [🤝 Contributing](#-contributing)

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
- **Context & Memory** - Agents maintain long-term conversation history, remembering previous queries, results, and user preferences (e.g., "Show me the graph for *that* pack")
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
- **Unified Dashboard** - Real-time tracking of vehicles, drivers, and charging stations
- **Scenario Simulation** - Heat waves, cold snaps, fast charging stress tests
- **Strategic Insights** - Thermal spread analytics, risk assessment, tactical commands
- **Smart Settings** - Configurable thresholds, notifications, and units via new **Settings Panel**
- **AI Command Center** - "Add Driver", "Assign Vehicle" via natural language commands

### 🏭 PCB Manufacturing
- **Gerber file analysis** - Automated CAM validation
- **Adaptive process control** - Etching optimization, lamination scaling
- **Quality assurance** - Automated compliance certificate generation
- **Flight bar optimization** - Plating uniformity prediction

### 🧠 RAG Knowledge Assistant
- **ChromaDB vector store** - Semantic search across technical documentation
- **Gemini embeddings** - Context-aware retrieval
- **Chat integration** - Ask questions with automatic knowledge injection
- **PDF ingestion** - Parse battery safety standards, extensive manuals, and supplier datasheets
- **Technical Q&A** - "What is the max charging current for the Samsung 30Q based on the datasheet?"

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

### 🐳 Docker Deployment (Recommended)

**The fastest way to run BatteryForge AI** - containerized deployment with zero manual configuration.

#### Prerequisites
- [Docker Desktop](https://docs.docker.com/get-docker/) (includes Docker Compose)
- [Gemini API Key](https://aistudio.google.com/) (free tier available)

#### One-Command Setup

```bash
# 1. Clone and navigate
git clone <your-repo-url>
cd BatteryForgeAI

# 2. Configure API key
cp .env.example .env
nano .env  # Add: GEMINI_API_KEY=your_actual_key_here

# 3. Launch (builds and starts all services)
docker compose up --build -d
```

#### Access Your Application

| Service | URL | Description |
|---------|-----|-------------|
| 🌐 **Frontend** | http://localhost | Main web interface |
| 🔧 **Backend API** | http://localhost:8000 | FastAPI server |
| 📚 **API Docs** | http://localhost:8000/docs | Interactive Swagger UI |
| ❤️ **Health Check** | http://localhost:8000/health | Service status |

#### Common Commands

```bash
# View real-time logs
docker compose logs -f

# View specific service logs
docker compose logs -f backend
docker compose logs -f frontend

# Restart services
docker compose restart

# Stop services (keeps data)
docker compose down

# Stop and REMOVE all data (⚠️ destructive)
docker compose down -v

# Rebuild after code changes
docker compose up --build
```

**📖 For advanced Docker usage, troubleshooting, and production deployment, see [DOCKER.md](DOCKER.md)**

---

### 💻 Manual Setup (Development)

For local development without Docker:

#### Prerequisites
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
2. View real-time status of **Vehicles**, **Drivers**, and **Charging Stations** at a glance
3. Use the **Map View** (powered by Leaflet) to track assets geographically
4. Run scenario simulations (heat wave, cold snap) via the AI Agent
5. Manage fleet configuration via the new **Settings** tab

### 4. AI Chat Assistant

1. Open **Chat Interface**
2. Ask questions or give commands:
   - "Analyze this battery image for defects"
   - "Simulate a heat wave on the fleet"
   - "What is lithium plating?"
   - "According to the uploaded LG datasheet, what is the cutoff voltage?"
   - "Run a full pack audit"
3. Watch agent trace to see specialist collaboration
4. Navigate automatically with `[VIEW: VISUAL]` commands
5. **Contextual Memory** - The agent remembers previous context, allowing for natural follow-up questions (e.g., "Add a driver for *that* vehicle")

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
- **Leaflet (Vanilla)** - Lightweight, robust mapping without React wrappers
- **Framer Motion** - Smooth animations
- **React Player** - Video playback
- **Tailwind CSS** - Utility-first styling

### Deployment & Infrastructure
- **Docker** - Containerization for consistent deployment
- **Docker Compose** - Multi-container orchestration
- **Nginx** - Production web server and reverse proxy
- **Multi-stage builds** - Optimized container images
- **Persistent volumes** - Data preservation across restarts

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

## 🚀 Deployment

### Docker Deployment (Production-Ready)

BatteryForge AI is fully containerized and ready for deployment to any Docker-compatible platform.

#### Local/Development
```bash
docker compose up -d
```

#### Cloud Platforms

**AWS (Elastic Container Service)**
```bash
# Push to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <account>.dkr.ecr.us-east-1.amazonaws.com
docker tag batteryforgeai-backend:latest <account>.dkr.ecr.us-east-1.amazonaws.com/batteryforge-backend:latest
docker push <account>.dkr.ecr.us-east-1.amazonaws.com/batteryforge-backend:latest
# Deploy via ECS task definition
```

**Google Cloud Platform (Cloud Run)**
```bash
# Build and deploy
gcloud builds submit --tag gcr.io/<project-id>/batteryforge-backend
gcloud run deploy batteryforge --image gcr.io/<project-id>/batteryforge-backend --platform managed
```

**Azure (Container Instances)**
```bash
# Deploy via Azure Container Instances
az container create --resource-group batteryforge-rg \
  --name batteryforge-backend \
  --image batteryforgeai-backend \
  --dns-name-label batteryforge \
  --ports 8000
```

**DigitalOcean App Platform**
- Use `docker-compose.yml` with App Platform's Docker Compose support
- Configure environment variables in dashboard
- Automatic HTTPS and scaling

#### Kubernetes (Advanced)
For high-availability production deployments:
- Convert `docker-compose.yml` to Kubernetes manifests using [kompose](https://kompose.io/)
- Use Helm charts for package management
- Configure horizontal pod autoscaling for backend
- Set up Ingress for routing

**See [DOCKER.md](DOCKER.md) for detailed production deployment, security hardening, and monitoring setup.**

### Data Persistence

All data is preserved across container restarts via Docker volumes:
- **Analysis history** - SQLite database
- **Knowledge base** - ChromaDB vector store  
- **User uploads** - Battery images, CSVs, videos

**Backup volumes before upgrades:**
```bash
docker run --rm -v batteryforgeai_battery-db:/data -v $(pwd)/backups:/backup \
  alpine tar czf /backup/battery-db-$(date +%Y%m%d).tar.gz -C /data .
```

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
