# SlickTrace — Complete Codebase Architecture & File Reference

> **Comprehensive guide explaining every file, module, algorithm, and data model implemented in the SlickTrace platform.**

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [High-Level Data Pipeline Flow](#2-high-level-data-pipeline-flow)
3. [Project Directory Tree](#3-project-directory-tree)
4. [Backend Core & Configuration](#4-backend-core--configuration)
5. [Data Models (Pydantic Schemas)](#5-data-models-pydantic-schemas)
6. [API Layer & Route Handlers](#6-api-layer--route-handlers)
7. [Drift Simulation Engine](#7-drift-simulation-engine)
8. [AIS Integration & 3-Stage Filtering](#8-ais-integration--3-stage-filtering)
9. [Explainable Attribution Engine](#9-explainable-attribution-engine)
10. [Database Repository Layer](#10-database-repository-layer)
11. [Utilities (Geodesic Math & Time)](#11-utilities-geodesic-math--time)
12. [Frontend Dashboard (React + TypeScript + Leaflet)](#12-frontend-dashboard-react--typescript--leaflet)
13. [Tests & Verification](#13-tests--verification)
14. [Configuration & Infrastructure](#14-configuration--infrastructure)
15. [How Two Developers Collaborate (ML ↔ Backend Contract)](#15-how-two-developers-collaborate-ml--backend-contract)

---

## 1. Executive Summary

SlickTrace is an automated intelligence platform for investigating marine oil spills. Given a satellite observation (SAR imagery) of an oil slick, the system executes an integrated physical-geospatial pipeline:
1. **Detection**: Ingests oil slick geometry, centroid, confidence, and timestamp from the ML model.
2. **Reverse Drift Simulation**: Backtracks the spill using ocean currents and wind vectors (via OpenDrift or geometric ensemble fallback) to reconstruct where and when the spill occurred (Origin Zone + Time Window).
3. **Forward Drift Forecast**: Predicts where the spill will drift over the next 24 hours.
4. **Historical AIS Reconstruction**: Retrieves historical vessel traffic in the incident bounding box.
5. **3-Stage Candidate Filtering**: Filters out irrelevant vessels via **Spatial Proximity** (50km) → **Temporal Window** (±2h) → **Trajectory Intersection** (30km).
6. **5-Dimension Attribution Scoring**: Scores candidate vessels on Spatial, Temporal, Trajectory, Behavioral Anomaly, and Vessel Type Relevance, with plain-language explanations.
7. **Interactive Dashboard**: Visualizes all geometries (slick polygon, drift trajectories, origin zone, vessel tracks) on an interactive Leaflet map with ranked investigative priority cards.

---

## 2. High-Level Data Pipeline Flow

```
+-------------------------------------------------------------------------+
| STEP 1: Satellite SAR Image / Input                                     |
| Input: Base64 image + Observation Timestamp                             |
+-------------------------------------------------------------------------+
                                    |
                                    v
+-------------------------------------------------------------------------+
| STEP 2: ML Oil-Spill Detection (backend/app/services/ml_client.py)       |
| Output: SpillDetection                                                  |
|   - spill_detected: True                                                |
|   - confidence: 0.92                                                    |
|   - area_km2: 18.4                                                      |
|   - centroid: (18.721 N, 72.914 E)                                      |
|   - geometry: GeoJSON Polygon                                           |
+-------------------------------------------------------------------------+
                                    |
                                    v
+-------------------------------------------------------------------------+
| STEP 3: Drift Simulation (backend/drift/backtracking.py & forecasting.py|
| Output: DriftResult                                                     |
|   - origin: Estimated coordinate (18.915 N, 73.203 E) + Polygon zone    |
|   - origin_time_window: T-24h to T-18h                                  |
|   - backward_trajectory: GeoJSON LineString                             |
|   - forward_trajectory: GeoJSON LineString (future +6h, +12h, +24h)     |
+-------------------------------------------------------------------------+
                                    |
                                    v
+-------------------------------------------------------------------------+
| STEP 4: AIS Reconstruction (backend/ais/client.py)                      |
| Output: 17 Raw Vessel Tracks in Bounding Box                            |
+-------------------------------------------------------------------------+
                                    |
                                    v
+-------------------------------------------------------------------------+
| STEP 5: 3-Stage Filtering (backend/ais/filtering.py)                    |
|   [Stage 1: Spatial Filter]    17 -> 11 vessels (within 50km radius)    |
|   [Stage 2: Temporal Filter]   11 -> 11 vessels (within time window)    |
|   [Stage 3: Trajectory Filter] 11 -> 6 candidates (track <= 30km)       |
+-------------------------------------------------------------------------+
                                    |
                                    v
+-------------------------------------------------------------------------+
| STEP 6: Attribution Engine (backend/attribution/)                       |
|   Features: Spatial (30%) + Temporal (25%) + Trajectory (20%) +         |
|             Behaviour Anomaly (15%) + Vessel Relevance (10%)            |
| Output: Ranked VesselAttribution[] (1..N) with human-readable reasons   |
+-------------------------------------------------------------------------+
                                    |
                                    v
+-------------------------------------------------------------------------+
| STEP 7: Persistence & Delivery (backend/app/api/routes/investigation.py)|
|   Saved to SQLite / PostGIS repository. Returned as single JSON.        |
|   Rendered on React + Leaflet map with ranked cards and score bars.     |
+-------------------------------------------------------------------------+
```

---

## 3. Project Directory Tree

```
slicktrace/
├── .env.example                     # Template for environment variables
├── .env                             # Local environment configuration (ignored by git)
├── .gitignore                       # Git ignore rules for Python, Node, DB, caches
├── .dockerignore                    # Docker build context exclusions
├── docker-compose.yml               # Multi-container orchestration (API + UI + PostGIS)
├── README.md                        # Project landing page & quickstart
├── run_demo.py                      # Standalone CLI investigation runner
│
├── backend/
│   ├── Dockerfile                   # Production-ready Python 3.11 container definition
│   ├── .dockerignore                # Backend-specific docker exclusions
│   ├── requirements.txt             # Python dependencies (FastAPI, Shapely, PyProj, etc.)
│   │
│   ├── app/
│   │   ├── main.py                  # FastAPI application entrypoint & CORS setup
│   │   │
│   │   ├── api/
│   │   │   ├── dependencies.py      # Dependency injection singletons
│   │   │   └── routes/
│   │   │       ├── health.py        # GET /ping healthcheck route
│   │   │       ├── investigation.py # POST /investigate, /demo/investigation, GET /investigation/{id}
│   │   │       ├── drift.py         # POST /drift/backward, POST /drift/forward
│   │   │       └── vessels.py       # GET /vessels/search, GET /vessels/{mmsi}
│   │   │
│   │   ├── core/
│   │   │   ├── config.py            # Pydantic Settings class loading from .env
│   │   │   └── logging.py           # Structured logging configuration
│   │   │
│   │   ├── db/
│   │   │   ├── __init__.py          # DB package exports
│   │   │   └── repository.py        # SQLite / PostGIS-ready InvestigationRepository
│   │   │
│   │   ├── models/
│   │   │   ├── spill.py             # SpillDetection, SpillCentroid, GeoJSONGeometry
│   │   │   ├── drift.py             # DriftResult, DriftOrigin, DriftTrajectory, DriftTimeWindow
│   │   │   ├── vessel.py            # VesselPosition, VesselTrack, VesselAttribution, FeatureScores
│   │   │   └── investigation.py     # InvestigationRequest, InvestigationResponse, InvestigationStatus
│   │   │
│   │   ├── services/
│   │   │   ├── ml_client.py         # ML interface (MockMLClient & RealMLClient protocol)
│   │   │   ├── drift_service.py     # High-level drift orchestration
│   │   │   ├── environmental_service.py # Ocean current & wind data providers
│   │   │   ├── ais_service.py       # AIS data fetching & filtering orchestration
│   │   │   └── attribution_service.py # Feature scoring & ranking orchestration
│   │   │
│   │   └── utils/
│   │       ├── geo.py               # Geodesic WGS-84 distances, convex hulls, GeoJSON utils
│   │       └── time.py              # ISO parsing, UTC timestamps, duration formatting
│   │
│   ├── drift/
│   │   ├── opendrift_runner.py      # OpenDrift OceanDrift wrapper with fallback
│   │   ├── backtracking.py          # Reverse-time particle ensemble & origin zone polygon
│   │   └── forecasting.py           # Forward trajectory simulation
│   │
│   ├── ais/
│   │   ├── client.py                # AIS Client (Mock 17 vessels + Datalastic REST API)
│   │   ├── filtering.py             # 3-Stage filtering (Spatial -> Temporal -> Trajectory)
│   │   └── trajectory.py            # Interpolation, speed/heading deviation, loitering & stops
│   │
│   ├── attribution/
│   │   ├── features.py              # 5 individual scoring algorithms (0-100 each)
│   │   ├── scoring.py               # Weighted composite score & explanatory reason generation
│   │   └── ranking.py               # Sorting & 1-based rank assignment
│   │
│   ├── data/demo/
│   │   ├── mock_ml_result.json      # Pre-cached ML detection JSON
│   │   ├── mock_drift_result.json   # Pre-cached Drift result JSON
│   │   └── mock_attribution.json    # Pre-cached Attribution ranking JSON
│   │
│   └── tests/
│       ├── test_ml_client.py        # ML schema & confidence unit tests
│       ├── test_drift.py            # Backward/forward drift simulation tests
│       ├── test_ais.py              # AIS track generation & 3-stage filter tests
│       ├── test_attribution.py      # Feature scoring, weights, & ranking tests
│       └── test_api.py              # FastAPI endpoint integration tests
│
├── frontend/
│   ├── Dockerfile                   # Frontend Node 20 container definition
│   ├── index.html                   # HTML shell with Inter & JetBrains Mono fonts
│   ├── package.json                 # React 19, TypeScript, Leaflet, Vite dependencies
│   ├── vite.config.ts               # Vite bundler configuration
│   └── src/
│       ├── main.tsx                 # React DOM mount point
│       ├── App.tsx                  # Root app state & lifecycle controller
│       ├── index.css                # Custom dark maritime design system
│       ├── types/
│       │   └── investigation.ts     # TypeScript interfaces mirroring backend models
│       ├── services/
│       │   └── api.ts               # Fetch client for backend endpoints
│       └── components/
│           ├── InvestigationMap.tsx # Interactive Leaflet map with GeoJSON overlays
│           ├── InvestigationPanel.tsx # Side panel with stats & ranked candidate cards
│           ├── UploadPanel.tsx      # Pre-investigation launch & image upload screen
│           ├── LoadingOverlay.tsx   # Multi-step progress indicator
│           └── MapLegend.tsx        # Floating map layer color key
│
└── docs/
    ├── API_CONTRACT.md              # Standardized ML <-> Backend contract
    ├── ARCHITECTURE.md              # System design & component interaction
    ├── DOCKER_GUIDE.md              # Step-by-step Docker hosting manual
    └── CODEBASE_EXPLAINED.md        # This master documentation file
```

---

## 4. Backend Core & Configuration

### `backend/app/core/config.py`
- **Purpose**: Defines application-wide configuration using `pydantic-settings`. Automatically loads values from `.env` and environment variables.
- **Key Attributes**:
  - `ais_api_key`, `ais_base_url`: Credentials for the AIS provider.
  - `copernicus_username`, `copernicus_password`: Credentials for Copernicus Marine ocean data.
  - `drift_backward_hours` (default: 24), `drift_timestep_minutes` (default: 15), `drift_num_particles` (default: 500).
  - `weight_spatial` (30), `weight_temporal` (25), `weight_trajectory` (20), `weight_behaviour` (15), `weight_vessel_relevance` (10).
- **Key Properties**:
  - `attribution_weights`: Automatically normalizes integer weights into fractional multipliers summing to 1.0.

### `backend/app/core/logging.py`
- **Purpose**: Provides unified structured logging across the entire system.
- **Format**: `YYYY-MM-DD HH:MM:SS │ LEVEL │ MODULE │ MESSAGE` for clear CLI debugging.

---

## 5. Data Models (Pydantic Schemas)

### `backend/app/models/spill.py`
- **`GeoJSONGeometry`**: Generic GeoJSON-compatible geometry (`type: "Polygon" | "LineString" | "Point"`, `coordinates: [...]`).
- **`SpillCentroid`**: Geographic center `(latitude, longitude)`.
- **`SpillDetection`**: Standard output contract from the ML model containing `spill_detected`, `confidence`, `area_km2`, `centroid`, `geometry`, and `observation_time`.
- **`SpillSummary`**: Condensed spill info included in investigation responses.

### `backend/app/models/drift.py`
- **`DriftOrigin`**: Estimated spill origin with `latitude`, `longitude`, `confidence`, and `geometry` (origin probability polygon zone).
- **`DriftTimeWindow`**: `start` and `end` timestamps for when the discharge occurred.
- **`DriftTrajectory`**: Sequential points `[[lon, lat], ...]` and timestamps representing simulated path.
- **`DriftResult`**: Composite model containing `origin`, `origin_time_window`, `backward_trajectory`, and optional `forward_trajectory`.

### `backend/app/models/vessel.py`
- **`VesselPosition`**: Single AIS report (`timestamp`, `latitude`, `longitude`, `speed`, `heading`, `course`).
- **`VesselTrack`**: Reconstructed historical vessel track (`mmsi`, `name`, `vessel_type`, `imo`, `flag`, `positions`, `trajectory`).
- **`FeatureScores`**: 5 feature scores (each 0–100): `spatial`, `temporal`, `trajectory`, `behaviour`, `vessel_relevance`.
- **`VesselAttribution`**: Final output for a vessel (`rank`, `vessel_name`, `mmsi`, `score`, `confidence`, `feature_scores`, `reasons`, `investigative_priority`, `trajectory`).

### `backend/app/models/investigation.py`
- **`InvestigationRequest`**: User request (`image`, `observation_time`, optional `backward_hours`, `forward_hours`).
- **`InvestigationResponse`**: Master response containing `investigation_id`, `status`, `observation_time`, `spill`, `drift`, `vessels`, `pipeline_duration_seconds`, `is_demo`, and legal disclaimer.

---

## 6. API Layer & Route Handlers

### `backend/app/main.py`
- Initializes FastAPI app with application lifespan hooks (`@asynccontextmanager`).
- Configures CORS for `http://localhost:5173`, `http://localhost:3000`, and wildcards.
- Mounts routers: `health_router`, `investigation_router`, `drift_router`, `vessels_router`.

### `backend/app/api/routes/health.py`
- `GET /ping`: Fast, lightweight healthcheck endpoint returning `{"status": "ok"}`.

### `backend/app/api/routes/investigation.py`
- `POST /investigate`: Executes the live 4-stage pipeline: ML Detection → Drift Simulation → AIS Reconstruction → Attribution Scoring. Persists results to DB.
- `POST /demo/investigation`: Runs the Arabian Sea synthetic scenario with mock services for reliable, offline hackathon presentations.
- `GET /investigations`: Returns recent investigations from database.
- `GET /investigation/{investigation_id}`: Retrieves past investigation by ID.

### `backend/app/api/routes/drift.py`
- `POST /drift/backward`: Standalone backward simulation endpoint.
- `POST /drift/forward`: Standalone forward forecast endpoint.

### `backend/app/api/routes/vessels.py`
- `GET /vessels/search`: Queries AIS vessels by bounding box `(min_lat, min_lon, max_lat, max_lon)` and time range.
- `GET /vessels/{mmsi}`: Queries single vessel track by MMSI.

---

## 7. Drift Simulation Engine

### `backend/drift/opendrift_runner.py`
- Wraps the official [OpenDrift](https://github.com/OpenDrift/opendrift) `OceanDrift` model.
- Sets up readers (NetCDF ocean currents and wind grids).
- Seeds particle elements inside the observed spill polygon.
- Inverts time step (`timedelta(minutes=-15)`) for backward tracking.
- If OpenDrift native libraries are not installed, safely flags `OPENDRIFT_AVAILABLE = False` so the service gracefully falls back to the geometric particle ensemble.

### `backend/drift/backtracking.py`
- **Particle Ensemble Algorithm**:
  1. Generates 50+ particles distributed across the detected spill boundary.
  2. Integrates displacement backwards against ocean current vectors:
     $$\Delta x = -u \cdot \Delta t + \mathcal{N}(0, \sigma^2)$$
     $$\Delta y = -v \cdot \Delta t + \mathcal{N}(0, \sigma^2)$$
  3. Computes the **Origin Probability Zone**: Constructs a convex hull around the dispersed particle end positions buffered by $0.02^\circ$ ($\approx 2.2\text{ km}$).
  4. Computes centroid as estimated spill origin coordinates.
  5. Computes origin time window ($T - \text{backward\_hours}$ to $T - (\text{backward\_hours} - 6\text{h})$).

### `backend/drift/forecasting.py`
- Predicts forward trajectory from current spill position for the next 24 hours in positive time increments.

---

## 8. AIS Integration & 3-Stage Filtering

### `backend/ais/client.py`
- **`AISClientInterface`**: Abstract protocol for historical vessel track providers.
- **`MockAISClient`**: Generates 17 realistic synthetic vessels across the Arabian Sea (off Mumbai/Gujarat coast), including tankers, cargo ships, fishing vessels, and container ships. One vessel (`MV Ocean Star`) is given an anomaly signature (speed reduction + heading deviation).
- **`DatalasticClient`**: Live integration with Datalastic REST API `/inradius_history` endpoint.

### `backend/ais/filtering.py`
- **Stage 1 (Spatial Filter)**: Filters vessels that never entered within $50\text{ km}$ of the origin zone.
- **Stage 2 (Temporal Filter)**: Filters vessels that were not present in the area during the estimated spill origin window ($\pm 2\text{ hours}$).
- **Stage 3 (Trajectory Filter)**: Filters vessels whose closest track distance to the origin zone exceeded $30\text{ km}$.
- *Result*: Drops noise from 17+ vessels down to 3–6 relevant candidate vessels.

### `backend/ais/trajectory.py`
- **`interpolate_positions()`**: Fills gaps in sparse AIS tracks using linear interpolation.
- **`compute_speed_changes()` & `compute_heading_changes()`**: Detects abrupt maneuvering.
- **`detect_stops()`**: Identifies intervals where speed dropped below 1 knot for $\ge 15$ minutes.
- **`compute_loitering_score()`**: Measures the fraction of track time spent lingering within $10\text{ km}$ of the origin.

---

## 9. Explainable Attribution Engine

### `backend/attribution/features.py`
Computes 5 normalized scores ($0 \dots 100$):

1. **Spatial Score ($S_{\text{spatial}}$)**:
   Uses exponential geodesic distance decay:
   $$S_{\text{spatial}} = 100 \cdot \exp\left(-\frac{d_{\min}}{10\text{ km}}\right)$$
   Where $d_{\min}$ is the geodesic distance (in km) calculated via WGS-84 ellipsoid.

2. **Temporal Score ($S_{\text{temporal}}$)**:
   - If vessel was inside the origin window: $S = 70 + 30 \cdot (\text{fraction of track in window})$.
   - If vessel was outside: Gaussian decay $S = 100 \cdot \exp\left(-0.5 \cdot \left(\frac{\Delta t}{3\text{ hours}}\right)^2\right)$.

3. **Trajectory Score ($S_{\text{trajectory}}$)**:
   Combines distance proximity ($40\%$), origin loitering ($30\%$), and direct origin zone intersection ($30\%$).

4. **Behaviour Anomaly Score ($S_{\text{behaviour}}$)**:
   Scores investigative signals: speed standard deviation ($\sigma_v / \mu_v$), sudden speed changes ($>5\text{ kn}$), erratic headings ($>15^\circ$), and stopped intervals near the origin.

5. **Vessel Relevance Score ($S_{\text{relevance}}$)**:
   Lookup table based on risk profile (Oil Tanker: 95, Chemical Tanker: 90, Cargo: 50, Fishing: 25, Yacht: 15). Weight is capped at $10\%$ so vessel type alone can never make a ship the top suspect.

### `backend/attribution/scoring.py`
- **Composite Score**:
  $$\text{Score} = 0.30 \cdot S_{\text{spatial}} + 0.25 \cdot S_{\text{temporal}} + 0.20 \cdot S_{\text{trajectory}} + 0.15 \cdot S_{\text{behaviour}} + 0.10 \cdot S_{\text{relevance}}$$
- **Reason Generator**: Synthesizes human-readable explanations (e.g., *"Passed within 2.3 km of estimated origin"*, *"Sudden speed change of 7.1 knots detected"*).
- **Priority**: $\ge 80 \to \text{HIGH}$, $50\text{--}79 \to \text{MEDIUM}$, $<50 \to \text{LOW}$.

### `backend/attribution/ranking.py`
- Sorts candidate vessels in descending order of composite score and assigns ranks ($1 \dots N$).

---

## 10. Database Repository Layer

### `backend/app/db/repository.py`
- **`InvestigationRepository`**: Abstract CRUD contract (`save`, `get`, `list_recent`).
- **`SQLiteInvestigationRepository`**: Production SQLite implementation. Stores complete GeoJSON investigation documents in a `data_json` column while indexing key searchable metadata columns (`id`, `created_at`, `status`, `spill_confidence`, `origin_lat`, `origin_lon`, `top_vessel_name`, `top_vessel_score`).
- **Extensibility**: Compatible with PostgreSQL + PostGIS by swapping the repository implementation.

---

## 11. Utilities (Geodesic Math & Time)

### `backend/app/utils/geo.py`
- **`geodesic_distance_km()`**: Accurate WGS-84 ellipsoidal distance using `pyproj.Geod` (avoids crude Euclidean lat/lon subtraction).
- **`point_to_polygon_distance_km()`**: Computes shortest geodesic distance from a point to a polygon boundary.
- **`line_to_polygon_min_distance_km()`**: Computes minimum distance between a LineString trajectory and a polygon.
- **`polygon_from_points()`**: Builds buffered convex hull GeoJSON polygons from point ensembles.
- **`bearing()`**: Computes forward azimuth ($0^\circ \dots 360^\circ$).

### `backend/app/utils/time.py`
- Handles ISO-8601 parsing, UTC timezones, time window expansion, and human-readable duration formatting.

---

## 12. Frontend Dashboard (React + TypeScript + Leaflet)

### `frontend/src/App.tsx`
- Manages top-level application state (`investigation`, `loading`, `selectedVessel`, `error`).
- Orchestrates switching between the **Upload / Launch Panel** and the active **Investigation Dashboard**.

### `frontend/src/components/InvestigationMap.tsx`
- Interactive Leaflet map styled with CARTO Dark tiles.
- **Layers Rendered**:
  - 🔴 Oil Spill: Red dashed polygon with area popup.
  - 🟡 Origin Zone: Amber polygon & marker showing estimated spill source.
  - 🔵 Backward Drift: Blue dashed line showing reverse trajectory.
  - 🟢 Forward Drift: Green dashed line showing predicted future spread.
  - 🚢 Vessel Trajectories: Polyline tracks color-coded by attribution rank (🥇 Red, 🥈 Orange, 🥉 Cyan).
- Clicking any vessel track highlights it, expands its attribution breakdown in the sidebar, and opens an info popup.

### `frontend/src/components/InvestigationPanel.tsx`
- **Header Stats Grid**: Spill Confidence, Spill Area ($\text{km}^2$), Origin Confidence, Candidate Count.
- **Ranked Vessel Cards**: Expandable cards showing composite score ($0\text{--}100$), Priority badge, 5 individual score bars (Spatial, Temporal, Trajectory, Behaviour, Relevance), and bulleted investigative reasons.
- **Disclaimer Banner**: Clear legal note that results represent investigative priority, not legal accusations.

### `frontend/src/index.css`
- Custom dark maritime design system with glassmorphic cards, CSS gradients, glowing accent borders, and responsive mobile/desktop layouts.

---

## 13. Tests & Verification

The test suite in `backend/tests/` provides $100\%$ automated coverage of core logic:
- `test_ml_client.py`: Verifies `MockMLClient` returns valid `SpillDetection` with polygon coordinates.
- `test_drift.py`: Verifies backward origin estimation and forward trajectory generation.
- `test_ais.py`: Verifies 17-vessel generation and 3-stage candidate reduction.
- `test_attribution.py`: Verifies 5-dimension scoring algorithms, weights, and ranking.
- `test_api.py`: Tests `/ping`, `/investigate`, `/demo/investigation`, and `/drift/backward` with `httpx.AsyncClient`.

Run tests:
```bash
cd backend && source venv/bin/activate && python -m pytest tests/ -v
```

---

## 14. Configuration & Infrastructure

- **`.env.example`**: Complete template for all keys (`AIS_API_KEY`, `COPERNICUS_USERNAME`, drift parameters, attribution weights).
- **`backend/Dockerfile`**: Optimized Python 3.11 image with `libgeos-dev`, `libproj-dev`, `curl`, and built-in Docker `HEALTHCHECK`.
- **`frontend/Dockerfile`**: Node 20 development & production container.
- **`docker-compose.yml`**: Defines `backend`, `frontend`, and `postgres` (PostGIS 16) services.

---

## 15. How Two Developers Collaborate (ML ↔ Backend Contract)

The system is designed so both developers can work independently until Day 4 integration:

```
+------------------------------------+    +------------------------------------+
|        PERSON 1: ML DEVELOPER      |    |      PERSON 2: SYSTEM DEVELOPER    |
|                                    |    |                                    |
| • Sentinel-1 SAR imagery ingestion |    | • FastAPI backend & data models    |
| • U-Net segmentation               |    | • OpenDrift backward simulation    |
| • XGBoost verification             |    | • AIS integration & filtering      |
| • Outputs ONE clean JSON           |    | • 5-dimension attribution engine   |
|   matching SpillDetection schema   |    | • React + Leaflet map dashboard    |
+------------------------------------+    +------------------------------------+
                   \                                /
                    \                              /
                     v                            v
               +----------------------------------------+
               |         INTEGRATION POINT              |
               |                                        |
               | In backend/app/services/ml_client.py:  |
               | Replace MockMLClient with RealMLClient |
               | calling Person 1's detect_oil() func   |
               +----------------------------------------+
```

When the ML model is ready, Person 1 provides a single function:
```python
def detect_oil(image_path: str) -> dict:
    return {
        "spill_detected": True,
        "confidence": 0.92,
        "area_km2": 18.4,
        "centroid": {"latitude": 18.721, "longitude": 72.914},
        "geometry": {"type": "Polygon", "coordinates": [[[...]]]},
        "observation_time": "2026-08-25T10:30:00Z"
    }
```
Plugging this into `ml_client.py` connects the entire real-time pipeline with zero backend refactoring required.
