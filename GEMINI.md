# 🛰️ MarineTrace — Agent Context File

This file is automatically loaded by every agent working in this repository.
Read it fully before writing any code or making any suggestions.

---

## 🗺️ What Is MarineTrace?

MarineTrace is an **AI-powered marine oil-spill detection and vessel attribution platform**.
It ingests Sentinel-1 SAR satellite imagery, runs ML segmentation, models oceanographic drift, reconstructs AIS vessel traffic, and produces ranked, explainable attribution suspects — displayed in a React GIS dashboard.

> **Smart India Hackathon 2026** project. Investigative decision-support only — not legal adjudication.

---

## 🏗️ Tech Stack

| Layer | Technology |
| :--- | :--- |
| **ML Pipeline** | Python 3.14, PyTorch 2.13, segmentation-models-pytorch 0.5, U-Net + ResNet-34 encoder |
| **Backend API** | FastAPI (uvicorn), Pydantic v2, SQLite (aiosqlite), Python 3.14 |
| **Frontend** | React 19, TypeScript 5, Vite 6, Leaflet GIS |
| **Drift Simulation** | OpenDrift (not installed → geometric mock fallback active) |
| **AIS Data** | Datalastic API (not configured → MockAISClient active) |
| **Containerization** | Docker Compose (backend + frontend + PostGIS) |

---

## 📁 Critical Paths

```
MarineTrace/
├── backend/                         # FastAPI app
│   ├── app/
│   │   ├── api/routes/              # REST endpoints
│   │   ├── services/
│   │   │   ├── ml_client.py         # MockMLClient + RealMLClient (calls ml/inference)
│   │   │   ├── drift_service.py     # Lagrangian drift (geometric mock)
│   │   │   ├── ais_service.py       # AIS reconstruction + 3-stage filter
│   │   │   └── attribution_service.py  # 5-factor scoring
│   │   ├── models/                  # Pydantic schemas (spill, drift, vessel, investigation)
│   │   └── db/repository.py         # SQLite persistence
│   ├── ais/                         # filtering.py, client.py, trajectory.py
│   ├── attribution/                 # engine.py
│   ├── drift/                       # simulation.py
│   └── tests/                       # 8 pytest tests (all passing)
├── frontend/
│   └── src/
│       ├── components/map/          # MaritimeMap.tsx, overlays, controls, measure tool
│       ├── context/InvestigationContext.tsx
│       ├── pages/                   # Dashboard, Investigation, Drift, Reports, Satellites
│       └── api/                     # Modular API clients
├── ml/
│   ├── checkpoints/best_model.pth   # 97.9 MB — U-Net ResNet-34 trained weights
│   ├── data/sample_s1.tif           # Sentinel-1 GeoTIFF test image (512x512, 2-channel)
│   ├── inference/
│   │   ├── api_interface.py         # detect_oil(image_path, threshold=0.35) -> dict
│   │   └── predict.py               # CLI runner
│   ├── models/unet.py               # create_model(config) factory
│   ├── preprocessing/sar_preprocessing.py
│   ├── features/candidate_features.py
│   ├── config.yaml                  # threshold: 0.35 (tuned), patch_size: 256
│   └── tests/                       # 36 pytest tests (all passing)
├── run_demo.py                      # Standalone end-to-end CLI demo runner
├── PROJECT_STRUCTURE.md             # Full architecture reference
└── README.md                        # Project overview
```

---

## ⚙️ Running the Project

```bash
# Python virtualenv is at: backend/venv/
# Always use: backend/venv/bin/python3 (NOT system python)

# Run CLI demo (full pipeline, no servers needed)
backend/venv/bin/python3 run_demo.py

# Start backend API (port 8000)
cd backend && venv/bin/python3 -m uvicorn app.main:app --host 0.0.0.0 --port 8000

# Start frontend dev server (port 5173)
cd frontend && npm run dev -- --host

# Run all tests
PYTHONPATH=backend backend/venv/bin/python3 -m pytest backend/tests   # 8 tests
PYTHONPATH=ml     backend/venv/bin/python3 -m pytest ml/tests         # 36 tests

# Run 21-step ML validation suite
cd ml && PYTHONPATH=. ../backend/venv/bin/python3 run_all_tests.py

# Real SAR inference
PYTHONPATH=ml backend/venv/bin/python3 ml/inference/predict.py --image ml/data/sample_s1.tif
```

---

## 🧠 ML Model — Key Facts

- **Architecture**: U-Net semantic segmentation, ResNet-34 encoder (ImageNet-pretrained)
- **Parameters**: 24,433,233 (24.4M)
- **Input**: 2-channel SAR (VV + VH, Sigma0 in dB, normalized [0,1])
- **Output**: 1-channel pixel oil probability map (sigmoid, threshold 0.35)
- **Checkpoint**: `ml/checkpoints/best_model.pth` (97.9 MB)
- **Hardware**: Apple MPS (Metal) GPU acceleration active
- **Key fix**: When loading checkpoint, set `encoder_weights=None` first to skip ImageNet download — already implemented in `ml/inference/api_interface.py`

---

## 🔌 Backend — Key Facts

- **Python**: 3.14.2 (macOS arm64). **Always use `backend/venv/bin/python3`**, not system Python.
- **Port**: 8000
- **ML Client**: `backend/app/services/ml_client.py` has `MockMLClient` (deterministic) and `RealMLClient` (calls real U-Net)
- **PYTHONPATH for backend scripts**: `PYTHONPATH=backend`
- **PYTHONPATH for ml scripts**: `PYTHONPATH=ml`
- **Database**: `marinetrace.db` (SQLite)

### Important Pydantic Model Field Names (easy to get wrong)
```python
DriftResult.origin_time_window     # NOT .time_window
DriftTimeWindow.start / .end       # NOT .earliest / .latest
DriftTrajectory.points             # use len(.points) NOT len(trajectory) directly
```

---

## 🌐 Frontend — Key Facts

- **Port**: 5173 (Vite dev server)
- **Map**: Leaflet + react-leaflet with maritime overlays
- **State**: `InvestigationContext.tsx` for global investigation state
- **API services**: Modular clients in `frontend/src/api/`
- `frontend/src/services/api.ts` re-exports from `../api/` (don't edit it directly)

---

## 📋 System Status (Last Verified: 2026-08-28)

| Component | Status | Notes |
| :--- | :--- | :--- |
| Backend API (port 8000) | Running | Uvicorn |
| Frontend (port 5173) | Running | Vite |
| U-Net ML inference | Working | best_model.pth loaded, MPS GPU active |
| 3-Stage AIS Filtering | Working | 17 vessels → 6 after filtering |
| Drift Simulation | Working | Geometric mock (OpenDrift not installed) |
| 5-Factor Attribution | Working | Top suspect: MV Ocean Star |
| Backend tests | 8/8 passing | |
| ML tests | 36/36 passing | |
| Git remote | Up to date | github.com/aayush-debug/MarineTrace (main) |

---

## ⚠️ Known Gotchas

1. **OpenDrift not installed**: Drift uses geometric mock. Install `opendrift` for real physics.
2. **`best_model.pth` is 97.9 MB**: GitHub warns on push but accepts it. Don't gitignore it.
3. **`rasterio` not installed**: SAR loading falls back to `tifffile` (handled already).
4. **Detection threshold**: 0.35 in `ml/config.yaml` (at 0.5 the sample returns 0 candidates).
5. **Git push large files**: Slow (~2-3 min). `http.postBuffer` already set to 500MB.
6. **Non-fast-forward git push**: Always `git pull --rebase origin main` first if branches diverge.
7. **SSL certs (macOS Python 3.14)**: Run `/Applications/Python 3.14/Install Certificates.command` if SSL errors occur.
8. **Two marinetrace.db files**: `./marinetrace.db` (used by run_demo.py) and `backend/marinetrace.db`.

---

## 🔑 Environment

`.env` at project root (not committed). No keys needed — all services have mock fallbacks:
- `AIS_API_KEY` — Datalastic (mock active)
- `COPERNICUS_USER` / `COPERNICUS_PASSWORD` — Copernicus Marine (mock active)
