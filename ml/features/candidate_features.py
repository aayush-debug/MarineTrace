"""
MarineTrace — Candidate Feature Extraction

After U-Net segmentation, this module:
1. Thresholds the probability map → binary mask
2. Extracts connected components → candidate regions
3. Computes geometric and radiometric features per candidate
4. Converts to geographic coordinates (GeoJSON) if georeferencing is available
"""

import numpy as np
from typing import Optional

try:
    from skimage import measure, morphology
    SKIMAGE_AVAILABLE = True
except ImportError:
    SKIMAGE_AVAILABLE = False

try:
    from shapely.geometry import Polygon, mapping, MultiPolygon
    from shapely.validation import make_valid
    SHAPELY_AVAILABLE = True
except ImportError:
    SHAPELY_AVAILABLE = False


def threshold_probability_map(
    prob_map: np.ndarray,
    threshold: float = 0.5,
) -> np.ndarray:
    """
    Convert probability map to binary mask.

    Args:
        prob_map: Oil probability map, shape [H, W], values in [0, 1].
        threshold: Probability threshold.

    Returns:
        Binary mask, shape [H, W], dtype uint8.
    """
    return (prob_map > threshold).astype(np.uint8)


def extract_connected_components(
    binary_mask: np.ndarray,
    min_area_pixels: int = 100,
) -> tuple[np.ndarray, list[dict]]:
    """
    Extract connected components from a binary mask.

    Args:
        binary_mask: Binary mask of shape [H, W].
        min_area_pixels: Minimum area in pixels to keep a component.

    Returns:
        Tuple of:
            - labeled_mask: Integer-labeled mask
            - regions: List of region property dicts from skimage
    """
    if not SKIMAGE_AVAILABLE:
        raise ImportError("scikit-image is required for connected component analysis.")

    # Label connected components
    labeled = measure.label(binary_mask, connectivity=2)

    # Get region properties
    props = measure.regionprops(labeled)

    # Filter by minimum area
    valid_regions = []
    for prop in props:
        if prop.area >= min_area_pixels:
            valid_regions.append(prop)

    return labeled, valid_regions


def compute_candidate_features(
    region,
    prob_map: np.ndarray,
    sar_image: np.ndarray | None = None,
) -> dict:
    """
    Compute features for a single candidate region.

    Args:
        region: skimage regionprops object.
        prob_map: Oil probability map [H, W].
        sar_image: Optional SAR image [C, H, W] for radiometric features.

    Returns:
        Dictionary of candidate features.
    """
    features = {}

    # Basic geometry
    features["area_pixels"] = int(region.area)
    features["centroid_row"] = float(region.centroid[0])
    features["centroid_col"] = float(region.centroid[1])
    features["bbox"] = {
        "min_row": int(region.bbox[0]),
        "min_col": int(region.bbox[1]),
        "max_row": int(region.bbox[2]),
        "max_col": int(region.bbox[3]),
    }
    features["perimeter"] = float(region.perimeter)

    # Shape features
    bbox_height = region.bbox[2] - region.bbox[0]
    bbox_width = region.bbox[3] - region.bbox[1]
    features["aspect_ratio"] = float(max(bbox_height, bbox_width) / max(min(bbox_height, bbox_width), 1))
    features["eccentricity"] = float(region.eccentricity)
    features["solidity"] = float(region.solidity)
    features["orientation_degrees"] = float(np.degrees(region.orientation))

    # Compactness = 4π × Area / Perimeter²
    if region.perimeter > 0:
        features["compactness"] = float(
            4 * np.pi * region.area / (region.perimeter ** 2)
        )
    else:
        features["compactness"] = 0.0

    # Oil probability within the region
    region_mask = region.image  # Boolean mask of the region
    r0, c0, r1, c1 = region.bbox
    prob_crop = prob_map[r0:r1, c0:c1]
    features["oil_probability"] = float(np.mean(prob_crop[region_mask]))
    features["oil_probability_std"] = float(np.std(prob_crop[region_mask]))
    features["oil_probability_max"] = float(np.max(prob_crop[region_mask]))

    # SAR radiometric features
    if sar_image is not None and sar_image.ndim == 3:
        if sar_image.shape[1] >= r1 and sar_image.shape[2] >= c1:
            n_channels = sar_image.shape[0]
            for ch in range(min(n_channels, 2)):
                ch_name = "vv" if ch == 0 else "vh"
                sar_crop = sar_image[ch, r0:r1, c0:c1]
                if sar_crop.shape == region_mask.shape:
                    ch_values = sar_crop[region_mask]
                    features[f"mean_{ch_name}_db"] = float(np.mean(ch_values))
                    features[f"std_{ch_name}_db"] = float(np.std(ch_values))

                    # Contrast with surrounding background
                    bg_mask = ~region_mask
                    if np.any(bg_mask):
                        bg_values = sar_crop[bg_mask]
                        features[f"contrast_{ch_name}"] = float(
                            np.mean(bg_values) - np.mean(ch_values)
                        )
                    else:
                        features[f"contrast_{ch_name}"] = 0.0

    return features


def pixels_to_geo_polygon(
    region,
    transform,
    crs=None,
) -> dict | None:
    """
    Convert a pixel-space region to a GeoJSON-compatible polygon.

    Uses the rasterio affine transform to map pixel coordinates to
    geographic coordinates.

    Args:
        region: skimage regionprops object.
        transform: rasterio Affine transform.
        crs: Coordinate reference system (for metadata only).

    Returns:
        GeoJSON-compatible dict, or None if conversion fails.
    """
    if not SHAPELY_AVAILABLE:
        return None

    if transform is None:
        return None

    try:
        # Get contour of the region
        contours = measure.find_contours(region.image.astype(float), 0.5)
        if not contours:
            return None

        # Use the largest contour
        contour = max(contours, key=len)

        # Offset by region bbox origin
        r0, c0 = region.bbox[0], region.bbox[1]
        contour_global = contour.copy()
        contour_global[:, 0] += r0  # rows
        contour_global[:, 1] += c0  # cols

        # Convert pixel coords to geographic coords using the affine transform
        geo_coords = []
        for row, col in contour_global:
            x, y = transform * (col, row)  # (col, row) -> (x, y)
            geo_coords.append((float(x), float(y)))

        # Close the polygon
        if geo_coords and geo_coords[0] != geo_coords[-1]:
            geo_coords.append(geo_coords[0])

        if len(geo_coords) < 4:
            return None

        # Create and validate polygon
        poly = Polygon(geo_coords)
        if not poly.is_valid:
            poly = make_valid(poly)

        if poly.is_empty:
            return None

        # Handle MultiPolygon from make_valid
        if isinstance(poly, MultiPolygon):
            poly = max(poly.geoms, key=lambda p: p.area)

        geojson = mapping(poly)

        return geojson

    except Exception:
        return None


def compute_area_km2(area_pixels: int, transform) -> float | None:
    """
    Convert pixel area to square kilometers using the affine transform.

    Args:
        area_pixels: Area in pixels.
        transform: rasterio Affine transform.

    Returns:
        Area in km², or None if transform is not available.
    """
    if transform is None:
        return None

    # Pixel size in the CRS units (usually meters for projected CRS)
    pixel_width = abs(transform.a)
    pixel_height = abs(transform.e)
    pixel_area = pixel_width * pixel_height  # m² (if CRS is in meters)

    # For geographic CRS (degrees), approximate using equatorial values
    # 1 degree ≈ 111,320 meters
    if pixel_width < 1.0:  # Likely in degrees
        pixel_area_m2 = pixel_area * (111320 ** 2)
    else:
        pixel_area_m2 = pixel_area

    area_km2 = (area_pixels * pixel_area_m2) / 1e6
    return float(area_km2)


def extract_candidates(
    prob_map: np.ndarray,
    threshold: float = 0.5,
    min_area_pixels: int = 100,
    max_candidates: int = 50,
    sar_image: np.ndarray | None = None,
    transform=None,
    crs=None,
) -> list[dict]:
    """
    Full candidate extraction pipeline.

    Args:
        prob_map: Oil probability map [H, W], values in [0, 1].
        threshold: Binarization threshold.
        min_area_pixels: Minimum candidate area.
        max_candidates: Maximum number of candidates to return.
        sar_image: Optional SAR image [C, H, W] for radiometric features.
        transform: Optional rasterio Affine transform.
        crs: Optional CRS.

    Returns:
        List of candidate dictionaries, sorted by oil_probability (descending).
    """
    # Step 1: Threshold
    binary = threshold_probability_map(prob_map, threshold)

    # Step 2: Connected components
    labeled, regions = extract_connected_components(binary, min_area_pixels)

    # Step 3: Extract features for each candidate
    candidates = []
    for i, region in enumerate(regions):
        features = compute_candidate_features(region, prob_map, sar_image)
        features["candidate_id"] = i + 1

        # Step 4: Geographic conversion
        geojson = pixels_to_geo_polygon(region, transform, crs)
        if geojson is not None:
            features["geometry"] = geojson
            features["georeferenced"] = True
        else:
            # Pixel-space bounding polygon
            bbox = features["bbox"]
            features["geometry"] = {
                "type": "Polygon",
                "coordinates": [[
                    [bbox["min_col"], bbox["min_row"]],
                    [bbox["max_col"], bbox["min_row"]],
                    [bbox["max_col"], bbox["max_row"]],
                    [bbox["min_col"], bbox["max_row"]],
                    [bbox["min_col"], bbox["min_row"]],
                ]],
                "coordinate_system": "pixel",
            }
            features["georeferenced"] = False

        # Area in km²
        area_km2 = compute_area_km2(features["area_pixels"], transform)
        features["area_km2"] = area_km2

        # Centroid in geographic coordinates
        if transform is not None:
            cx, cy = transform * (features["centroid_col"], features["centroid_row"])
            features["centroid"] = {"longitude": float(cx), "latitude": float(cy)}
        else:
            features["centroid"] = {
                "row": features["centroid_row"],
                "col": features["centroid_col"],
            }

        candidates.append(features)

    # Sort by oil probability (descending)
    candidates.sort(key=lambda c: c.get("oil_probability", 0), reverse=True)

    # Limit to max_candidates
    return candidates[:max_candidates]
