# MarineTrace — Docker Deployment & Hosting Guide

This guide explains how to build, run, test, and host the **MarineTrace Platform** (FastAPI backend, React frontend, OpenDrift simulation engine, and ML pipeline) using Docker and Docker Compose.

---

## 1. Prerequisites

To run Docker on your machine:
- **macOS / Windows**: Install [Docker Desktop](https://www.docker.com/products/docker-desktop/) (or [OrbStack](https://orbstack.dev/) on macOS).
- **Linux (Ubuntu/Debian)**:
  ```bash
  sudo apt update
  sudo apt install -y docker.io docker-compose-plugin
  sudo systemctl enable --now docker
  sudo usermod -aG docker $USER
  ```
- Verify installation:
  ```bash
  docker --version
  docker compose version
  ```

---

## 2. Full-Stack Docker Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                    Docker Host Environment                   │
│                                                              │
│  ┌─────────────────────────┐      ┌────────────────────────┐ │
│  │   marinetrace-backend    │      │  marinetrace-frontend   │ │
│  │   (FastAPI + OpenDrift  │◄────►│   (React 19 + Vite +   │ │
│  │    + PyTorch + Uvicorn) │      │    Tailwind + Leaflet) │ │
│  │   Port: 8000            │      │   Port: 5173           │ │
│  └────────────┬────────────┘      └────────────────────────┘ │
│               │                                              │
│               ▼                                              │
│  ┌─────────────────────────┐                                 │
│  │     marinetrace_db      │                                 │
│  │   (Persistent SQLite    │                                 │
│  │    Docker Named Volume) │                                 │
│  └─────────────────────────┘                                 │
└──────────────────────────────────────────────────────────────┘
```

---

## 3. Quick Start (1-Click)

Run the automated startup script from the project root:

```bash
./docker-start.sh
```

Or run Docker Compose directly:

```bash
docker compose up --build -d
```

### Access URLs:
- 💻 **Frontend Web App**: [http://localhost:5173](http://localhost:5173)
- 🛰️ **FastAPI Backend**: [http://localhost:8000](http://localhost:8000)
- 📖 **Interactive Swagger Docs**: [http://localhost:8000/docs](http://localhost:8000/docs)
- 🩺 **Health Check**: [http://localhost:8000/ping](http://localhost:8000/ping)

---

## 4. Docker Management Commands

| Action | Command |
|--------|---------|
| **Start full stack in background** | `docker compose up --build -d` |
| **View real-time logs (all services)** | `docker compose logs -f` |
| **View backend logs only** | `docker compose logs -f backend` |
| **View frontend logs only** | `docker compose logs -f frontend` |
| **Check container status & health** | `docker compose ps` |
| **Run unit & integration tests** | `docker compose exec backend pytest tests/` |
| **Run CLI investigation demo** | `docker compose exec backend python run_demo.py` |
| **Open a shell inside backend** | `docker compose exec -it backend /bin/bash` |
| **Stop all services** | `docker compose down` |
| **Stop and clean database volume** | `docker compose down -v` |

---

## 5. Live Development & Hot Reloading

When running with Docker Compose:
- **Backend changes**: Any edits in `./backend` or `./ml` are instantly reflected inside the container.
- **Frontend changes**: Any edits in `./frontend/src` or `./frontend/public` are instantly hot-reloaded via Vite's file watcher (`usePolling: true`).

---

## 6. Cloud Deployment

### Option 1: Render / Railway
1. Push repository to GitHub.
2. Select **Docker Compose** or create two services:
   - **Backend**: Dockerfile `./backend/Dockerfile`, Port `8000`.
   - **Frontend**: Dockerfile `./frontend/Dockerfile`, Port `5173`, with `VITE_API_URL` set to the backend public URL.

### Option 2: AWS EC2 / DigitalOcean Droplet
1. Launch an Ubuntu Linux VM.
2. Clone repository & copy `.env`:
   ```bash
   git clone <repo-url> marinetrace
   cd marinetrace
   cp .env.example .env
   ```
3. Run:
   ```bash
   docker compose up --build -d
   ```
