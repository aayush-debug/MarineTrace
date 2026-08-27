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
| **ML Engine** | SAR Slick Segmentation | PyTorch 2.13, `segmentation-models-pytorch` 0.5, U-Net (ResNet-34 backbone, 24.4M params), Apple MPS GPU / CUDA / CPU |
| **Backend API** | REST & WebSockets | FastAPI, Uvicorn, Pydantic v2, SQLite (`aiosqlite`), `httpx`, `websockets` |
| **Frontend UI** | Maritime GIS Command Center | React 19, TypeScript 5, Vite 6, Leaflet GIS (`react-leaflet`), TailwindCSS v4, Recharts, Lucide Icons |
| **AIS Tracking** | Live & Historical Feed | **AISStream.io** (live WebSocket) + **Datalastic API** + Deterministic **MockAISClient** fallback |
| **Drift Engine** | Metocean Simulation | **OpenDrift 1.14** (`OceanDrift`) driven by **Copernicus Marine** (`uo`, `vo` surface current grids) + Geometric fallback |
| **Attribution** | Suspect Scoring Engine | 5-Factor mathematical model (Spatial 30%, Temporal 25%, Trajectory 20%, Behaviour 15%, Vessel Risk 10%) |

---

## 📁 Repository Directory Structure

```
MarineTrace/
├── AGENTS.md                        # Master AI agent context file (this file)
├── GEMINI.md                        # Gemini / workspace agent context mirror
├── PROJECT_STRUCTURE.md             # In-depth architectural layout & component inventory
├── README.md                        # Project landing documentation & quickstart
├── docker-compose.yml               # Container orchestration (FastAPI backend service)
├── run_demo.py                      # Standalone zero-setup CLI demonstration runner
├── marinetrace.db                   # SQLite investigation persistence database
├── package.json                     # Root npm script delegation to frontend
├── .env.example                     # Environment configuration template
│
├── backend/                         # 🐍 FastAPI Backend Application
│   ├── app/
│   │   ├── main.py                  # API entry point, lifespan, & CORS configuration
│   │   ├── api/routes/              # REST endpoints (investigation, vessels, drift, ping)
│   │   ├── core/                    # Config (Pydantic Settings), logging
│   │   ├── db/                      # SQLite persistence repository (aiosqlite)
│   │   ├── models/                  # Pydantic schemas (spill, drift, vessel, investigation)
│   │   ├── services/
│   │   │   ├── ml_client.py         # RealMLClient (direct U-Net) & MockMLClient
│   │   │   ├── ais_service.py       # Multi-provider AIS coordinator & 3-stage filter
│   │   │   ├── copernicus_service.py# Copernicus Marine current fetching & NetCDF caching
│   │   │   ├── drift_service.py     # OpenDrift & geometric metocean drift simulation
│   │   │   ├── environmental_service.py # Metocean environmental data coordinator
│   │   │   └── attribution_service.py # 5-factor mathematical attribution engine
│   │   └── utils/                   # Geodesic math, bounding box expansion, time helpers
│   ├── ais/                         # AISStreamClient, DatalasticClient, MockAISClient, filtering, trajectory
│   ├── attribution/                 # Scoring dimensions, ranking, natural language justification
│   ├── data/copernicus/             # Cached Copernicus Marine NetCDF current grids (*.nc)
│   ├── drift/                       # Backtracking, forecasting, OpenDrift physical model runner
│   ├── tests/                       # 30 automated pytest tests (all passing)
│   └── requirements.txt             # Python dependencies (OpenDrift, Copernicus, FastAPI, etc.)
│
├── frontend/                        # ⚛️ React 19 + TypeScript + Vite Dashboard
│   ├── package.json                 # React 19, Leaflet, Recharts, Lucide, Tailwind v4
│   ├── vite.config.ts               # Vite configuration with Tailwind CSS plugin
│   ├── tsconfig.json                # TypeScript compiler configuration
│   ├── public/                      # Static assets & SAR preview composites
│   └── src/
│       ├── api/                     # Modular API client (auth, client, drift, investigations, sar, spcsft, spills, vessels)
│       ├── components/              # Modular UI components
│       │   ├── charts/              # AttributionRadarChart
│       │   ├── drift/               # DriftTimelineControl, EnvironmentalConditionsCard
│       │   ├── layout/              # Sidebar, TopNav
│       │   ├── map/                 # MaritimeMap, MapLayerControls, MapLegend, MapZoomControl
│       │   ├── ml/                  # MLModelCard
│       │   ├── satellite/           # SARGisMapView, SARRasterViewer, SatelliteViewer, SARMetricsBadge
│       │   ├── spill/               # SpillInfoPanel
│       │   ├── timeline/            # InvestigationTimeline
│       │   ├── ui/                  # ConfidenceGauge, PipelineProgressModal
│       │   └── vessel/              # VesselRankList, VesselDetailPanel, ScoreBreakdownBar
│       ├── context/                 # AuthContext, InvestigationContext, ThemeContext
│       ├── data/demo/               # Deterministic demo and SAR raster fixtures
│       ├── pages/                   # 10 Core Application Views:
│       │   ├── Dashboard.tsx        # Command center overview with GIS map & active incidents
│       │   ├── SatelliteImagery.tsx # Sentinel-1 SAR raster viewer (VV/VH, probability mask, GeoJSON)
│       │   ├── SpaceShiftRealTime.tsx # Live satellite & real-time maritime vessel monitor
│       │   ├── DriftAnalysis.tsx    # OpenDrift backtrack origin & forward forecast projection
│       │   ├── Investigation.tsx    # Investigation drilldown & suspect vessel prioritization
│       │   ├── NewInvestigation.tsx # Investigation creator with SAR GeoTIFF/image upload workflow
│       │   ├── VesselAttribution.tsx# 5-factor scoring breakdown & trajectory inspection
│       │   ├── Reports.tsx          # Forensic investigation report generation & PDF export
│       │   ├── AccessLogs.tsx       # Security audit logs & user access history
│       │   └── LoginPage.tsx        # Authentication & role-based dashboard access
│       ├── types/                   # TypeScript schemas (auth, investigation, sar, spcsft)
│       └── index.css                # Marine dark-mode design system, glassmorphism, & tokens
│
└── ml/                              # 🧠 Machine Learning Pipeline
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
Always use the virtual environment located at `backend/venv/`:
```bash
# Python binary path (from workspace root)
backend/venv/bin/python3
```

### 2. Start Backend API (Port 8000)
From the workspace root:
```bash
cd backend && venv/bin/python3 -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
*Or directly from root without changing directory:*
```bash
backend/venv/bin/python3 -m uvicorn app.main:app --app-dir backend --host 0.0.0.0 --port 8000 --reload
```

### 3. Start Frontend Dashboard (Port 5173)
From the workspace root:
```bash
npm run dev
```
*Or navigating into frontend directory:*
```bash
cd frontend && npm install && npm run dev -- --host
```

### 4. Build Frontend Production Bundle
```bash
npm run build
# (or: cd frontend && npm run build)
```

### 5. Run Automated Test Suites (66 Total Tests — 100% Passing)
```bash
# Backend unit, API, Copernicus, OpenDrift & AIS integration tests (30 tests)
PYTHONPATH=backend backend/venv/bin/python3 -m pytest backend/tests -v

# ML pipeline validation tests (36 tests)
PYTHONPATH=ml backend/venv/bin/python3 -m pytest ml/tests -v
```

### 6. Run Standalone CLI Demonstration
```bash
backend/venv/bin/python3 run_demo.py
```

---

## 🧠 ML Engine Facts & Performance

- **Model Architecture**: Semantic Segmentation U-Net with ResNet-34 backbone (`segmentation_models_pytorch`).
- **Parameter Count**: 24,433,233 (24.4 Million parameters).
- **Input Channels**: 2-channel SAR ($\sigma_{VV}^0, \sigma_{VH}^0$ in dB, normalized $[0, 1]$).
- **Output Channel**: 1-channel pixel oil-slick probability map (sigmoid activated).
- **Detection Threshold**: `0.35` (calibrated for Sentinel-1 C-band SAR).
- **Model Caching**: `ml/inference/api_interface.py` utilizes in-memory model caching via `_MODEL_CACHE`, reducing inference latency from **2.06s → 0.28s**.
- **Hardware Acceleration**: Automatically selects Apple Metal Performance Shaders (`mps`) on macOS, `cuda` on Nvidia GPUs, or `cpu`.

---

## 🌊 Metocean Drift Engine (Copernicus Marine + OpenDrift)

MarineTrace uses a physical Lagrangian particle drift simulation:

1. **Copernicus Marine Integration (`CopernicusService`)**:
   - Queries `cmems_mod_glo_phy-cur_anfc_0.083deg_P1D-m` for surface current velocity vectors ($u_o, v_o$).
   - Automatically caches NetCDF grids locally under `backend/data/copernicus/` to minimize external API calls.
2. **OpenDrift 1.14 Runner (`OpenDriftRunner` & `OceanDrift`)**:
   - **Reverse Drift (Backtracking)**: Seeds Lagrangian particles at slick observation coordinates and simulates backwards in time (step: 300s) to estimate release origin point ($L_0, \lambda_0$) and time window ($T_0$).
   - **Forward Drift (Forecasting)**: Projects slick trajectory and dispersion envelope forward in time (up to 48 hours) for containment and shoreline impact planning.
3. **Geometric Fallback**: Gracefully activates if NetCDF data or external providers are unreachable.

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
| `POST` | `/drift/backward` | Standalone backward drift simulation |
| `POST` | `/drift/forward` | Standalone forward drift trajectory forecast |

---

## 🔐 Environment Variables (`.env`)

Configuration is managed via Pydantic Settings in `backend/app/core/config.py`.

```ini
# AIS Provider
AIS_API_KEY=your_key_here
AIS_BASE_URL=wss://stream.aisstream.io/v0/stream
AIS_PROVIDER=aisstream

# Copernicus Marine Credentials (Optional for live fetch)
COPERNICUSMARINE_SERVICE_USERNAME=your_copernicus_username
COPERNICUSMARINE_SERVICE_PASSWORD=your_copernicus_password

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
- **Frontend Dashboard**: ✅ **WORKING** (React 19 + TypeScript + Vite 6 + Leaflet GIS on port 5173)
