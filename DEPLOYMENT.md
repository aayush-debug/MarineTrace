# 🚀 MarineTrace — Quick Deployment Guide

This guide provides fast, actionable instructions for deploying the MarineTrace full-stack platform (FastAPI backend + PyTorch ML engine + React/Vite frontend) across local environments, cloud containers, and PaaS hosts.

---

## ⚡ 5-Minute Quick Deployment (Choose Your Path)

### Path A: Docker Compose (Recommended for Local & Cloud VPS/EC2)

Ensure Docker Desktop (macOS/Windows) or Docker Engine + Compose (Linux) is installed.

```bash
# 1. Clone repository and set configuration
git clone <repo-url> marinetrace
cd marinetrace
cp .env.example .env

# 2. Start all services in the background (Live Dev Mode)
docker compose up --build -d

# ── OR for Immutable Production Server Mode ──
# docker compose -f docker-compose.prod.yml up --build -d
```

#### Access Endpoints:
| Service | URL | Purpose |
| :--- | :--- | :--- |
| **Frontend Web App** | [`http://localhost:5173`](http://localhost:5173) (or `:80` in prod) | SpaceShift live GIS canvas & attribution portal |
| **FastAPI Backend** | [`http://localhost:8000`](http://localhost:8000) | Root REST orchestration engine |
| **Interactive API Docs** | [`http://localhost:8000/docs`](http://localhost:8000/docs) | Swagger UI interactive test harness |
| **Health Check Probe** | [`http://localhost:8000/ping`](http://localhost:8000/ping) | Liveness endpoint (returns `{"status":"ok"}`) |

---

### Path B: Cloud PaaS (Vercel Frontend + Render Backend)

#### 1. Backend Service on Render
1. Create a new **Web Service** on [Render](https://render.com) connected to your GitHub repo.
2. Configure settings:
   - **Runtime**: `Docker`
   - **Docker Context**: `.` *(root directory)*
   - **Dockerfile Path**: `backend/Dockerfile`
   - **Health Check Path**: `/ping`
3. Add Environment Variables in Render Dashboard:
   - `DATABASE_URL`: `sqlite:////app/db/marinetrace.db`
   - `USE_REAL_ML`: `true`
   - `CORS_ORIGINS`: `https://<your-frontend-subdomain>.vercel.app`
   - `AIS_API_KEY`: *(optional, mock fallback active if empty)*
   - `COPERNICUS_USERNAME` / `COPERNICUS_PASSWORD`: *(optional, cached physics fallback active)*
4. Under **Disks**, add a persistent disk mounted at `/app/db` (size: 1 GB) for database persistence.

#### 2. Frontend on Vercel
1. Import the same repository into [Vercel](https://vercel.com).
2. Configure build settings:
   - **Framework Preset**: `Vite`
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
3. Add Environment Variable:
   - `VITE_API_URL`: `https://<your-render-service>.onrender.com`
4. Click **Deploy**. SPA client routing is automatically handled via `frontend/vercel.json`.

---

### Path C: Standalone Docker Containers

Build and run isolated containers independently:

```bash
# 1. Build and run Backend (context must be repository root .)
docker build -f backend/Dockerfile -t marinetrace-backend .
docker run -d --name marinetrace-backend \
  -p 8000:8000 \
  -v marinetrace_db:/app/db \
  -e DATABASE_URL="sqlite:////app/db/marinetrace.db" \
  marinetrace-backend

# 2. Build and run Frontend (production Nginx static server)
docker build -f frontend/Dockerfile --target production -t marinetrace-frontend ./frontend
docker run -d --name marinetrace-frontend \
  -p 80:80 \
  marinetrace-frontend
```

---

## 🔑 Environment Variables Reference

| Variable | Default / Example | Required | Description |
| :--- | :--- | :---: | :--- |
| `PORT` | `8000` | Auto | Assigned dynamically by cloud hosts (Render/Heroku/Railway) |
| `BACKEND_HOST` | `0.0.0.0` | Yes | Network bind address |
| `CORS_ORIGINS` | `http://localhost:5173` | Yes | Comma-separated allowed frontend origins |
| `DATABASE_URL` | `sqlite:////app/db/marinetrace.db` | Yes | SQLite persistent volume path or PostgreSQL connection string |
| `USE_REAL_ML` | `true` | Yes | Toggles U-Net ResNet-34 inference vs mock fallback |
| `ML_MODEL_VERSION` | `v2` | No | Model version to load (`v2` or `v1`) |
| `ML_DEVICE` | `cpu` | No | Compute device (`cpu`, `cuda`, or auto-detect) |
| `AIS_PROVIDER` | `aisstream` | No | AIS provider (`aisstream`, `datalastic`, or mock) |
| `AIS_API_KEY` | `""` | No | API Key for live AIS stream |
| `COPERNICUS_USERNAME` | `""` | No | Copernicus Marine account username |
| `COPERNICUS_PASSWORD` | `""` | No | Copernicus Marine account password |
| `VITE_API_URL` | `http://localhost:8000` | Yes | Frontend variable pointing to backend HTTPS URL |

---

## 🧪 Operational Verification & Diagnostics

Once deployed, run these health checks:

```bash
# 1. Verify backend health probe
curl -f http://localhost:8000/ping
# Response: {"status":"ok"}

# 2. Run automated test suite inside container
docker compose exec backend pytest tests/

# 3. Execute standalone 4-tier CLI pipeline test
docker compose exec backend python run_demo.py
# (Or locally: python run_demo.py)

# 4. Inspect container logs
docker compose logs -f backend
docker compose logs -f frontend
```

---

## 🗄️ Database & Storage Management

- **SQLite Persistent Volume**: By default, SQLite stores data at `/app/db/marinetrace.db` inside the Docker named volume `marinetrace_db`. This persists across container restarts, builds, and redeployments.
- **Upgrading to PostgreSQL + PostGIS**: When scaling to clustered multi-region instances:
  1. Provision a managed PostgreSQL instance with PostGIS.
  2. Set `DATABASE_URL=postgresql+asyncpg://user:pass@host:5432/marinetrace`.
  3. No code changes required — the repository layer automatically adapts.

---

## 🔒 Security Best Practices Checklist

- [x] **No Secrets in Images**: Containers do not bake in API keys or passwords; configuration is injected via environment variables.
- [x] **Non-Root Execution**: Backend container runs under dedicated unprivileged `appuser` (UID 1000).
- [x] **Hardened Web Server**: Production frontend container runs on Nginx Alpine with `X-Frame-Options: SAMEORIGIN`, `X-Content-Type-Options: nosniff`, and aggressive asset caching.
- [x] **SSRF & Path Traversal Shields**: The FastAPI core blocks metadata loopback addresses and validates file paths before raster processing.
