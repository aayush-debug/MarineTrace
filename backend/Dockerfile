# ─────────────────────────────────────────────────────────────────
# MarineTrace Backend Dockerfile
# Python 3.11-slim + Geospatial / NetCDF / PyTorch CPU + OpenDrift
# Compatible with linux/amd64 and linux/arm64 (Apple Silicon)
# ─────────────────────────────────────────────────────────────────
FROM python:3.11-slim

WORKDIR /app

# Python runtime flags
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PYTHONPATH=/app:/ml

# System packages:
#   gcc / g++       — compile C/C++ extensions
#   libgeos-dev     — Shapely geometry operations
#   libproj-dev     — Pyproj / coordinate transforms
#   proj-bin        — PROJ command line tools & datum grid support
#   libnetcdf-dev   — NetCDF C libraries for hydrodynamic forcing
#   libhdf5-dev     — HDF5 storage
#   liblzma-dev     — XZ compression for roaring-landmask
#   libgdal-dev     — Geospatial raster / vector abstraction
#   curl            — Docker HEALTHCHECK
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    g++ \
    libgeos-dev \
    libproj-dev \
    proj-bin \
    libnetcdf-dev \
    libhdf5-dev \
    liblzma-dev \
    libgdal-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install PyTorch CPU first (compact layer, ~200MB vs multi-GB CUDA)
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir torch torchvision --index-url https://download.pytorch.org/whl/cpu

# Install backend dependencies & ML inference packages
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt && \
    pip install --no-cache-dir \
      segmentation-models-pytorch>=0.3.3 \
      rasterio>=1.3.0 \
      scikit-image>=0.21.0 \
      opencv-python-headless>=4.8.0 \
      tifffile>=2023.7.0 \
      albumentations>=1.3.0 \
      pyyaml>=6.0 \
      tqdm>=4.65.0

# Copy application source code
COPY . /app

# Create necessary runtime directories and configure non-root user
RUN mkdir -p /app/data/demo /app/data/copernicus /app/db /ml && \
    useradd -m -u 1000 appuser && \
    chown -R appuser:appuser /app /ml

USER appuser

EXPOSE 8000

# Healthcheck — FastAPI /ping route
HEALTHCHECK --interval=20s --timeout=5s --start-period=15s --retries=3 \
  CMD curl -f http://localhost:8000/ping || exit 1

# Production default command (overridable in docker-compose for dev mode)
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
