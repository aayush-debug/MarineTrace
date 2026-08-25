"""
SlickTrace — U-Net Training Script

Trains a U-Net model for SAR oil spill segmentation using PyTorch.

Usage:
    python training/train_unet.py [--config config.yaml]
"""

import os
import sys
import time
import argparse
import random
from pathlib import Path

import numpy as np
import torch
import torch.nn as nn
from torch.utils.data import DataLoader
import yaml
from tqdm import tqdm

# Add project root to path
PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

from models.unet import create_model
from training.losses import create_loss
from training.augmentations import get_train_augmentations, get_val_augmentations
from preprocessing.patch_dataset import (
    OilSpillPatchDataset,
    InMemoryPatchDataset,
    find_image_mask_pairs,
    scene_level_split,
)


def set_seed(seed: int):
    """Set all random seeds for reproducibility."""
    random.seed(seed)
    np.random.seed(seed)
    torch.manual_seed(seed)
    torch.cuda.manual_seed_all(seed)
    torch.backends.cudnn.deterministic = True
    torch.backends.cudnn.benchmark = False


def get_device() -> torch.device:
    """Select best available compute device."""
    if torch.cuda.is_available():
        device = torch.device("cuda")
        print(f"[INFO] Using CUDA GPU: {torch.cuda.get_device_name(0)}")
    elif hasattr(torch.backends, "mps") and torch.backends.mps.is_available():
        device = torch.device("mps")
        print("[INFO] Using Apple Silicon MPS")
    else:
        device = torch.device("cpu")
        print("[INFO] Using CPU")
    return device


def compute_dice(logits: torch.Tensor, targets: torch.Tensor, threshold: float = 0.5) -> float:
    """Compute Dice score."""
    probs = torch.sigmoid(logits)
    preds = (probs > threshold).float()
    intersection = (preds * targets).sum()
    union = preds.sum() + targets.sum()
    if union < 1e-8:
        return 1.0  # Both empty
    dice = (2.0 * intersection / (union + 1e-8)).item()
    return dice


def compute_iou(logits: torch.Tensor, targets: torch.Tensor, threshold: float = 0.5) -> float:
    """Compute IoU (Jaccard index)."""
    probs = torch.sigmoid(logits)
    preds = (probs > threshold).float()
    intersection = (preds * targets).sum()
    union = preds.sum() + targets.sum() - intersection
    if union < 1e-8:
        return 1.0
    return (intersection / (union + 1e-8)).item()


class EarlyStopping:
    """Early stopping to stop training when validation metric stops improving."""

    def __init__(self, patience: int = 10, min_delta: float = 1e-4, mode: str = "max"):
        self.patience = patience
        self.min_delta = min_delta
        self.mode = mode
        self.counter = 0
        self.best_score = None
        self.should_stop = False

    def __call__(self, score: float) -> bool:
        if self.best_score is None:
            self.best_score = score
            return False

        if self.mode == "max":
            improved = score > self.best_score + self.min_delta
        else:
            improved = score < self.best_score - self.min_delta

        if improved:
            self.best_score = score
            self.counter = 0
        else:
            self.counter += 1
            if self.counter >= self.patience:
                self.should_stop = True

        return self.should_stop


def train_one_epoch(model, dataloader, criterion, optimizer, device):
    """Train for one epoch."""
    model.train()
    total_loss = 0.0
    total_dice = 0.0
    total_iou = 0.0
    n_batches = 0

    pbar = tqdm(dataloader, desc="  Train", leave=False)
    for images, masks in pbar:
        images = images.to(device)
        masks = masks.to(device)

        optimizer.zero_grad()
        logits = model(images)
        loss = criterion(logits, masks)
        loss.backward()
        optimizer.step()

        total_loss += loss.item()
        total_dice += compute_dice(logits.detach(), masks)
        total_iou += compute_iou(logits.detach(), masks)
        n_batches += 1

        pbar.set_postfix(loss=f"{loss.item():.4f}")

    return {
        "loss": total_loss / max(n_batches, 1),
        "dice": total_dice / max(n_batches, 1),
        "iou": total_iou / max(n_batches, 1),
    }


@torch.no_grad()
def validate(model, dataloader, criterion, device):
    """Validate the model."""
    model.eval()
    total_loss = 0.0
    total_dice = 0.0
    total_iou = 0.0
    n_batches = 0

    for images, masks in tqdm(dataloader, desc="  Val  ", leave=False):
        images = images.to(device)
        masks = masks.to(device)

        logits = model(images)
        loss = criterion(logits, masks)

        total_loss += loss.item()
        total_dice += compute_dice(logits, masks)
        total_iou += compute_iou(logits, masks)
        n_batches += 1

    return {
        "loss": total_loss / max(n_batches, 1),
        "dice": total_dice / max(n_batches, 1),
        "iou": total_iou / max(n_batches, 1),
    }


def create_synthetic_dataset(config: dict):
    """
    Create a small synthetic dataset for smoke-testing the training loop.
    Returns (train_dataset, val_dataset).
    """
    patch_size = config.get("model", {}).get("image_size", 256)
    in_channels = config.get("model", {}).get("in_channels", 2)
    n_train, n_val = 32, 8

    train_images, train_masks = [], []
    val_images, val_masks = [], []

    for i in range(n_train + n_val):
        img = np.random.randn(in_channels, patch_size, patch_size).astype(np.float32)
        # Create a circular oil spill in the mask
        yy, xx = np.ogrid[:patch_size, :patch_size]
        cx, cy = np.random.randint(64, patch_size - 64, 2)
        r = np.random.randint(20, 60)
        mask = ((xx - cx) ** 2 + (yy - cy) ** 2 < r ** 2).astype(np.float32)
        # Make the image darker where there's oil (simulating SAR)
        img[:, mask > 0] -= 1.5

        if i < n_train:
            train_images.append(img)
            train_masks.append(mask)
        else:
            val_images.append(img)
            val_masks.append(mask)

    train_aug = get_train_augmentations(patch_size)
    train_ds = InMemoryPatchDataset(train_images, train_masks, transform=train_aug)
    val_ds = InMemoryPatchDataset(val_images, val_masks, transform=None)

    return train_ds, val_ds


def create_real_dataset(config: dict):
    """
    Create training and validation datasets from the Zenodo dataset.
    Returns (train_dataset, val_dataset) or None if data not found.
    """
    dataset_cfg = config.get("dataset", {})
    split_cfg = config.get("splitting", {})
    preproc_cfg = config.get("preprocessing", {})

    raw_dir = Path(PROJECT_ROOT) / dataset_cfg.get("raw_dir", "data/raw")

    # Look for oil spill images and masks
    oil_img_dir = None
    oil_msk_dir = None

    # Search common directory structures
    candidates = [
        (raw_dir / "01_Train_Val_Oil_Spill_images", raw_dir / "01_Train_Val_Oil_Spill_mask"),
        (raw_dir / "images" / "Oil", raw_dir / "masks" / "Oil"),
        (raw_dir / "oil_images", raw_dir / "oil_masks"),
    ]

    for img_d, msk_d in candidates:
        if img_d.exists() and msk_d.exists():
            oil_img_dir = img_d
            oil_msk_dir = msk_d
            break

    if oil_img_dir is None:
        print(f"[WARNING] Dataset not found in {raw_dir}. Falling back to synthetic data.")
        return None

    # Find image-mask pairs
    image_paths, mask_paths = find_image_mask_pairs(str(oil_img_dir), str(oil_msk_dir))
    print(f"[INFO] Found {len(image_paths)} image-mask pairs")

    if len(image_paths) == 0:
        print("[WARNING] No matching image-mask pairs found.")
        return None

    # Scene-level split
    train_imgs, val_imgs, _ = scene_level_split(
        image_paths,
        train_ratio=split_cfg.get("train_ratio", 0.7),
        val_ratio=split_cfg.get("val_ratio", 0.15),
        test_ratio=split_cfg.get("test_ratio", 0.15),
        seed=split_cfg.get("seed", 42),
    )

    # Get corresponding masks
    img_to_mask = dict(zip(image_paths, mask_paths))
    train_masks = [img_to_mask[p] for p in train_imgs]
    val_masks = [img_to_mask[p] for p in val_imgs]

    patch_size = preproc_cfg.get("patch_size", 256)
    stride = preproc_cfg.get("patch_stride", 256)

    train_aug = get_train_augmentations(patch_size)

    train_ds = OilSpillPatchDataset(
        image_paths=train_imgs,
        mask_paths=train_masks,
        patch_size=patch_size,
        stride=stride,
        normalization=preproc_cfg.get("normalization", "minmax"),
        min_valid_fraction=preproc_cfg.get("min_valid_fraction", 0.8),
        transform=train_aug,
        preload=False,
    )

    val_ds = OilSpillPatchDataset(
        image_paths=val_imgs,
        mask_paths=val_masks,
        patch_size=patch_size,
        stride=stride,
        normalization=preproc_cfg.get("normalization", "minmax"),
        min_valid_fraction=preproc_cfg.get("min_valid_fraction", 0.8),
        transform=None,
        preload=False,
    )

    return train_ds, val_ds


def main():
    parser = argparse.ArgumentParser(description="Train U-Net for oil spill segmentation")
    parser.add_argument("--config", type=str, default=str(PROJECT_ROOT / "config.yaml"),
                        help="Path to config.yaml")
    parser.add_argument("--synthetic", action="store_true",
                        help="Use synthetic data for smoke testing")
    parser.add_argument("--epochs", type=int, default=None,
                        help="Override number of epochs")
    args = parser.parse_args()

    # Load config
    config_path = Path(args.config)
    if config_path.exists():
        with open(config_path) as f:
            config = yaml.safe_load(f)
    else:
        print(f"[WARNING] Config file not found at {config_path}. Using defaults.")
        config = {}

    train_cfg = config.get("training", {})
    seed = train_cfg.get("seed", 42)
    set_seed(seed)

    device = get_device()

    # Create model
    print("[INFO] Creating model...")
    model = create_model(config)
    model = model.to(device)

    total_params = sum(p.numel() for p in model.parameters())
    trainable_params = sum(p.numel() for p in model.parameters() if p.requires_grad)
    print(f"[INFO] Total parameters: {total_params:,}")
    print(f"[INFO] Trainable parameters: {trainable_params:,}")

    # Create loss
    criterion = create_loss(config)

    # Create optimizer
    lr = train_cfg.get("learning_rate", 1e-4)
    wd = train_cfg.get("weight_decay", 1e-4)
    optimizer = torch.optim.AdamW(model.parameters(), lr=lr, weight_decay=wd)

    # Create scheduler
    epochs = args.epochs or train_cfg.get("epochs", 50)
    scheduler = torch.optim.lr_scheduler.CosineAnnealingLR(
        optimizer,
        T_max=epochs,
        eta_min=train_cfg.get("scheduler_eta_min", 1e-6),
    )

    # Create datasets
    print("[INFO] Loading dataset...")
    if args.synthetic:
        train_ds, val_ds = create_synthetic_dataset(config)
        print(f"[INFO] Using synthetic dataset: {len(train_ds)} train, {len(val_ds)} val")
    else:
        result = create_real_dataset(config)
        if result is None:
            print("[INFO] Falling back to synthetic dataset for demonstration.")
            train_ds, val_ds = create_synthetic_dataset(config)
        else:
            train_ds, val_ds = result

    batch_size = train_cfg.get("batch_size", 8)
    num_workers = train_cfg.get("num_workers", 0)
    pin_memory = (device.type != "cpu")

    train_loader = DataLoader(
        train_ds, batch_size=batch_size, shuffle=True,
        num_workers=num_workers, pin_memory=pin_memory, drop_last=True,
    )
    val_loader = DataLoader(
        val_ds, batch_size=batch_size, shuffle=False,
        num_workers=num_workers, pin_memory=pin_memory,
    )

    # Early stopping
    early_stopping = EarlyStopping(
        patience=train_cfg.get("early_stopping_patience", 10),
        min_delta=train_cfg.get("early_stopping_min_delta", 1e-4),
        mode="max",
    )

    # Checkpoint directory
    ckpt_dir = Path(PROJECT_ROOT) / train_cfg.get("checkpoint_dir", "checkpoints")
    ckpt_dir.mkdir(parents=True, exist_ok=True)

    # Training loop
    best_val_dice = 0.0
    print(f"\n[INFO] Starting training for {epochs} epochs")
    print(f"[INFO] Batch size: {batch_size}, LR: {lr}, Device: {device}")
    print("=" * 70)

    for epoch in range(1, epochs + 1):
        epoch_start = time.time()

        # Train
        train_metrics = train_one_epoch(model, train_loader, criterion, optimizer, device)

        # Validate
        val_metrics = validate(model, val_loader, criterion, device)

        # Step scheduler
        scheduler.step()

        epoch_time = time.time() - epoch_start
        current_lr = optimizer.param_groups[0]["lr"]

        print(
            f"Epoch {epoch:3d}/{epochs} | "
            f"Train Loss: {train_metrics['loss']:.4f} Dice: {train_metrics['dice']:.4f} | "
            f"Val Loss: {val_metrics['loss']:.4f} Dice: {val_metrics['dice']:.4f} IoU: {val_metrics['iou']:.4f} | "
            f"LR: {current_lr:.2e} | {epoch_time:.1f}s"
        )

        # Save best model
        if val_metrics["dice"] > best_val_dice:
            best_val_dice = val_metrics["dice"]
            checkpoint = {
                "epoch": epoch,
                "model_state_dict": model.state_dict(),
                "optimizer_state_dict": optimizer.state_dict(),
                "val_dice": best_val_dice,
                "val_iou": val_metrics["iou"],
                "config": config,
            }
            ckpt_path = ckpt_dir / "best_model.pth"
            torch.save(checkpoint, ckpt_path)
            print(f"  -> Saved best model (Dice: {best_val_dice:.4f})")

        # Early stopping
        if early_stopping(val_metrics["dice"]):
            print(f"\n[INFO] Early stopping at epoch {epoch}")
            break

    # Save final model
    final_ckpt = {
        "epoch": epoch,
        "model_state_dict": model.state_dict(),
        "optimizer_state_dict": optimizer.state_dict(),
        "val_dice": val_metrics["dice"],
        "config": config,
    }
    torch.save(final_ckpt, ckpt_dir / "final_model.pth")

    print("=" * 70)
    print(f"[INFO] Training complete. Best validation Dice: {best_val_dice:.4f}")
    print(f"[INFO] Best checkpoint: {ckpt_dir / 'best_model.pth'}")
    print(f"[INFO] Final checkpoint: {ckpt_dir / 'final_model.pth'}")


if __name__ == "__main__":
    main()
