#!/usr/bin/env python3
"""
Generate georeferenced Sentinel-1 SAR satellite rasters (VV, VH, Composite, AI Heatmap, Mask)
where the radar backscatter depression perfectly matches the exact GeoJSON polygon coordinates
of all 10 verified target oil spill detections.
"""

import os
import json
import numpy as np
from PIL import Image, ImageDraw, ImageFilter
from pathlib import Path
import sys

# Add backend to path to import INITIAL_DETECTIONS
backend_path = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(backend_path))

from app.api.routes.spcsft import INITIAL_DETECTIONS

OUTPUT_DIR = Path(__file__).resolve().parents[2] / "frontend" / "public" / "sar"
os.makedirs(OUTPUT_DIR, exist_ok=True)

SIZE = 512
PADDING_RATIO = 0.35

bboxes_meta = {}

for det in INITIAL_DETECTIONS:
    det_id = det["detection_id"]
    print(f"🛰️ Processing georeferenced SAR scene for {det_id} ({det.get('zone_name', '')})...")
    
    # 1. Collect all polygon coordinates
    geom = det.get("geometry", {})
    coords = geom.get("coordinates", [])
    if isinstance(coords[0][0], list):
        ring = coords[0]
    else:
        ring = coords

    all_lons = [float(pt[0]) for pt in ring]
    all_lats = [float(pt[1]) for pt in ring]

    # Include sheen / core if available
    for sheen in det.get("sheen_geometry", []):
        s_coords = sheen.get("coordinates", [])
        if s_coords and isinstance(s_coords[0][0], list):
            s_ring = s_coords[0]
        else:
            s_ring = s_coords
        for pt in s_ring:
            all_lons.append(float(pt[0]))
            all_lats.append(float(pt[1]))

    for core in [det.get("core_geometry")]:
        if core and core.get("coordinates"):
            c_coords = core.get("coordinates")
            if isinstance(c_coords[0][0], list):
                c_ring = c_coords[0]
            else:
                c_ring = c_coords
            for pt in c_ring:
                all_lons.append(float(pt[0]))
                all_lats.append(float(pt[1]))

    min_lon, max_lon = min(all_lons), max(all_lons)
    min_lat, max_lat = min(all_lats), max(all_lats)

    d_lon = max(max_lon - min_lon, 0.04)
    d_lat = max(max_lat - min_lat, 0.04)

    bbox_min_lon = min_lon - PADDING_RATIO * d_lon
    bbox_max_lon = max_lon + PADDING_RATIO * d_lon
    bbox_min_lat = min_lat - PADDING_RATIO * d_lat
    bbox_max_lat = max_lat + PADDING_RATIO * d_lat

    bboxes_meta[det_id] = [
        [bbox_min_lat, bbox_min_lon],
        [bbox_max_lat, bbox_max_lon],
    ]

    # Coordinate to pixel transform function
    def to_pixel(lon, lat):
        px = ((lon - bbox_min_lon) / (bbox_max_lon - bbox_min_lon)) * SIZE
        py = ((bbox_max_lat - lat) / (bbox_max_lat - bbox_min_lat)) * SIZE
        return (px, py)

    # 2. Draw the exact polygon onto high-resolution mask
    mask_img = Image.new("L", (SIZE, SIZE), 0)
    draw = ImageDraw.Draw(mask_img)

    # Draw sheen background if present
    for sheen in det.get("sheen_geometry", []):
        s_coords = sheen.get("coordinates", [])
        s_ring = s_coords[0] if isinstance(s_coords[0][0], list) else s_coords
        s_pixels = [to_pixel(float(pt[0]), float(pt[1])) for pt in s_ring]
        if len(s_pixels) >= 3:
            draw.polygon(s_pixels, fill=160)

    # Draw main oil slick polygon
    main_pixels = [to_pixel(float(pt[0]), float(pt[1])) for pt in ring]
    if len(main_pixels) >= 3:
        draw.polygon(main_pixels, fill=255)

    # Draw core mousse if present
    core = det.get("core_geometry")
    if core and core.get("coordinates"):
        c_coords = core.get("coordinates")
        c_ring = c_coords[0] if isinstance(c_coords[0][0], list) else c_coords
        c_pixels = [to_pixel(float(pt[0]), float(pt[1])) for pt in c_ring]
        if len(c_pixels) >= 3:
            draw.polygon(c_pixels, fill=255)

    # Smooth the mask edges realistically
    mask_blurred = mask_img.filter(ImageFilter.GaussianBlur(radius=3.5))
    mask_arr = np.array(mask_blurred, dtype=np.float32) / 255.0

    # 3. Simulate C-Band SAR Radar Backscatter Clutter & Wave Damping
    np.random.seed(abs(hash(det_id)) % (2**32))

    # Sea clutter baseline (Rayleigh / Gamma speckle noise)
    sea_clutter_vv = np.random.gamma(shape=3.8, scale=140.0 / 3.8, size=(SIZE, SIZE))
    sea_clutter_vh = np.random.gamma(shape=3.2, scale=105.0 / 3.2, size=(SIZE, SIZE))

    # Add subtle ocean wave ripple pattern
    x = np.linspace(-4, 4, SIZE)
    y = np.linspace(-4, 4, SIZE)
    xx, yy = np.meshgrid(x, y)
    angle = np.radians(det.get("properties", {}).get("orientation_degrees", 45.0) + 40.0)
    wave = 8.0 * np.sin(10 * (xx * np.cos(angle) + yy * np.sin(angle)))
    sea_clutter_vv += wave
    sea_clutter_vh += wave * 0.6

    # Physical Wave Damping suppression inside oil slick
    damping_factor_vv = 0.22  # Strong radar wave suppression (-24 dB)
    damping_factor_vh = 0.18  # Strong cross-pol suppression (-31 dB)

    vv_damped = sea_clutter_vv * (1.0 - mask_arr * (1.0 - damping_factor_vv))
    vh_damped = sea_clutter_vh * (1.0 - mask_arr * (1.0 - damping_factor_vh))

    vv_final = np.clip(vv_damped, 0, 255).astype(np.uint8)
    vh_final = np.clip(vh_damped, 0, 255).astype(np.uint8)

    # 4. Composite RGB False-Color (R=VV, G=VH, B=VV/VH Ratio)
    ratio = np.clip((vv_damped / (vh_damped + 1e-5)) * 125.0, 0, 255).astype(np.uint8)
    composite_rgb = np.stack([vv_final, vh_final, ratio], axis=-1)

    # 5. Deep Learning U-Net AI Probability Heatmap (Smooth gradient over the exact shape)
    prob_map = np.clip(mask_arr * 0.94 + np.random.normal(0, 0.02, (SIZE, SIZE)), 0, 1)
    prob_heatmap = np.zeros((SIZE, SIZE, 4), dtype=np.uint8)
    # Heatmap color scale: Transparent -> Blue -> Cyan -> Yellow -> Red
    prob_heatmap[:, :, 0] = (np.clip(prob_map * 2.2 - 0.35, 0, 1) * 245).astype(np.uint8)
    prob_heatmap[:, :, 1] = (np.clip(1.0 - np.abs(prob_map - 0.5) * 2, 0, 1) * 210).astype(np.uint8)
    prob_heatmap[:, :, 2] = (np.clip(1.0 - prob_map * 1.4, 0, 1) * 220).astype(np.uint8)
    prob_heatmap[:, :, 3] = (np.clip(prob_map * 1.5, 0, 0.85) * 255).astype(np.uint8)

    # 6. Binary Mask
    binary_mask = (mask_arr > 0.30).astype(np.uint8) * 255

    # Save images
    Image.fromarray(vv_final).save(OUTPUT_DIR / f"sar_{det_id}_vv.png")
    Image.fromarray(vh_final).save(OUTPUT_DIR / f"sar_{det_id}_vh.png")
    Image.fromarray(composite_rgb).save(OUTPUT_DIR / f"sar_{det_id}_composite.png")
    Image.fromarray(prob_heatmap, mode="RGBA").save(OUTPUT_DIR / f"sar_{det_id}_prob.png")
    Image.fromarray(binary_mask).save(OUTPUT_DIR / f"sar_{det_id}_mask.png")

# Also save fallback sample_s1_*
Image.fromarray(vv_final).save(OUTPUT_DIR / "sample_s1_vv.png")
Image.fromarray(vh_final).save(OUTPUT_DIR / "sample_s1_vh.png")
Image.fromarray(composite_rgb).save(OUTPUT_DIR / "sample_s1_composite.png")
Image.fromarray(prob_heatmap, mode="RGBA").save(OUTPUT_DIR / "sample_s1_prob.png")
Image.fromarray(binary_mask).save(OUTPUT_DIR / "sample_s1_mask.png")

with open(OUTPUT_DIR / "sar_bboxes.json", "w") as f:
    json.dump(bboxes_meta, f, indent=2)

print("✅ Successfully generated georeferenced, shape-conforming SAR rasters for all 10 oil spills!")
