# MarineTrace ML Baseline Model (V1)

## Executive Summary
This document establishes the architecture, training hyperparameters, radiometric normalization bounds, and evaluation specifications for the **MarineTrace V1 Production Model** (`ml/checkpoints/best_model.pth`).

---

## 1. Model Architecture
- **Framework**: PyTorch (`torch 2.13.0`, `segmentation_models_pytorch 0.5.0`)
- **Network**: U-Net (`smp.Unet`)
- **Backbone / Encoder**: ResNet-34 (`resnet34`, pre-trained on ImageNet)
- **Input Channels**: 2 (Channel 0: Sentinel-1 VV Sigma0 dB, Channel 1: Sentinel-1 VH Sigma0 dB)
- **Output Classes**: 1 (Binary segmentation: Oil Spill vs Sea/Background)
- **Activation**: Linear/Raw Logits in network definition. Sigmoid activation $\sigma(z) = \frac{1}{1 + e^{-z}}$ applied at inference and thresholding time.
- **Parameter Count**:
  - Total Parameters: **24,452,287** (~24.4M)
  - Trainable Parameters: **24,452,287**
  - Model File Size: ~97.9 MB (State dict + hyperparameter configuration dict)

---

## 2. Radiometric Preprocessing & Normalization
The input to the pipeline consists of calibrated Sentinel-1 Level-1 GRD SAR imagery in decibels (dB):
- **Sigma0 Radiometric Scale**: Decibels ($dB = 10 \cdot \log_{10}(\sigma^0_{linear})$)
- **Handling Invalid / No-Data**: NaNs, Infs, and nodata pixels replaced with floor value of `-35.0 dB`.
- **Normalization**: Per-channel Min-Max normalization to range $[0.0, 1.0]$:
  - **VV Channel**: Min = `-30.0 dB`, Max = `0.0 dB`
  - **VH Channel**: Min = `-35.0 dB`, Max = `-5.0 dB`
  - Normalized formula: $x_{norm} = \text{clip}\left(\frac{x - v_{min}}{v_{max} - v_{min}}, 0.0, 1.0\right)$

---

## 3. Tiling & Inference Pipeline
- **Training Patch Size**: $256 \times 256$ pixels
- **Inference Tiling**: Sliding window with tile size $256 \times 256$ and overlap $64$ pixels (stride $= 192$ pixels).
- **Overlapping Blending**: Overlapping tile probabilities are accumulated and normalized by overlapping patch count to eliminate edge artifacts.
- **Candidate Polygon Extraction**:
  - Default Probability Threshold: `0.35`
  - Minimum Candidate Area: `100` pixels
  - Connected component labeling with 8-connectivity (`skimage.measure.label`)
  - Topological contour tracing into GeoJSON polygons with geospatial coordinate transformation.
  - Candidate metrics computed: pixel area, area in $km^2$, centroid, perimeter, compactness, aspect ratio, mean/min backscatter.

---

## 4. Training Hyperparameters
- **Loss Function**: `CombinedLoss` ($0.5 \times \text{BCEWithLogitsLoss} + 0.5 \times \text{DiceLoss}$, smoothing factor $\epsilon = 1.0$)
- **Optimizer**: `AdamW` (learning rate $\eta = 10^{-4}$, weight decay $\lambda = 10^{-4}$)
- **Learning Rate Scheduler**: `CosineAnnealingLR` ($T_{max} = 50$, $\eta_{min} = 10^{-6}$)
- **Batch Size**: 8
- **Early Stopping**: Patience = 10 epochs monitoring `val_dice` with minimum delta $\delta = 10^{-4}$.
- **Data Augmentations**:
  - Horizontal Flip ($p=0.5$)
  - Vertical Flip ($p=0.5$)
  - Random Rotate 90° ($p=0.5$)
  - Affine transform: scale $[0.95, 1.05]$, translate $[-5\%, +5\%]$, rotate $[-10^\circ, +10^\circ]$ ($p=0.3$)
  - Gaussian Radiometric Noise ($p=0.2$)

---

## 5. Artifact Files
- Checkpoint: `ml/checkpoints/best_model.pth`
- Config: `ml/experiments/baseline_v1/config.json`
- Metrics on Held-Out Test Set: `ml/experiments/baseline_v1/metrics.json`
