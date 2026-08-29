# 🚀 MarineTrace Production Cloud Deployment Guide

This guide walks you through deploying the **MarineTrace Frontend to Vercel** and connecting it to the **MarineTrace Backend & ML Engine**.

---

## 🏗️ Architecture in Production

```
┌───────────────────────────────────────────────┐
│              User / Web Browser               │
└───────────────────────┬───────────────────────┘
                        │
         ┌──────────────┴──────────────┐
         │                             │
         ▼                             ▼
┌──────────────────┐          ┌──────────────────┐
│  React Frontend  │          │ FastAPI Backend  │
│    on VERCEL     │─────────►│  on RENDER / VM  │
│  (Global Edge)   │          │ (Docker Runtime) │
└──────────────────┘          └──────────────────┘
```

---

## 🌟 Part 1: Deploy Frontend to Vercel (2 Minutes)

### Method A: Via Vercel Web Dashboard (Recommended)

1. Go to [vercel.com](https://vercel.com) and log in with your GitHub account.
2. Click **"Add New..."** $\to$ **"Project"**.
3. Import your **`aayush-debug/MarineTrace`** repository.
4. In the **Configure Project** screen:
   - **Framework Preset**: `Vite`
   - **Root Directory**: Click `Edit` and select **`frontend`**
   - **Build Command**: `npm run build` (or leave default)
   - **Output Directory**: `dist`
5. **Environment Variables**:
   - Name: `VITE_API_URL`
   - Value: `https://your-backend-api.onrender.com` (or your backend public URL)
6. Click **Deploy**! 🚀

---

### Method B: Via Vercel CLI

Run from the project root:

```bash
cd frontend
npx vercel
```

Follow the interactive prompts:
- Set up and deploy: **Y**
- Link to existing project: **N**
- Project name: `marinetrace`
- Directory location: `./`
- Want to modify settings: **N**

For production deployment:
```bash
npx vercel --prod
```

---

## 🛰️ Part 2: Deploy Backend Docker Container (Free on Render / Railway)

Because MarineTrace uses **OpenDrift Lagrangian ocean modeling**, **NetCDF4**, **GEOS/PROJ C libraries**, and **PyTorch**, the backend runs inside a persistent Docker container.

### Deploy Backend to Render (Free Tier):

1. Go to [render.com](https://render.com) and click **"New +"** $\to$ **"Web Service"**.
2. Connect your GitHub repository **`MarineTrace`**.
3. Select **Docker** as the Environment.
4. Settings:
   - **Docker Context**: `.` (or `backend`)
   - **Dockerfile Path**: `backend/Dockerfile`
   - **Instance Type**: Free or Starter
5. Under **Environment Variables**, add:
   - `USE_REAL_ML` = `true`
   - `AIS_API_KEY` = `d23f615198ebddbc0442eb17eb7962faeecc961b`
   - `COPERNICUS_USERNAME` = `SIH`
   - `COPERNICUS_PASSWORD` = `Sihteam@2026`
6. Click **Create Web Service**.
7. Copy your Render backend URL (e.g., `https://marinetrace-api.onrender.com`).
8. Paste that URL into your Vercel project's `VITE_API_URL` environment variable!

---

## 🔄 Updating Deployments

Whenever you push to `main` on GitHub:
- **Vercel** will automatically rebuild and deploy your frontend.
- **Render / Railway** will automatically rebuild and redeploy your backend Docker container.
