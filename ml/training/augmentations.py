"""
SlickTrace — Data Augmentations for SAR Imagery

Physically reasonable augmentations applied identically to image and mask.
Uses albumentations for consistent spatial transforms.
"""

try:
    import albumentations as A
    ALBUMENTATIONS_AVAILABLE = True
except ImportError:
    ALBUMENTATIONS_AVAILABLE = False


def get_train_augmentations(patch_size: int = 256):
    """
    Training augmentations — physically reasonable transforms for SAR imagery.

    Allowed:
    - Horizontal/vertical flips (SAR geometry is orientation-independent)
    - 90-degree rotations (same reasoning)
    - Small affine shifts/scales
    - Mild Gaussian noise (simulates slight radiometric noise)

    NOT used:
    - Color jitter (SAR is not RGB)
    - Elastic deformation (not physically realistic for SAR)
    - Large rotations (would introduce interpolation artifacts)

    Args:
        patch_size: Expected patch size (for reference).

    Returns:
        albumentations.Compose transform or None if albumentations is unavailable.
    """
    if not ALBUMENTATIONS_AVAILABLE:
        return None

    return A.Compose([
        A.HorizontalFlip(p=0.5),
        A.VerticalFlip(p=0.5),
        A.RandomRotate90(p=0.5),
        A.Affine(
            scale=(0.95, 1.05),
            translate_percent=(-0.05, 0.05),
            rotate=(-10, 10),
            p=0.3,
        ),
        A.GaussNoise(
            p=0.2,
        ),
    ])


def get_val_augmentations(patch_size: int = 256):
    """
    Validation/test augmentations — no augmentation, only ensures correct format.

    Returns:
        None (no augmentations for validation).
    """
    return None
