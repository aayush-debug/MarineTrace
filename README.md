# 🛰️ MarineTrace

**AI-Powered Marine Oil-Spill Detection & Vessel Attribution System**

MarineTrace combines Sentinel-1 SAR satellite imagery analysis, oceanographic drift modeling (OpenDrift), historical AIS vessel tracking, and explainable multi-feature attribution scoring to help maritime authorities, Coast Guard, and pollution investigators identify potential sources of marine oil spills.

> ⚠️ MarineTrace provides **investigative decision-support priority rankings**, not legal adjudication.

## Architecture

```
Satellite SAR Image
       ↓
  ML Oil Detection (U-Net + XGBoost)
       ↓
  Detected Oil Polygon + Confidence
       ↓
  Ocean & Weather Data (Copernicus Marine)
       ↓
  OpenDrift Backward Simulation
       ↓
  Estimated Spill Origin + Time Window
       ↓
  Historical AIS Reconstruction
       ↓
  3-Stage Vessel Filtering (Spatial → Temporal → Trajectory)
       ↓
  5-Feature Attribution Scoring
       ↓
  Ranked Candidate Vessels
       ↓
  Interactive Investigation Dashboard
```

## Quick Start

### ML (Oil Spill Detection Pipeline)
```bash
cd ml
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
python inspect_compatibility.py
python run_all_tests.py
```

### Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp ../.env.example ../.env   # Edit with your API keys
uvicorn app.main:app --reload
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

### Docker (Full Stack)
```bash
docker compose up
```

### Demo Mode
```bash
python run_demo.py
```

## Project Structure

For a detailed breakdown of every module, algorithm, and file, see **[PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md)**.

```
MarineTrace/
├── backend/              # FastAPI backend, simulation engines, AIS, attribution
│   ├── app/              # API routes, models, services, core, db
│   ├── ais/              # AIS client, trajectory analysis, & 3-stage filtering
│   ├── attribution/      # 5-factor scoring engine & vessel ranking
│   ├── drift/            # OpenDrift Lagrangian backtracking & forecasting
│   └── tests/            # Automated pytest test suite
├── frontend/             # React 19 + TypeScript + Vite interactive dashboard
│   ├── src/api/          # Modular API client services
│   ├── src/components/   # Domain-specific UI (map, charts, drift, vessel, satellite)
│   ├── src/pages/        # Dashboard, Investigation, Drift, Reports, Satellites
│   └── src/context/      # Unified investigation state management
├── ml/                   # Sentinel-1 SAR Oil Spill Detection Pipeline
│   ├── models/           # U-Net ResNet-34 segmentation network
│   ├── preprocessing/    # Dual-pol radiometric calibration & patch extraction
│   ├── features/         # Geometric & morphological slick feature extractors
│   ├── inference/        # Pure JSON API interface & pipeline runners
│   ├── training/         # Custom loss functions & training scripts
│   ├── checkpoints/      # Model weights (best_model.pth)
│   └── tests/            # Automated ML validation suite
├── docs/                 # API contract, architecture, codebase & Docker guides
├── docker-compose.yml    # Full-stack container orchestration
├── marinetrace.db        # SQLite investigation database
└── run_demo.py           # Standalone CLI investigation runner
```

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/ping` | Health check |
| `POST` | `/investigate` | Run full investigation pipeline |
| `POST` | `/demo/investigation` | Run pre-cached demo investigation |
| `GET` | `/investigation/{id}` | Retrieve past investigation |
| `POST` | `/drift/backward` | Run backward drift simulation |
| `POST` | `/drift/forward` | Run forward drift prediction |
| `GET` | `/vessels/search` | Search AIS vessels by area/time |

