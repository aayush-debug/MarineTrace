"""
SlickTrace — SAR Image Preprocessing

Handles Sentinel-1 Sigma0 (dB) imagery:
- Invalid value handling (NaN, Inf, nodata)
- Normalization (min-max or z-score)
- Optional dB ↔ linear conversion
- Channel stacking (VV + VH)
"""

import numpy as np


def db_to_linear(db_values: np.ndarray) -> np.ndarray:
    """
    Convert Sigma0 from decibels (dB) to linear power scale.

    σ⁰_linear = 10^(σ⁰_dB / 10)

    Args:
        db_values: SAR backscatter values in dB.

    Returns:
        Linear-scale backscatter values.
    """
    return np.power(10.0, db_values / 10.0)


def linear_to_db(linear_values: np.ndarray) -> np.ndarray:
    """
    Convert Sigma0 from linear power scale to decibels (dB).

    σ⁰_dB = 10 × log10(σ⁰_linear)

    Args:
        linear_values: SAR backscatter values in linear scale.
            Values <= 0 are clipped to a small epsilon to avoid log(0).

    Returns:
        dB-scale backscatter values.
    """
    eps = 1e-10
    safe_values = np.clip(linear_values, eps, None)
    return 10.0 * np.log10(safe_values)


def handle_invalid_values(
    image: np.ndarray,
    nodata_value=None,
    fill_value: float = 0.0,
) -> np.ndarray:
    """
    Replace invalid pixel values (NaN, Inf, nodata) with a fill value.

    Args:
        image: Input image array.
        nodata_value: Optional nodata sentinel value to replace.
        fill_value: Value to use for invalid pixels.

    Returns:
        Cleaned image array (copy).
    """
    result = image.astype(np.float32, copy=True)

    # Replace NaN and Inf
    invalid_mask = ~np.isfinite(result)
    result[invalid_mask] = fill_value

    # Replace nodata value if specified
    if nodata_value is not None:
        nodata_mask = np.isclose(result, nodata_value)
        result[nodata_mask] = fill_value

    return result


def normalize_minmax(
    image: np.ndarray,
    channel_bounds: list[tuple[float, float]] | None = None,
) -> np.ndarray:
    """
    Min-max normalize image to [0, 1] range.

    Args:
        image: Input array of shape [C, H, W] or [H, W].
        channel_bounds: Optional list of (min, max) tuples per channel.
            If None, computes from the data.

    Returns:
        Normalized array in [0, 1].
    """
    result = image.astype(np.float32, copy=True)

    if result.ndim == 2:
        # Single channel
        if channel_bounds and len(channel_bounds) > 0:
            vmin, vmax = channel_bounds[0]
        else:
            vmin, vmax = float(np.nanmin(result)), float(np.nanmax(result))
        denom = vmax - vmin
        if denom < 1e-8:
            return np.zeros_like(result)
        result = (result - vmin) / denom
    elif result.ndim == 3:
        for c in range(result.shape[0]):
            if channel_bounds and c < len(channel_bounds):
                vmin, vmax = channel_bounds[c]
            else:
                vmin = float(np.nanmin(result[c]))
                vmax = float(np.nanmax(result[c]))
            denom = vmax - vmin
            if denom < 1e-8:
                result[c] = 0.0
            else:
                result[c] = (result[c] - vmin) / denom

    return np.clip(result, 0.0, 1.0)


def normalize_zscore(
    image: np.ndarray,
    channel_means: list[float] | None = None,
    channel_stds: list[float] | None = None,
) -> np.ndarray:
    """
    Z-score normalize image to zero mean and unit variance.

    Args:
        image: Input array of shape [C, H, W] or [H, W].
        channel_means: Optional per-channel means.
        channel_stds: Optional per-channel standard deviations.

    Returns:
        Z-score normalized array.
    """
    result = image.astype(np.float32, copy=True)

    if result.ndim == 2:
        mean = channel_means[0] if channel_means else float(np.nanmean(result))
        std = channel_stds[0] if channel_stds else float(np.nanstd(result))
        std = max(std, 1e-8)
        result = (result - mean) / std
    elif result.ndim == 3:
        for c in range(result.shape[0]):
            mean = channel_means[c] if channel_means and c < len(channel_means) else float(np.nanmean(result[c]))
            std = channel_stds[c] if channel_stds and c < len(channel_stds) else float(np.nanstd(result[c]))
            std = max(std, 1e-8)
            result[c] = (result[c] - mean) / std

    return result


def preprocess_sar_image(
    image: np.ndarray,
    nodata_value=None,
    normalization: str = "minmax",
    channel_bounds: list[tuple[float, float]] | None = None,
    channel_means: list[float] | None = None,
    channel_stds: list[float] | None = None,
) -> np.ndarray:
    """
    Full preprocessing pipeline for a SAR image.

    Steps:
        1. Handle invalid values
        2. Normalize

    The Zenodo dataset is already in Sigma0 dB format, so no dB conversion
    is needed. The data representation is documented and consistent.

    Args:
        image: Input SAR image of shape [C, H, W] or [H, W].
        nodata_value: Optional nodata sentinel value.
        normalization: "minmax" or "zscore".
        channel_bounds: For minmax normalization — per-channel (min, max).
        channel_means: For zscore normalization — per-channel means.
        channel_stds: For zscore normalization — per-channel stds.

    Returns:
        Preprocessed image as float32 array.
    """
    # Step 1: Handle invalid values
    result = handle_invalid_values(image, nodata_value=nodata_value, fill_value=-35.0)

    # Step 2: Normalize
    if normalization == "minmax":
        result = normalize_minmax(result, channel_bounds=channel_bounds)
    elif normalization == "zscore":
        result = normalize_zscore(
            result, channel_means=channel_means, channel_stds=channel_stds
        )
    else:
        raise ValueError(f"Unknown normalization method: {normalization}")

    return result


def load_sar_image(image_path: str) -> tuple[np.ndarray, dict]:
    """
    Load a SAR GeoTIFF image and extract metadata.

    Supports rasterio for georeferenced GeoTIFFs, with a tifffile fallback.

    Args:
        image_path: Path to a GeoTIFF or TIFF file.

    Returns:
        Tuple of:
            - image: numpy array of shape [C, H, W]
            - metadata: dict with keys like 'crs', 'transform', 'width', 'height'
    """
    try:
        import rasterio
        with rasterio.open(image_path) as src:
            image = src.read().astype(np.float32)  # [C, H, W]
            metadata = {
                "crs": src.crs,
                "transform": src.transform,
                "width": src.width,
                "height": src.height,
                "count": src.count,
                "dtype": str(src.dtypes[0]),
                "nodata": src.nodata,
                "bounds": src.bounds,
            }
        return image, metadata
    except ImportError:
        pass

    # Fallback to tifffile
    try:
        import tifffile
        raw = tifffile.imread(image_path).astype(np.float32)
        if raw.ndim == 2:
            image = raw[np.newaxis, :, :]
        elif raw.ndim == 3 and raw.shape[2] in [1, 2, 3, 4]:
            image = np.transpose(raw, (2, 0, 1))
        else:
            image = raw

        metadata = {
            "crs": None,
            "transform": None,
            "width": int(image.shape[2]),
            "height": int(image.shape[1]),
            "count": int(image.shape[0]),
            "dtype": str(image.dtype),
            "nodata": None,
            "bounds": None,
        }
        return image, metadata
    except ImportError:
        raise ImportError("Either rasterio or tifffile is required to load SAR image files.")
