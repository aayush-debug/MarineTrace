"""
MarineTrace — Patch Dataset

Handles:
- Patching 2048×2048 SAR images into 256×256 tiles
- Scene-level train/val/test splitting (no data leakage)
- PyTorch Dataset class for training
"""

import os
import glob
import math
import random
from pathlib import Path
from typing import Optional

import numpy as np
import torch
from torch.utils.data import Dataset

from preprocessing.sar_preprocessing import (
    handle_invalid_values,
    normalize_minmax,
    preprocess_sar_image,
)


def extract_patches(
    image: np.ndarray,
    mask: np.ndarray,
    patch_size: int = 256,
    stride: int = 256,
    min_valid_fraction: float = 0.8,
) -> list[tuple[np.ndarray, np.ndarray]]:
    """
    Extract patches from a large image and its corresponding mask.

    Args:
        image: SAR image of shape [C, H, W].
        mask: Binary mask of shape [H, W] or [1, H, W].
        patch_size: Size of each square patch.
        stride: Step size between patches.
        min_valid_fraction: Minimum fraction of valid (non-NaN) pixels required.

    Returns:
        List of (image_patch, mask_patch) tuples.
        image_patch: [C, patch_size, patch_size]
        mask_patch: [patch_size, patch_size]
    """
    if mask.ndim == 3:
        mask = mask[0]  # [1, H, W] -> [H, W]

    c, h, w = image.shape
    patches = []

    for y in range(0, h - patch_size + 1, stride):
        for x in range(0, w - patch_size + 1, stride):
            img_patch = image[:, y : y + patch_size, x : x + patch_size]
            msk_patch = mask[y : y + patch_size, x : x + patch_size]

            # Check for sufficient valid pixels
            valid_pixels = np.isfinite(img_patch).all(axis=0).mean()
            if valid_pixels < min_valid_fraction:
                continue

            patches.append((img_patch.copy(), msk_patch.copy()))

    return patches


def scene_level_split(
    image_paths: list[str],
    train_ratio: float = 0.7,
    val_ratio: float = 0.15,
    test_ratio: float = 0.15,
    seed: int = 42,
) -> tuple[list[str], list[str], list[str]]:
    """
    Split image paths at the scene level to avoid data leakage.

    All patches from the same source image will be in the same split.

    Args:
        image_paths: List of image file paths.
        train_ratio: Fraction for training.
        val_ratio: Fraction for validation.
        test_ratio: Fraction for testing.
        seed: Random seed for reproducibility.

    Returns:
        Tuple of (train_paths, val_paths, test_paths).
    """
    assert abs(train_ratio + val_ratio + test_ratio - 1.0) < 1e-6, \
        f"Split ratios must sum to 1.0, got {train_ratio + val_ratio + test_ratio}"

    rng = random.Random(seed)
    paths = list(image_paths)
    rng.shuffle(paths)

    n = len(paths)
    n_train = int(n * train_ratio)
    n_val = int(n * val_ratio)

    train_paths = paths[:n_train]
    val_paths = paths[n_train : n_train + n_val]
    test_paths = paths[n_train + n_val :]

    return train_paths, val_paths, test_paths


class OilSpillPatchDataset(Dataset):
    """
    PyTorch Dataset for oil spill segmentation patches.

    Loads pre-extracted patches from numpy files or generates them on-the-fly
    from GeoTIFF images.
    """

    def __init__(
        self,
        image_paths: list[str],
        mask_paths: list[str],
        patch_size: int = 256,
        stride: int = 256,
        normalization: str = "minmax",
        channel_bounds: list[tuple[float, float]] | None = None,
        min_valid_fraction: float = 0.8,
        transform=None,
        preload: bool = False,
    ):
        """
        Args:
            image_paths: List of paths to SAR GeoTIFF images.
            mask_paths: List of paths to mask GeoTIFF images.
            patch_size: Size of patches to extract.
            stride: Stride for patch extraction.
            normalization: Normalization method ("minmax" or "zscore").
            channel_bounds: For minmax normalization.
            min_valid_fraction: Min fraction of valid pixels per patch.
            transform: Optional albumentations transform.
            preload: If True, load and patch all images into memory.
        """
        assert len(image_paths) == len(mask_paths), \
            f"Number of images ({len(image_paths)}) must match masks ({len(mask_paths)})"

        self.image_paths = image_paths
        self.mask_paths = mask_paths
        self.patch_size = patch_size
        self.stride = stride
        self.normalization = normalization
        self.channel_bounds = channel_bounds
        self.min_valid_fraction = min_valid_fraction
        self.transform = transform
        self.preload = preload

        # Default normalization bounds for Sentinel-1 Sigma0 dB
        if self.channel_bounds is None:
            self.channel_bounds = [(-30.0, 0.0), (-35.0, -5.0)]

        # Preload patches into memory
        self.patches = []
        if preload:
            self._preload_patches()
        else:
            # Build index mapping: global_idx -> (image_idx, patch_idx)
            self._build_index()

    def _load_image_and_mask(self, img_path: str, msk_path: str):
        """Load a single image-mask pair."""
        try:
            import tifffile
            image = tifffile.imread(img_path).astype(np.float32)
            mask = tifffile.imread(msk_path).astype(np.float32)
        except ImportError:
            try:
                import rasterio
                with rasterio.open(img_path) as src:
                    image = src.read().astype(np.float32)
                with rasterio.open(msk_path) as src:
                    mask = src.read().astype(np.float32)
                    if mask.ndim == 3:
                        mask = mask[0]
                return image, mask
            except ImportError:
                raise ImportError("Either tifffile or rasterio is required.")

        # Handle various shapes from tifffile
        if image.ndim == 2:
            image = image[np.newaxis, :, :]  # [H, W] -> [1, H, W]
        elif image.ndim == 3:
            if image.shape[2] in [1, 2, 3, 4]:
                # [H, W, C] -> [C, H, W]
                image = np.transpose(image, (2, 0, 1))
            # else assume already [C, H, W]

        if mask.ndim == 3:
            mask = mask[0] if mask.shape[0] <= 4 else mask[:, :, 0]
        # Ensure binary mask
        mask = (mask > 0).astype(np.float32)

        return image, mask

    def _preload_patches(self):
        """Load all images, extract patches, and store in memory."""
        for img_path, msk_path in zip(self.image_paths, self.mask_paths):
            image, mask = self._load_image_and_mask(img_path, msk_path)
            patches = extract_patches(
                image, mask,
                patch_size=self.patch_size,
                stride=self.stride,
                min_valid_fraction=self.min_valid_fraction,
            )
            self.patches.extend(patches)

    def _build_index(self):
        """Build a mapping from global index to (image_idx, estimated_patches)."""
        # Estimate patches per image
        # For 2048x2048 image with 256 stride: (2048/256)^2 = 64 patches
        est_patches = max(1, (2048 // self.stride) ** 2)
        self._estimated_len = len(self.image_paths) * est_patches
        # Cache loaded patches per image
        self._cache = {}

    def _get_patches_for_image(self, img_idx: int):
        """Load and cache patches for a specific image."""
        if img_idx not in self._cache:
            image, mask = self._load_image_and_mask(
                self.image_paths[img_idx], self.mask_paths[img_idx]
            )
            self._cache[img_idx] = extract_patches(
                image, mask,
                patch_size=self.patch_size,
                stride=self.stride,
                min_valid_fraction=self.min_valid_fraction,
            )
        return self._cache[img_idx]

    def __len__(self):
        if self.preload:
            return len(self.patches)
        return self._estimated_len

    def __getitem__(self, idx):
        if self.preload:
            img_patch, msk_patch = self.patches[idx]
        else:
            # Map global idx to image and local patch idx
            # Load patches for the corresponding image
            patches_per_img = max(1, (2048 // self.stride) ** 2)
            img_idx = idx // patches_per_img
            local_idx = idx % patches_per_img

            if img_idx >= len(self.image_paths):
                img_idx = img_idx % len(self.image_paths)

            patches = self._get_patches_for_image(img_idx)
            if local_idx >= len(patches):
                local_idx = local_idx % max(1, len(patches))

            img_patch, msk_patch = patches[local_idx]

        # Preprocess the image patch
        img_patch = preprocess_sar_image(
            img_patch,
            normalization=self.normalization,
            channel_bounds=self.channel_bounds,
        )

        # Apply augmentations
        if self.transform is not None:
            # albumentations expects [H, W, C] for image
            img_hw_c = np.transpose(img_patch, (1, 2, 0))  # [C, H, W] -> [H, W, C]
            transformed = self.transform(image=img_hw_c, mask=msk_patch)
            img_patch = np.transpose(transformed["image"], (2, 0, 1))  # Back to [C, H, W]
            msk_patch = transformed["mask"]

        # Convert to tensors
        img_tensor = torch.from_numpy(img_patch).float()
        msk_tensor = torch.from_numpy(msk_patch).float().unsqueeze(0)  # [H, W] -> [1, H, W]

        return img_tensor, msk_tensor


class InMemoryPatchDataset(Dataset):
    """
    Simple in-memory dataset from pre-computed patches.
    Used for small datasets or after pre-processing step.
    """

    def __init__(
        self,
        images: list[np.ndarray],
        masks: list[np.ndarray],
        transform=None,
    ):
        self.images = images
        self.masks = masks
        self.transform = transform

    def __len__(self):
        return len(self.images)

    def __getitem__(self, idx):
        image = self.images[idx].astype(np.float32)
        mask = self.masks[idx].astype(np.float32)

        if self.transform is not None:
            img_hwc = np.transpose(image, (1, 2, 0))
            transformed = self.transform(image=img_hwc, mask=mask)
            image = np.transpose(transformed["image"], (2, 0, 1))
            mask = transformed["mask"]

        img_tensor = torch.from_numpy(image).float()
        msk_tensor = torch.from_numpy(mask).float()
        if msk_tensor.ndim == 2:
            msk_tensor = msk_tensor.unsqueeze(0)

        return img_tensor, msk_tensor


def find_image_mask_pairs(
    image_dir: str,
    mask_dir: str,
    image_ext: str = ".tif",
) -> tuple[list[str], list[str]]:
    """
    Find matching image-mask file pairs by filename convention.

    The Zenodo dataset uses matching filenames (e.g., 0001.tif) in
    separate image and mask directories.

    Args:
        image_dir: Directory containing SAR images.
        mask_dir: Directory containing mask images.
        image_ext: File extension to search for.

    Returns:
        Tuple of (image_paths, mask_paths) — sorted and matched.
    """
    image_files = sorted(glob.glob(os.path.join(image_dir, f"*{image_ext}")))
    mask_files = sorted(glob.glob(os.path.join(mask_dir, f"*{image_ext}")))

    # Match by basename
    mask_basenames = {os.path.basename(m): m for m in mask_files}

    matched_images = []
    matched_masks = []

    for img_path in image_files:
        basename = os.path.basename(img_path)
        if basename in mask_basenames:
            matched_images.append(img_path)
            matched_masks.append(mask_basenames[basename])

    if not matched_images:
        # Try matching by numeric suffix
        import re
        img_nums = {}
        for p in image_files:
            nums = re.findall(r'\d+', os.path.basename(p))
            if nums:
                img_nums[nums[-1]] = p

        for p in mask_files:
            nums = re.findall(r'\d+', os.path.basename(p))
            if nums and nums[-1] in img_nums:
                matched_images.append(img_nums[nums[-1]])
                matched_masks.append(p)

    return matched_images, matched_masks
