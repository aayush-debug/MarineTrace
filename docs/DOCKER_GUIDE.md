# SlickTrace — Docker Deployment & Hosting Guide

This guide explains how to build, run, test, and host the **SlickTrace Backend** (and the full stack) using Docker and Docker Compose.

---

## 1. Prerequisites

To run Docker on your machine:
- **macOS / Windows**: Install [Docker Desktop](https://www.docker.com/products/docker-desktop/) (or [OrbStack](https://orbstack.dev/) on macOS for faster, lightweight container management).
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

## 2. Project Docker Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                    Docker Host Environment                   │
│                                                              │
│  ┌─────────────────────────┐      ┌────────────────────────┐ │
│  │   slicktrace-backend    │      │  slicktrace-frontend   │ │
│  │   (FastAPI + Uvicorn)   │◄────►│    (Vite + React TS)   │ │
│  │   Port: 8000            │      │    Port: 5173          │ │
│  └────────────┬────────────┘      └────────────────────────┘ │
│               │                                              │
│               ▼                                              │
│  ┌─────────────────────────┐                                 │
│  │   slicktrace-postgres   │                                 │
│  │   (PostGIS 16-3.4)      │                                 │
│  │   Port: 5432 (Internal) │                                 │
│  └─────────────────────────┘                                 │
└──────────────────────────────────────────────────────────────┘
```

---

## 3. Method A: Run Only the Backend Container

If you want to host and run **only the backend** inside a container:

### Step 1: Configure Environment Variables
Ensure `.env` exists at the root of the project:
```bash
cp .env.example .env
```
Edit `.env` with your desired configuration (or leave defaults for mock/demo mode).

### Step 2: Build the Backend Docker Image
Navigate to the root directory and build the backend image:
```bash
docker build -t slicktrace-backend -f backend/Dockerfile backend/
```
*What this does:*
1. Uses `python:3.11-slim` as the base image.
2. Installs required system libraries (`libgeos-dev`, `libproj-dev`, `gcc`, `curl`) needed for geospatial calculations.
3. Installs Python packages from `backend/requirements.txt`.
4. Copies the backend application code into `/app`.
5. Sets up a healthcheck testing `GET /ping`.

### Step 3: Run the Container
```bash
docker run -d \
  --name slicktrace-api \
  -p 8000:8000 \
  --env-file .env \
  --restart unless-stopped \
  slicktrace-backend
```

### Step 4: Verify the Backend is Running
1. **Health check**:
   ```bash
   curl http://localhost:8000/ping
   # Output: {"status":"ok"}
   ```
2. **Interactive API Documentation (Swagger)**:
   Open [http://localhost:8000/docs](http://localhost:8000/docs) in your browser.
3. **Run Demo Investigation**:
   ```bash
   curl -X POST http://localhost:8000/demo/investigation
   ```

---

## 4. Method B: Run Full Stack with Docker Compose (Recommended)

Docker Compose starts the backend, frontend, and PostGIS database with a single command.

### Step 1: Start All Services
From the project root:
```bash
docker compose up --build -d
```

### Step 2: Check Running Services
```bash
docker compose ps
```
You will see:
- `backend` running on `http://localhost:8000`
- `frontend` running on `http://localhost:5173`
- `postgres` running on `localhost:5432`

### Step 3: View Real-Time Logs
```bash
# View all logs
docker compose logs -f

# View only backend logs
docker compose logs -f backend
```

### Step 4: Stop All Services
```bash
docker compose down
```
To also remove database volumes:
```bash
docker compose down -v
```

---

## 5. Cloud Hosting Options

Here is how you can deploy the Docker container to various cloud providers:

### Option 1: Render (Easiest / Free Tier Available)
1. Push your repository to GitHub.
2. Log in to [Render](https://render.com/).
3. Click **New +** → **Web Service**.
4. Connect your GitHub repository.
5. Choose **Docker** environment.
6. Set:
   - **Docker Context**: `backend`
   - **Dockerfile Path**: `backend/Dockerfile`
7. Add Environment Variables under the "Environment" tab (copy from `.env.example`).
8. Click **Deploy Web Service**.

### Option 2: Fly.io
1. Install Fly CLI: `brew install flyctl` or `curl -L https://fly.io/install.sh | sh`
2. Run in `backend/`:
   ```bash
   fly launch --dockerfile Dockerfile
   fly deploy
   ```

### Option 3: AWS EC2 or DigitalOcean Droplet
1. Create an Ubuntu VM on AWS / DigitalOcean / Linode.
2. SSH into your server:
   ```bash
   ssh root@your_server_ip
   ```
3. Install Docker:
   ```bash
   curl -fsSL https://get.docker.com -o get-docker.sh && sh get-docker.sh
   ```
4. Clone your repository:
   ```bash
   git clone <your-repo-url> slicktrace
   cd slicktrace
   cp .env.example .env
   ```
5. Run with Docker Compose:
   ```bash
   docker compose up -d --build
   ```

### Option 4: Google Cloud Run
1. Build and push image to Google Artifact Registry:
   ```bash
   gcloud builds submit --tag gcr.io/YOUR_PROJECT_ID/slicktrace-backend backend/
   ```
2. Deploy to Cloud Run:
   ```bash
   gcloud run deploy slicktrace-backend \
     --image gcr.io/YOUR_PROJECT_ID/slicktrace-backend \
     --platform managed \
     --allow-unauthenticated \
     --port 8000
   ```

---

## 6. Docker Management & Debugging Cheat Sheet

| Action | Command |
|--------|---------|
| **View running containers** | `docker ps` |
| **View all containers** | `docker ps -a` |
| **View backend logs** | `docker logs -f slicktrace-api` |
| **Open shell inside container** | `docker exec -it slicktrace-api /bin/bash` |
| **Run CLI demo inside container** | `docker exec -it slicktrace-api python ../run_demo.py` |
| **Restart container** | `docker restart slicktrace-api` |
| **Stop container** | `docker stop slicktrace-api` |
| **Remove container** | `docker rm -f slicktrace-api` |
| **Clean up unused images/containers** | `docker system prune -f` |
