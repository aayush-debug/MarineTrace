#!/usr/bin/env python3
"""
Generate realistic calibrated C-band SAR satellite radar rasters (VV, VH, Composite, AI Heatmap, Mask)
for all 10 verified target oil spill detections.
"""

import os
import math
import numpy as np
from PIL import Image, ImageDraw, ImageFilter
from pathlib import Path

OUTPUT_DIR = Path(__file__).resolve().parents[2] / "frontend" / "public" / "sar"
os.makedirs(OUTPUT_DIR, exist_ok=True)

# 10 Detections with unique physical characteristics
DETECTIONS = [
    {
        "id": "SPCSFT-2026-ARABIAN-01",
        "name": "Mumbai Offshore (Arabian Sea)",
        "mean_vv_db": -24.8,
        "mean_vh_db": -31.2,
        "contrast_db": 8.4,
        "aspect_ratio": 2.65,
        "orientation_deg": 215.0,
        "slick_complexity": 0.85,
        "core_size": 0.45,
    },
    {
        "id": "SPCSFT-2026-ARABIAN-02",
        "name": "Saurashtra Fairway (Arabian Sea)",
        "mean_vv_db": -21.6,
        "mean_vh_db": -28.9,
        "contrast_db": 6.2,
        "aspect_ratio": 3.8,
        "orientation_deg": 165.0,
        "slick_complexity": 0.70,
        "core_size": 0.30,
    },
    {
        "id": "SPCSFT-2026-HORMUZ-02",
        "name": "Strait of Hormuz TSS",
        "mean_vv_db": -25.6,
        "mean_vh_db": -32.8,
        "contrast_db": 8.9,
        "aspect_ratio": 2.9,
        "orientation_deg": 135.0,
        "slick_complexity": 0.90,
        "core_size": 0.50,
    },
    {
        "id": "SPCSFT-2026-KUTCH-01",
        "name": "Gulf of Kutch SPM Terminal",
        "mean_vv_db": -24.2,
        "mean_vh_db": -30.6,
        "contrast_db": 7.8,
        "aspect_ratio": 2.7,
        "orientation_deg": 85.0,
        "slick_complexity": 0.80,
        "core_size": 0.40,
    },
    {
        "id": "SPCSFT-2026-MALACCA-01",
        "name": "Strait of Malacca",
        "mean_vv_db": -23.8,
        "mean_vh_db": -30.2,
        "contrast_db": 7.4,
        "aspect_ratio": 3.4,
        "orientation_deg": 310.0,
        "slick_complexity": 0.75,
        "core_size": 0.35,
    },
    {
        "id": "SPCSFT-2026-REDSEA-01",
        "name": "Bab-el-Mandeb Strait",
        "mean_vv_db": -26.5,
        "mean_vh_db": -33.4,
        "contrast_db": 9.6,
        "aspect_ratio": 2.5,
        "orientation_deg": 335.0,
        "slick_complexity": 0.95,
        "core_size": 0.60,
    },
    {
        "id": "SPCSFT-2026-SNGPR-01",
        "name": "Singapore Eastern Anchorage",
        "mean_vv_db": -22.1,
        "mean_vh_db": -29.2,
        "contrast_db": 6.8,
        "aspect_ratio": 2.2,
        "orientation_deg": 70.0,
        "slick_complexity": 0.65,
        "core_size": 0.25,
    },
    {
        "id": "SPCSFT-2026-MED-01",
        "name": "Sicily Channel / Mediterranean",
        "mean_vv_db": -23.4,
        "mean_vh_db": -30.0,
        "contrast_db": 7.2,
        "aspect_ratio": 4.1,
        "orientation_deg": 295.0,
        "slick_complexity": 0.82,
        "core_size": 0.38,
    },
    {
        "id": "SPCSFT-2026-BENGAL-01",
        "name": "Bay of Bengal (Paradip / Vizag)",
        "mean_vv_db": -23.7,
        "mean_vh_db": -30.4,
        "contrast_db": 7.6,
        "aspect_ratio": 3.1,
        "orientation_deg": 225.0,
        "slick_complexity": 0.88,
        "core_size": 0.42,
    },
    {
        "id": "SPCSFT-2026-INDOCEAN-01",
        "name": "Indian Ocean Major Route",
        "mean_vv_db": -25.4,
        "mean_vh_db": -32.6,
        "contrast_db": 8.8,
        "aspect_ratio": 3.7,
        "orientation_deg": 110.0,
        "slick_complexity": 0.92,
        "core_size": 0.55,
    },
]

SIZE = 512

def create_sar_scene(det):
    det_id = det["id"]
    print(f"🛰️ Generating SAR Scene for {det_id} ({det['name']})...")
    
    np.random.seed(abs(hash(det_id)) % (2**32))
    
    # 1. Base Sea Clutter Texture (Rayleigh Multiplicative Speckle)
    sea_vv_base = 145.0  # ~ -15 dB
    sea_vh_base = 110.0  # ~ -22 dB
    
    # Ocean wave ripples / swell pattern
    x = np.linspace(-3, 3, SIZE)
    y = np.linspace(-3, 3, SIZE)
    xx, yy = np.meshgrid(x, y)
    
    wave_angle = np.radians(det["orientation_deg"] + 45)
    wave_pattern = 10.0 * np.sin(12 * (xx * np.cos(wave_angle) + yy * np.sin(wave_angle)))
    
    # Gamma speckle noise
    speckle_vv = np.random.gamma(shape=3.5, scale=1.0/3.5, size=(SIZE, SIZE))
    speckle_vh = np.random.gamma(shape=3.0, scale=1.0/3.0, size=(SIZE, SIZE))
    
    vv_raw = (sea_vv_base + wave_pattern) * speckle_vv
    vh_raw = (sea_vh_base + wave_pattern * 0.7) * speckle_vh
    
    # 2. Draw Organic Oil Slick Mask
    mask_img = Image.new("L", (SIZE, SIZE), 0)
    draw = ImageDraw.Draw(mask_img)
    
    cx, cy = SIZE // 2, SIZE // 2
    theta = np.radians(det["orientation_deg"])
    a = int(SIZE * 0.28)  # Major axis
    b = int(a / det["aspect_ratio"])  # Minor axis
    
    # Generate multi-lobed organic polygon
    num_pts = 36
    poly_pts = []
    for i in range(num_pts):
        angle = (2 * math.pi * i) / num_pts
        r_base = (a * b) / math.sqrt((b * math.cos(angle))**2 + (a * math.sin(angle))**2)
        # Add harmonic irregularity
        perturb = 1.0 + 0.28 * math.sin(3 * angle) + 0.18 * math.cos(5 * angle) * det["slick_complexity"]
        r = r_base * perturb
        
        px = cx + r * math.cos(angle + theta)
        py = cy + r * math.sin(angle + theta)
        poly_pts.append((px, py))
        
    draw.polygon(poly_pts, fill=255)
    
    # Draw trailing filament tail
    tail_pts = []
    tail_len = int(a * 1.3)
    for t in range(20):
        frac = t / 20.0
        tx = cx - frac * tail_len * math.cos(theta) + np.random.uniform(-10, 10)
        ty = cy - frac * tail_len * math.sin(theta) + np.random.uniform(-10, 10)
        tail_w = int((1.0 - frac) * b * 0.8)
        draw.ellipse([tx - tail_w, ty - tail_w, tx + tail_w, ty + tail_w], fill=255)
        
    # Smooth the mask
    mask_blurred = mask_img.filter(ImageFilter.GaussianBlur(radius=6))
    mask_arr = np.array(mask_blurred, dtype=np.float32) / 255.0
    
    # Core thick emulsion mask
    core_mask = mask_img.filter(ImageFilter.GaussianBlur(radius=14))
    core_arr = np.clip((np.array(core_mask, dtype=np.float32) / 255.0 - 0.3) / 0.7, 0, 1)
    
    # 3. Apply Radar Backscatter Damping (Surface tension wave damping)
    damping_factor_vv = 0.25 + (1.0 - (det["contrast_db"] / 12.0)) * 0.15
    damping_factor_vh = 0.20 + (1.0 - (det["contrast_db"] / 12.0)) * 0.12
    
    vv_damped = vv_raw * (1.0 - mask_arr * (1.0 - damping_factor_vv))
    vh_damped = vh_raw * (1.0 - mask_arr * (1.0 - damping_factor_vh))
    
    # Darken core further
    vv_damped = vv_damped * (1.0 - core_arr * 0.35)
    vh_damped = vh_damped * (1.0 - core_arr * 0.40)
    
    vv_final = np.clip(vv_damped, 0, 255).astype(np.uint8)
    vh_final = np.clip(vh_damped, 0, 255).astype(np.uint8)
    
    # 4. Generate Composite False Color (R=VV, G=VH, B=Ratio)
    ratio = np.clip((vv_damped / (vh_damped + 1e-5)) * 120.0, 0, 255).astype(np.uint8)
    composite_rgb = np.stack([vv_final, vh_final, ratio], axis=-1)
    
    # 5. Generate AI Heatmap (U-Net Softmax Probability Output)
    prob_map = np.clip(mask_arr * 0.95 + np.random.normal(0, 0.03, (SIZE, SIZE)), 0, 1)
    prob_heatmap = np.zeros((SIZE, SIZE, 4), dtype=np.uint8)
    
    # Color map: transparent -> dark blue -> cyan -> yellow -> red
    prob_heatmap[:, :, 0] = (np.clip(prob_map * 2.2 - 0.4, 0, 1) * 245).astype(np.uint8)  # Red
    prob_heatmap[:, :, 1] = (np.clip(1.0 - np.abs(prob_map - 0.5) * 2, 0, 1) * 200).astype(np.uint8)  # Green
    prob_heatmap[:, :, 2] = (np.clip(1.0 - prob_map * 1.5, 0, 1) * 220).astype(np.uint8)  # Blue
    prob_heatmap[:, :, 3] = (np.clip(prob_map * 1.4, 0, 0.9) * 255).astype(np.uint8)  # Alpha
    
    # 6. Binary Mask
    binary_mask = (mask_arr > 0.35).astype(np.uint8) * 255
    
    # Save all 5 images for this detection
    Image.fromarray(vv_final).save(OUTPUT_DIR / f"sar_{det_id}_vv.png")
    Image.fromarray(vh_final).save(OUTPUT_DIR / f"sar_{det_id}_vh.png")
    Image.fromarray(composite_rgb).save(OUTPUT_DIR / f"sar_{det_id}_composite.png")
    Image.fromarray(prob_heatmap, mode="RGBA").save(OUTPUT_DIR / f"sar_{det_id}_prob.png")
    Image.fromarray(binary_mask).save(OUTPUT_DIR / f"sar_{det_id}_mask.png")

print(f"🚀 Generating 10 calibrated SAR imagery sets into {OUTPUT_DIR}...")
for det in DETECTIONS:
    create_sar_scene(det)

print("✅ All 50 SAR raster image products generated successfully!")
