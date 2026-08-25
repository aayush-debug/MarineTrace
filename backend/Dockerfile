# ─────────────────────────────────────────────────────────────────
# MarineTrace Backend Dockerfile
# Python 3.11-slim + GEOS/PROJ for geospatial libraries
# Targets: linux/amd64, linux/arm64 (Apple Silicon)
# ─────────────────────────────────────────────────────────────────
FROM python:3.11-slim

WORKDIR /app

# Python runtime flags
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PYTHONPATH=/app

# System packages:
#   gcc         — compile C extensions (shapely wheels)
#   libgeos-dev — Shapely geometry operations
#   libproj-dev — Pyproj / coordinate transforms
#   curl        — Docker HEALTHCHECK
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    libgeos-dev \
    libproj-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies first (cached layer)
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copy all source code
COPY . .

# Ensure the data directory exists inside the image
RUN mkdir -p /app/data/demo

EXPOSE 8000

# Healthcheck — FastAPI /ping route
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:8000/ping || exit 1

# Production: no --reload
# Dev mode is controlled by docker-compose command override
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
