# 🛰️ MarineTrace — Master Agent Context & System Architecture

> **Official Agent Instruction & Architecture Context Document**
> This file is automatically loaded by AI coding agents (Antigravity, Gemini, Claude, Cursor, Copilot) working in this repository.
> Review this context thoroughly before writing code, modifying services, or making architectural decisions.

---

## 🗺️ System Overview

MarineTrace is an **AI-powered marine oil-spill detection and vessel attribution platform** built for **Smart India Hackathon 2026**.
It detects slicks from Sentinel-1 SAR satellite imagery, models reverse/forward oceanographic drift, ingests live & historical AIS vessel traffic, and computes explainable 5-factor attribution scores to prioritize potential source vessels.

> **Legal Disclaimer**: MarineTrace provides investigative decision-support and priority ranking only — not definitive legal adjudication.

---

## 🏗️ Technology Stack

| Layer | Component | Technologies |
| :--- | :--- | :--- |
| **ML Engine** | SAR Slick Segmentation | PyTorch 2.13, `segmentation-models-pytorch` 0.5, U-Net (ResNet-34 backbone), Apple MPS GPU / CUDA / CPU |
| **Backend API** | REST & WebSockets | FastAPI, Uvicorn, Pydantic v2, SQLite (`aiosqlite`), `httpx`, `websockets` |
| **Frontend UI** | Maritime GIS Dashboard | React 19, TypeScript 5, Vite 6, Leaflet GIS, TailwindCSS, Lucide Icons |
| **AIS Tracking** | Live & Historical Feed | **AISStream.io** (live WebSocket) + **Datalastic API** + Deterministic **MockAISClient** fallback |
| **Drift Engine** | Metocean Simulation | **OpenDrift 1.14** (`OceanDrift`) driven by **Copernicus Marine** (`uo`, `vo` currents) + Geometric fallback |
| **Attribution** | Suspect Scoring Engine | 5-Factor mathematical model (Spatial 30%, Temporal 25%, Trajectory 20%, Behaviour 15%, Vessel Risk 10%) |

---

## 📁 Repository Directory Structure

```
MarineTrace/
├── AGENTS.md                        # Master AI agent context file (this file)
├── GEMINI.md                        # Gemini / workspace agent context mirror
├── PROJECT_STRUCTURE.md             # In-depth architectural layout & component inventory
├── README.md                        # Project landing documentation & quickstart
├── docker-compose.yml               # Container orchestration (FastAPI + Vite)
├── run_demo.py                      # Standalone zero-setup CLI demonstration runner
├── .env.example                     # Environment configuration template
│
├── backend/                         # FastAPI Backend Application
│   ├── app/
│   │   ├── main.py                  # API entry point & CORS configuration
│   │   ├── api/routes/              # REST endpoints (investigation, vessels, drift, ping)
│   │   ├── core/                    # Config (Pydantic Settings), logging
│   │   ├── db/                      # SQLite persistence repository (aiosqlite)
│   │   ├── models/                  # Pydantic schemas (spill, drift, vessel, investigation)
│   │   ├── services/
│   │   │   ├── ml_client.py         # RealMLClient (direct U-Net) & MockMLClient
│   │   │   ├── ais_service.py       # Multi-provider AIS coordinator & 3-stage filter
│   │   │   ├── drift_service.py     # Backward & forward drift simulation service
│   │   │   └── attribution_service.py # 5-factor mathematical attribution engine
│   │   └── utils/                   # Geodesic math, bounding box expansion
│   ├── ais/                         # AISStreamClient, DatalasticClient, MockAISClient, filtering, trajectory
│   ├── attribution/                 # Scoring dimensions, ranking, explanation generation
│   ├── drift/                       # Backtracking, forecasting, OpenDrift wrapper
│   ├── tests/                       # 20 automated pytest tests (all passing)
│   └── requirements.txt             # Python dependencies
│
├── frontend/                        # React 19 + TypeScript + Vite Dashboard
│   └── src/
│       ├── api/                     # Modular API client methods (investigations, spills, client)
│       ├── components/map/          # MaritimeMap.tsx, Leaflet layers, AIS tracks, measurement tool
│       ├── context/                 # InvestigationContext.tsx (global state)
│       ├── pages/                   # Dashboard, Investigation, Drift, Reports, NewInvestigation
│       └── types/                   # TypeScript interfaces
│
└── ml/                              # Machine Learning Pipeline
    ├── checkpoints/best_model.pth   # 93 MB trained U-Net ResNet-34 model checkpoint
    ├── data/sample_s1.tif           # Sample dual-pol Sentinel-1 SAR GeoTIFF (512x512)
    ├── inference/
    │   ├── api_interface.py         # detect_oil() with in-memory model cache & ML_MODEL_PATH support
    │   └── predict.py               # Standalone CLI inference runner
    ├── models/unet.py               # U-Net architecture factory
    ├── preprocessing/               # SAR dB calibration, clipping, normalization
    ├── features/                    # Connected components, regionprops, geo-polygon conversion
    ├── config.yaml                  # Model hyperparameters (threshold: 0.35, patch_size: 256)
    └── tests/                       # 36 pytest ML pipeline tests (all passing)
```

---

## ⚙️ How to Run the System

### 1. Python Environment
Always use the virtual environment at `backend/venv/`:
```bash
# Python binary
backend/venv/bin/python3
```

### 2. Start Backend API (Port 8000)
```bash
cd backend && venv/bin/python3 -m uvicorn app.main:app --host 0.0.0.0 --port 8000
```

### 3. Start Frontend Dashboard (Port 5173)
```bash
cd frontend && npm run dev -- --host
```

### 4. Run Automated Test Suites (56 Total Tests)
```bash
# Backend unit, API & AIS integration tests (20 tests)
PYTHONPATH=backend backend/venv/bin/python3 -m pytest backend/tests -v

# ML pipeline validation tests (36 tests)
PYTHONPATH=ml backend/venv/bin/python3 -m pytest ml/tests -v
```

### 5. Run Standalone CLI Demonstration
```bash
backend/venv/bin/python3 run_demo.py
```

---

## 🧠 ML Engine Facts & Performance

- **Model Architecture**: Semantic Segmentation U-Net with ResNet-34 backbone (`segmentation_models_pytorch`).
- **Parameter Count**: 24,433,233 (24.4 Million).
- **Input Channels**: 2-channel SAR ($\sigma_{VV}^0, \sigma_{VH}^0$ in dB, normalized $[0, 1]$).
- **Output Channel**: 1-channel pixel oil-slick probability map (sigmoid activated).
- **Detection Threshold**: `0.35` (calibrated for Sentinel-1 C-band SAR).
- **Model Caching**: `ml/inference/api_interface.py` utilizes in-memory model caching via `_MODEL_CACHE`, reducing inference latency from **2.06s → 0.28s**.
- **Hardware Acceleration**: Automatically selects Apple Metal Performance Shaders (`mps`) on macOS, `cuda` on Nvidia GPUs, or `cpu`.

---

## 📡 AIS Traffic Engine

MarineTrace supports a multi-provider fallback architecture:

1. **AISStream.io (`AISStreamClient`)**: Connects to `wss://stream.aisstream.io/v0/stream` for real-time global live vessel feeds.
2. **Datalastic API (`DatalasticClient`)**: Connects to `https://api.datalastic.com/api/v0` when configured.
3. **Deterministic Mock (`MockAISClient`)**: 17 realistic vessels traversing the Mumbai offshore lanes, guaranteeing 100% reliable offline demo execution.

### 3-Stage Filtering Pipeline:
$$\text{Raw AIS Tracks} \xrightarrow{\text{Spatial Filter } (R \le 50\text{km})} \xrightarrow{\text{Temporal Filter } (\pm 6\text{h})} \xrightarrow{\text{Trajectory Intersect } (d \le 30\text{km})} \text{Candidate Suspects}$$

---

## ⚖️ 5-Factor Attribution Scoring Engine

Attribution scores ($0 - 100$) are calculated dynamically from reconstructed vessel tracks:

1. **Spatial Proximity (30%)**: Exponential decay $100 \cdot e^{-d_{\text{min}} / 10\text{km}}$ from estimated spill origin.
2. **Temporal Alignment (25%)**: Gaussian decay relative to estimated release time window.
3. **Trajectory Correlation (20%)**: Directional cosine alignment with reverse drift vector.
4. **Behavioural Anomalies (15%)**: Speed drops ($>3\text{ knots}$), course changes ($>30^\circ$), or loitering.
5. **Vessel Risk Relevance (10%)**: Vessel type risk multiplier (Crude Tankers: 0.95, Cargo: 0.50, Fishing: 0.20).

---

## 🔌 API Endpoints Reference

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/ping` | Health check probe |
| `GET` | `/vessels/status` | Safe AIS provider & authentication status check |
| `GET` | `/vessels/search` | Spatial & temporal vessel query |
| `POST` | `/detect` | Direct ML SAR oil slick segmentation on image |
| `POST` | `/investigate` | Full pipeline: Real ML → Drift → AIS → Attribution |
| `POST` | `/demo/investigation` | Offline deterministic demonstration scenario |
| `GET` | `/investigations` | List historical investigation records |
| `GET` | `/investigation/{id}` | Retrieve specific investigation report |

---

## 🔐 Environment Variables (`.env`)

Configuration is managed via Pydantic Settings in `backend/app/core/config.py`.

```ini
# AIS Provider
AIS_API_KEY=your_key_here
AIS_BASE_URL=wss://stream.aisstream.io/v0/stream
AIS_PROVIDER=aisstream

# ML Configuration
USE_REAL_ML=true
ML_MODEL_PATH=ml/checkpoints/best_model.pth

# Backend & Database
BACKEND_HOST=0.0.0.0
BACKEND_PORT=8000
DATABASE_URL=sqlite:///./marinetrace.db
```

> **Security Rule**: Never commit `.env` or log API keys. Template is available in `.env.example`.

---

## 📋 Verified System Status

- **ML Inference**: ✅ **WORKING** (U-Net ResNet-34 loaded, 0.28s inference time)
- **ML → Backend**: ✅ **WORKING** (`RealMLClient` and `/detect` active)
- **Drift Simulation**: ✅ **WORKING (REAL)** (OpenDrift 1.14 + Copernicus Marine `uo`/`vo` forcing)
- **AIS Live Stream**: ✅ **WORKING** (`AISStreamClient` connected & verified)
- **AIS Mock Fallback**: ✅ **READY** (Used in `/demo/investigation` or offline mode)
- **5-Factor Attribution**: ✅ **WORKING** (Mathematical suspect ranking)
- **Automated Tests**: ✅ **66/66 PASSING** (30 backend + 36 ML)
- **Frontend Dashboard**: ✅ **WORKING** (React 19 Leaflet GIS on port 5173)
