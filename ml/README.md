# MarineTrace — ML Pipeline for SAR Oil Spill Detection

> Automated marine oil-spill detection and segmentation from Sentinel-1 SAR imagery.

## Overview

This ML pipeline takes Sentinel-1 SAR imagery and determines:
1. Whether an oil spill is present
2. Where the suspected oil spill is located
3. What pixels belong to the spill
4. The confidence of the prediction
5. The geographic geometry of the detected spill
6. The approximate area and centroid
7. Candidate regions for downstream investigation

## Quick Start

### Installation

```bash
cd ml/
pip install -r requirements.txt
```

### Smoke Test (No Dataset Required)

```bash
python -m pytest tests/test_pipeline.py -v
```

### Training (Synthetic Data)

```bash
python training/train_unet.py --synthetic --epochs 5
```

### Training (Real Dataset)

1. Download the Zenodo dataset (see Dataset section below)
2. Extract to `data/raw/`
3. Run:

```bash
python training/train_unet.py --config config.yaml
```

### Evaluation

```bash
python evaluation/evaluate.py --checkpoint checkpoints/best_model.pth
```

### Inference

```bash
python inference/predict.py --image path/to/sentinel1.tif
python inference/predict.py --image path/to/sentinel1.tif --visualize
python inference/predict.py --image path/to/sentinel1.tif --threshold 0.4
```

### Python API

```python
from inference.api_interface import detect_oil

result = detect_oil("path/to/sentinel1_image.tif")
# Returns a JSON-serializable dictionary
```

### Mock Mode (For Backend Integration)

```python
from inference.api_interface import detect_oil_mock

result = detect_oil_mock()
# Returns mock result matching the API contract
```

---

## Dataset

### Selected Dataset

**Sentinel-1 SAR Oil Spill Image Dataset** (Trujillo-Acatitla et al., 2024)

| Property | Value |
|---|---|
| Satellite | Sentinel-1 |
| Polarization | VV + VH |
| Representation | Sigma0 in decibels (dB) |
| Image size | 2048 × 2048 × 2 |
| Mask format | Binary TIFF (1=oil, 0=background) |
| Total images | 3,020 (train/val/test) |
| Oil spill images | 1,350 |
| No-oil images | 835 |
| Look-alike images | 835 |
| Georeferenced | Yes (images only; masks are not georeferenced) |

### Download

| Part | Content | URL |
|---|---|---|
| Part I | 1,200 oil spill train/val images + masks | [Zenodo 8346860](https://zenodo.org/records/8346860) |
| Part II | 685 no-oil + 685 look-alike train/val images + masks | [Zenodo 8253899](https://zenodo.org/records/8253899) |
| Part III | 450 test images (150 each: oil, no-oil, look-alike) + masks | [Zenodo 13761290](https://zenodo.org/records/13761290) |

### Why This Dataset

1. **Native Sentinel-1** — matches our target satellite
2. **Dual polarization** (VV + VH) — matches our 2-channel input
3. **Already in Sigma0 dB** — well-defined, documented preprocessing
4. **Georeferenced** — enables geographic polygon extraction
5. **Look-alike samples** — enables better discrimination
6. **Peer-reviewed** — published in Marine Pollution Bulletin (2024)

### Related Paper

> Trujillo-Acatitla, R., et al. "Marine oil spill detection and segmentation in SAR data with two steps Deep Learning framework." *Marine Pollution Bulletin*, 204, 116549. DOI: [10.1016/j.marpolbul.2024.116549](https://doi.org/10.1016/j.marpolbul.2024.116549)

---

## Model

### Architecture

**U-Net** with **ResNet34** encoder (ImageNet pretrained), via `segmentation_models_pytorch`.

| Property | Value |
|---|---|
| Architecture | U-Net |
| Encoder | ResNet34 |
| Encoder weights | ImageNet (auto-adapted for 2-channel input) |
| Input | `[batch, 2, H, W]` — VV + VH channels |
| Output | `[batch, 1, H, W]` — oil probability logits |
| Image size | 256 × 256 (configurable) |
| Activation | None (raw logits for BCEWithLogitsLoss) |

### Why This Model

- No suitable pretrained Sentinel-1 oil-spill model exists for direct PyTorch use
- SMP handles encoder backbone adaptation to 2-channel SAR input automatically
- ImageNet pretrained features transfer well for low-level texture/edge detection
- U-Net is the standard baseline for segmentation — proven on SAR oil spill data

### Preprocessing

1. Invalid value handling (NaN, Inf, nodata → fill with -35 dB)
2. Min-max normalization per channel:
   - VV: [-30 dB, 0 dB] → [0, 1]
   - VH: [-35 dB, -5 dB] → [0, 1]
3. 2048×2048 images patched into 256×256 tiles

### Training Configuration

| Parameter | Value |
|---|---|
| Optimizer | AdamW |
| Learning rate | 1e-4 |
| Weight decay | 1e-4 |
| Epochs | 50 (with early stopping) |
| Batch size | 8 |
| Scheduler | CosineAnnealingLR |
| Loss | 0.5 × BCEWithLogitsLoss + 0.5 × DiceLoss |
| Early stopping | Patience 10 epochs |
| Data split | 70/15/15 (scene-level) |
| Seed | 42 |

### Data Augmentation

- Horizontal flip (p=0.5)
- Vertical flip (p=0.5)
- Random 90° rotation (p=0.5)
- Small shift/scale/rotate (p=0.3)
- Mild Gaussian noise (p=0.2)

---

## Output Format

The `detect_oil()` function returns a JSON-serializable dictionary:

```json
{
    "spill_detected": true,
    "confidence": 0.91,
    "observation_time": null,
    "image_path": "path/to/image.tif",
    "model_version": "marinetrace-unet-v1",
    "processing_time_seconds": 2.34,
    "spill": {
        "area_km2": 18.4,
        "centroid": {"latitude": 18.721, "longitude": 72.914},
        "geometry": {"type": "Polygon", "coordinates": [...]}
    },
    "candidates": [...],
    "metadata": {...},
    "limitations": [...]
}
```

See `mock_result.json` for the complete schema.

---

## Project Structure

```
ml/
├── config.yaml                 # Hyperparameters and paths
├── requirements.txt            # Python dependencies
├── mock_result.json            # Mock API response for backend
├── data/                       # Dataset (gitignored)
├── models/
│   └── unet.py                 # U-Net model (SMP + fallback)
├── preprocessing/
│   ├── sar_preprocessing.py    # SAR preprocessing pipeline
│   └── patch_dataset.py        # Patching and PyTorch Dataset
├── training/
│   ├── losses.py               # BCE + Dice combined loss
│   ├── augmentations.py        # SAR-appropriate augmentations
│   └── train_unet.py           # Training script
├── inference/
│   ├── predict.py              # CLI inference
│   └── api_interface.py        # detect_oil() API
├── features/
│   └── candidate_features.py   # Candidate extraction + GeoJSON
├── evaluation/
│   └── evaluate.py             # Metrics computation
├── visualization/
│   └── visualize.py            # 6-panel visualization
├── checkpoints/                # Saved model weights
├── results/                    # Output results
│   └── visualizations/         # Generated figures
└── tests/
    └── test_pipeline.py        # Smoke tests
```

---

## Integration Guide for Backend Developer

### Option 1: Direct Python Import

```python
import sys
sys.path.insert(0, "path/to/ml")

from inference.api_interface import detect_oil

result = detect_oil("/path/to/sentinel1_image.tif")
# result is a plain Python dictionary — JSON serializable
```

### Option 2: Mock Mode (Before Model is Ready)

```python
from inference.api_interface import detect_oil_mock

result = detect_oil_mock()
```

### Option 3: CLI

```bash
python ml/inference/predict.py --image /path/to/image.tif --output result.json
```

### Result Schema

The backend developer should only need to consume the dictionary returned by `detect_oil()`. No PyTorch, NumPy, or internal ML knowledge is required.

Key fields:
- `result["spill_detected"]` — bool
- `result["confidence"]` — float [0, 1]
- `result["spill"]["geometry"]` — GeoJSON Polygon
- `result["spill"]["area_km2"]` — float
- `result["spill"]["centroid"]` — {"latitude": float, "longitude": float}
- `result["candidates"]` — list of candidate dicts

---

## Evaluation Metrics

| Metric | Description |
|---|---|
| **Dice** | Primary — overlap between prediction and ground truth |
| **IoU** | Primary — intersection over union |
| **Precision** | Fraction of predicted oil pixels that are correct |
| **Recall** | Fraction of actual oil pixels that are detected |
| **F1** | Harmonic mean of precision and recall |
| **Pixel Accuracy** | Fraction of correctly classified pixels |
| **FPR** | False positive rate |
| **FNR** | False negative rate |

---

## Known Limitations

1. **No pre-trained weights included** — the model must be trained on the Zenodo dataset
2. **Look-alike handling is scene-level** — the dataset separates look-alike *scenes* but does not provide pixel-level look-alike labels within oil-spill scenes
3. **Georeferencing depends on input** — geographic coordinates require the input image to have CRS metadata
4. **Not validated on operational SAR products** — tested only on the Zenodo research dataset
5. **Model confidence ≠ certainty** — outputs are model probabilities, not ground truth
6. **Dark SAR ≠ oil** — low wind, biogenic slicks, rain cells, and other phenomena can produce false positives
7. **No vessel attribution** — this module only detects and segments oil spills; vessel attribution is handled by downstream modules

---

## OHW23 Repository Assessment

The [OHW23 Oil Spill project](https://github.com/oceanhackweek/ohw23_proj_oil) was evaluated and found **not suitable** as a foundation:
- Uses COSMO-SkyMed SAR (X-band), not Sentinel-1 (C-band)
- Only statistical thresholding — no ML model
- No trained weights or labelled masks
- Incomplete code with TODO placeholders
- The literature survey in its README was useful for references
