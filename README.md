# 🛢️ SlickTrace

**Intelligent Maritime Oil-Spill Investigation System**

SlickTrace combines satellite imagery analysis, ocean drift simulation, AIS vessel tracking, and explainable attribution scoring to help investigators identify potential sources of maritime oil spills.

> ⚠️ SlickTrace provides **investigative priority rankings**, not definitive responsibility claims.

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
slicktrace/
├── backend/
│   ├── app/              # FastAPI application
│   │   ├── api/          # Route handlers
│   │   ├── models/       # Pydantic schemas
│   │   ├── services/     # Business logic
│   │   ├── core/         # Config & logging
│   │   ├── db/           # Database abstraction
│   │   └── utils/        # Geo & time helpers
│   ├── drift/            # OpenDrift integration
│   ├── ais/              # AIS client & filtering
│   ├── attribution/      # Scoring engine
│   └── data/demo/        # Demo scenario data
├── frontend/             # React + TypeScript dashboard
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
