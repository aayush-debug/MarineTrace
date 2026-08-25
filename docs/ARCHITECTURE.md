# SlickTrace Architecture

## System Overview

```
┌─────────────┐     ┌─────────────┐     ┌──────────────┐
│  Satellite   │     │   ML Model  │     │  Copernicus  │
│  SAR Image   │     │  (U-Net +   │     │   Marine     │
│              │     │   XGBoost)  │     │  (Currents)  │
└──────┬───────┘     └──────┬──────┘     └──────┬───────┘
       │                     │                    │
       ▼                     ▼                    ▼
┌──────────────────────────────────────────────────────────┐
│                    FastAPI Backend                        │
│  ┌──────────┐  ┌───────────┐  ┌─────────┐  ┌─────────┐ │
│  │  ML      │  │  Drift    │  │  AIS    │  │ Attrib  │ │
│  │  Client  │→ │  Service  │→ │ Service │→ │ Engine  │ │
│  └──────────┘  └───────────┘  └─────────┘  └─────────┘ │
│        │              │             │            │       │
│        ▼              ▼             ▼            ▼       │
│  ┌─────────────────────────────────────────────────────┐ │
│  │              Investigation Orchestrator             │ │
│  └─────────────────────────────────────────────────────┘ │
└──────────────────────────┬───────────────────────────────┘
                           │
              ┌────────────┼────────────┐
              ▼            ▼            ▼
        ┌──────────┐ ┌──────────┐ ┌──────────┐
        │  AIS API │ │ OpenDrift│ │ Database │
        │(Datalast)│ │  Engine  │ │(SQLite/  │
        │          │ │          │ │ PostGIS) │
        └──────────┘ └──────────┘ └──────────┘
```

## Data Flow

### Investigation Pipeline

1. **ML Detection** → `SpillDetection` (polygon + confidence)
2. **Drift Simulation** → `DriftResult` (origin + trajectories)
3. **AIS Reconstruction** → `VesselTrack[]` (all vessels in area)
4. **3-Stage Filtering** → `VesselTrack[]` (candidates only)
5. **Attribution Scoring** → `VesselAttribution[]` (ranked + scored)
6. **Response Assembly** → `InvestigationResponse` (single JSON)

### Filtering Pipeline

```
17 raw vessels
    ↓ Spatial filter (50km radius from origin)
11 vessels
    ↓ Temporal filter (origin time window ± 2h)
11 vessels
    ↓ Trajectory filter (track within 30km of origin)
6 candidates
```

## Component Details

### ML Client (`services/ml_client.py`)
- Protocol-based interface
- `MockMLClient` for development
- `RealMLClient` placeholder for ML team's endpoint

### Drift Service (`drift/`)
- OpenDrift wrapper with fallback to geometric mock
- Backward: negative timestep, particle ensemble → origin zone
- Forward: positive timestep → predicted trajectory
- Origin zone: convex hull of central particle positions

### AIS Service (`ais/`)
- Provider-agnostic client interface
- Mock: 17 synthetic vessels with realistic tracks
- Datalastic: real API integration (requires key)
- 3-stage filtering: spatial → temporal → trajectory

### Attribution Engine (`attribution/`)
- 5-feature explainable scoring model
- Configurable weights (default: 30/25/20/15/10)
- Human-readable reason generation
- Priority classification: HIGH/MEDIUM/LOW

### Frontend (`frontend/`)
- React + TypeScript + Vite
- Leaflet map with dark CARTO tiles
- Real-time map layers: spill, drift, origin, vessels
- Side panel: stats grid + expandable vessel cards

## Configuration

All config via `.env` (see `.env.example`):
- AIS API credentials
- Copernicus credentials
- Drift parameters (hours, timestep, particles)
- Attribution weights
- Database URL

## MVP Approximations

| Feature | MVP | Future |
|---------|-----|--------|
| Origin zone | Buffered convex hull | Kernel density surface |
| Environmental data | Mock constants | Copernicus Marine API |
| AIS data | Synthetic vessels | Datalastic/real API |
| Database | In-memory/SQLite | PostgreSQL + PostGIS |
| ML model | Mock deterministic | Real U-Net + XGBoost |
| Drift engine | Geometric mock | Full OpenDrift |
