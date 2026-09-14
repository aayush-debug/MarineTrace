# MarineTrace ML Data Guide & Dataset Compatibility

## 1. Overview
This directory contains the dataset curation, preprocessing, metadata, and compatibility specifications for training, validating, and benchmarking the MarineTrace oil spill segmentation model.

---

## 2. Dataset Compatibility Evaluation Matrix

Six dataset sources were systematically evaluated against MarineTrace's sensor requirements (Sentinel-1 C-band SAR Level-1 GRD, dual-polarization $[VV, VH]$, Sigma0 in decibels, 32-bit float):

| Dataset Name | Source / DOI | Polarization | Format & Dims | Masks | Class Balance | Compatibility Status | Action / Recommendation |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **MarineCadastre AIS** | [AccessAIS](https://marinecadastre.gov/accessais/) | N/A (AIS Kinematics) | CSV / GeoPackage | None | N/A | `INCOMPATIBLE_SAR` | Exclude from segmentation; used for vessel attribution and drift back-tracking. |
| **Zenodo S-1 (M4D)** | [10.5281/zenodo.4672426](https://doi.org/10.5281/zenodo.4672426) | Pseudo-RGB (VV base) | PNG / JPEG (8-bit) | 5-class | ~60% oil, 40% lookalike | `SUBOPTIMAL` | Exclude from primary dual-pol training. Lacks raw 32-bit Sigma0 dB VH channel. |
| **DARTIS 2019** | [10.1594/PANGAEA.980773](https://doi.org/10.1594/PANGAEA.980773) | **VV ONLY** | GeoTIFF / Numpy (256/512) | Binary | 37% oil / 63% look-alike | `VV_ONLY` | Classify as `VV_ONLY`. **Do NOT fabricate VH channel**. Reserve look-alikes for false positive study. |
| **Refined Deep-SAR SOS** | [10.5281/zenodo.15298010](https://doi.org/10.5281/zenodo.15298010) | Single (VV or HH) | Grayscale PNG (8-bit) | Binary | ~85% oil (imbalanced) | `VV_ONLY_GRAYSCALE` | Exclude from dual-pol pipeline. Missing VH channel and 32-bit radiometric calibration. |
| **Sentinel-1 SAR Oil Spill** | [10.5281/zenodo.8346860](https://doi.org/10.5281/zenodo.8346860) | **Dual (VV + VH)** | Float32 GeoTIFF (2048x2048) | Binary | Part I: 1200 oil / Part II: 1370 no-oil | `COMPATIBLE_DUAL_POL` | **Primary Gold Standard**. Exactly matches MarineTrace $[VV, VH]$ 32-bit Sigma0 dB pipeline. |
| **OSLM Dataset** | [SARDEEP1/OSLM](https://github.com/SARDEEP1/OSLM) | S-1: VV / GF-3: VV+HH | TIFF (256x256) | Binary | 100% oil (0% lookalike) | `INCOMPATIBLE` | Exclude. S-1 lacks VH; no look-alike balance; hosted on proprietary Quark cloud. |

---

## 3. Strict VV/VH Compatibility Standard (Step 3)
1. **MarineTrace Architecture Contract**: The model architecture expects a 2-channel tensor of shape `[B, 2, H, W]` where:
   - `Channel 0`: Co-polarization $VV$ Sigma0 ($dB$)
   - `Channel 1`: Cross-polarization $VH$ Sigma0 ($dB$)
2. **Channel Duplication Prohibition**:
   - **Never duplicate $VV$ into $VH$**: $VV$ and $VH$ backscatter mechanisms are fundamentally distinct. In marine SAR, capillary surface Bragg scattering dominates co-polarization ($VV$), causing steep damping (~$7$ to $12\text{ dB}$) in oil slicks. Cross-polarization ($VH$) primarily senses volume scattering and depolarization, operating near the sensor noise floor (-$35$ to -$25\text{ dB}$).
   - Duplicating $VV$ into $VH$ artificially forces the network to learn false cross-channel correlations and destroys the physical discriminant power of the dual-polarization ratio ($VV / VH$ or $VV - VH\text{ dB}$).
   - Single-polarization datasets are strictly tagged `VV_ONLY` and quarantined from multi-channel models.

---

## 4. Dataset Quality & Quality Filtering Rules (Step 4)
Any sample failing any of the following criteria is automatically logged in `metadata/exclusions.json` and excluded:
1. **Header Corruption**: Unreadable TIFF/GeoTIFF format or mismatched dimensions.
2. **Invalid / No-Data Fraction**: Tiles with $>20\%$ nodata or NaN pixels.
3. **Polarization Mismatch**: Files missing either the $VV$ or $VH$ band in a dual-channel requirement.
4. **Annotation Noise**: Masks with unclosed contours or conflicting ground truth.
5. **Exact Duplicates**: Identical scene tiles with different timestamps or filenames.

---

## 5. Scene-Level Splitting & Leakage Prevention (Step 6)
To prevent severe data leakage:
- **Scene-Level Partitioning**: All $256 \times 256$ patches extracted from a common parent Sentinel-1 acquisition (or synthetic event scene) remain strictly within the **same** split (Train, Val, or Test).
- **Split Proportions**:
  - **Train**: 70% of scenes
  - **Validation**: 15% of scenes
  - **Test**: 15% of scenes
- **Image-Level Balance (Step 5)**: The dataset maintains an intentional ratio of **~60% oil spill scenes/patches** and **~40% look-alikes / no-oil scenes** (including ship wakes, low-wind dark patches, and biogenic slicks).

---

## 6. Directory Layout (Step 7)
```
ml/data/
├── raw/                      # Raw downloaded scenes / archives (git-ignored)
├── processed/                # Normalized, quality-filtered, tiled patches
│   ├── train/
│   │   ├── images/           # [2, 256, 256] Float32 TIFFs (VV, VH)
│   │   └── masks/            # [256, 256] Float32 TIFFs (0 or 1)
│   ├── val/
│   │   ├── images/
│   │   └── masks/
│   └── test/
│       ├── images/
│       └── masks/
├── metadata/
│   ├── datasets.csv          # Catalog of evaluated data sources
│   ├── samples.csv           # Full inventory with scene ID, split, oil_fraction, lookalike flag
│   └── exclusions.json       # Record of excluded/flagged samples with reasons
├── test_synthetic/           # Verified fixture samples for smoke and pipeline unit tests
├── dataset_compatibility.csv # Summary evaluation matrix
└── README.md                 # This documentation
```
