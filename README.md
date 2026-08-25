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

```
marinetrace/
├── backend/              # FastAPI backend & orchestration
│   ├── app/              # API routes, models, services
│   ├── drift/            # OpenDrift integration
│   ├── ais/              # AIS client & filtering
│   ├── attribution/      # Scoring engine
│   └── data/demo/        # Demo scenario data
├── frontend/             # React + TypeScript dashboard
├── ml/                   # Sentinel-1 SAR Oil Spill Detection Pipeline
│   ├── models/           # U-Net ResNet-34 segmentation network
│   ├── preprocessing/    # Dual-pol radiometric calibration & patch extraction
│   ├── features/         # Geometric & morphological slick feature extractors
│   ├── inference/        # Pure JSON API interface & pipeline runners
│   ├── training/         # Custom loss functions & training scripts
│   ├── checkpoints/      # Model weights (best_model.pth)
│   ├── data/             # Synthetic fixtures & sample GeoTIFF
│   └── tests/            # Automated test suite
├── docs/                 # API contract & architecture
└── docker-compose.yml
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

## Team

- **Person 1 (ML)**: Sentinel-1 SAR → U-Net → XGBoost → Oil spill detection
- **Person 2 (Systems)**: Backend, drift, AIS, attribution, frontend

## License

Hackathon project — internal use only.
