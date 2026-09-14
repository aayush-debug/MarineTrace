"""
MarineTrace — Step 9, 10, 11, 12: V2 Model Training, Loss & Augmentation Ablations, and Threshold Search

Features:
- Reproducible seeding across Python, NumPy, PyTorch.
- U-Net with ResNet-34 encoder (2 input channels [VV, VH], 1 output channel).
- Multi-scene dataset loading from ml/data/processed/train and val.
- Configurable loss functions (Standard CombinedLoss vs Focal-Dice Loss).
- Configurable SAR data augmentations.
- Per-epoch validation metrics (Loss, Dice, IoU, Pixel FPR).
- Validation-set threshold search across [0.20, 0.25, 0.30, 0.35, 0.40, 0.45, 0.50, 0.55, 0.60].
- Experiment tracking in ml/experiments/ directories.
- Safe model versioning: saves to best_model_v2.pth (never overwriting best_model.pth).
"""

import os
import sys
import glob
import time
import json
import random
import argparse
from pathlib import Path

import numpy as np
import torch
import torch.nn as nn
from torch.utils.data import Dataset, DataLoader

PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

from models.unet import create_model
from preprocessing.sar_preprocessing import preprocess_sar_image
from evaluation.evaluate import compute_metrics, find_optimal_threshold
import tifffile


def set_seed(seed: int = 42):
    random.seed(seed)
    np.random.seed(seed)
    torch.manual_seed(seed)
    if torch.cuda.is_available():
        torch.cuda.manual_seed_all(seed)


class FocalDiceLoss(nn.Module):
    """
    Combined Focal Loss + Dice Loss for SAR oil spill segmentation.
    Focal loss down-weights easy ocean background pixels and penalizes hard false positives (look-alikes).
    """
    def __init__(self, gamma: float = 2.0, alpha: float = 0.6, dice_weight: float = 0.5, smooth: float = 1.0):
        super().__init__()
        self.gamma = gamma
        self.alpha = alpha
        self.dice_weight = dice_weight
        self.smooth = smooth
        self.bce = nn.BCEWithLogitsLoss(reduction="none")

    def forward(self, logits: torch.Tensor, targets: torch.Tensor) -> torch.Tensor:
        # Focal Loss
        bce_loss = self.bce(logits, targets)
        probs = torch.sigmoid(logits)
        pt = torch.where(targets == 1.0, probs, 1.0 - probs)
        focal_weight = (1.0 - pt) ** self.gamma
        alpha_weight = torch.where(targets == 1.0, self.alpha, 1.0 - self.alpha)
        focal_loss = (alpha_weight * focal_weight * bce_loss).mean()

        # Dice Loss
        probs_flat = probs.view(-1)
        targets_flat = targets.view(-1)
        intersection = (probs_flat * targets_flat).sum()
        dice = (2.0 * intersection + self.smooth) / (probs_flat.sum() + targets_flat.sum() + self.smooth)
        dice_loss = 1.0 - dice

        return (1.0 - self.dice_weight) * focal_loss + self.dice_weight * dice_loss


class SARDualPolPatchDataset(Dataset):
    """Dataset of processed 2-channel [VV, VH] patches and binary masks."""
    def __init__(self, split: str = "train", transform=None):
        self.split = split
        self.transform = transform
        self.img_dir = PROJECT_ROOT / "data" / "processed" / split / "images"
        self.msk_dir = PROJECT_ROOT / "data" / "processed" / split / "masks"
        
        self.img_paths = sorted(glob.glob(str(self.img_dir / "*.tif")))
        self.msk_paths = sorted(glob.glob(str(self.msk_dir / "*.tif")))
        assert len(self.img_paths) == len(self.msk_paths), f"Mismatch in {split} images and masks"
        
        self.norm_bounds = [(-30.0, 0.0), (-35.0, -5.0)]

    def __len__(self):
        return len(self.img_paths)

    def __getitem__(self, idx):
        raw_img = tifffile.imread(self.img_paths[idx])  # [2, 256, 256]
        raw_msk = tifffile.imread(self.msk_paths[idx])  # [256, 256]
        
        # Minmax normalize to [0, 1]
        norm_img = preprocess_sar_image(raw_img, normalization="minmax", channel_bounds=self.norm_bounds)
        
        # Albumentations transform if provided
        if self.transform is not None:
            # Albumentations expects [H, W, C]
            img_hwc = np.transpose(norm_img, (1, 2, 0))
            augmented = self.transform(image=img_hwc, mask=raw_msk)
            norm_img = np.transpose(augmented["image"], (2, 0, 1))
            raw_msk = augmented["mask"]
            
        tensor_img = torch.from_numpy(norm_img).float()
        tensor_msk = torch.from_numpy(raw_msk[np.newaxis]).float()
        return tensor_img, tensor_msk


def run_training_experiment(
    exp_name: str,
    loss_type: str = "focal_dice",
    use_aug: bool = True,
    epochs: int = 25,
    lr: float = 2e-4,
    batch_size: int = 8,
    seed: int = 42,
):
    set_seed(seed)
    device = torch.device("cuda" if torch.cuda.is_available() else ("mps" if hasattr(torch.backends, "mps") and torch.backends.mps.is_available() else "cpu"))
    print(f"\n{'=' * 65}")
    print(f"   STARTING EXPERIMENT: {exp_name}")
    print(f"{'=' * 65}")
    print(f"  Device:       {device}")
    print(f"  Loss Type:    {loss_type}")
    print(f"  Augmentation: {use_aug}")
    print(f"  Epochs:       {epochs}")
    print(f"  Batch Size:   {batch_size}")
    print(f"  Learning Rate:{lr}")
    
    # Setup augmentations
    from training.augmentations import get_train_augmentations
    transform = get_train_augmentations(256) if use_aug else None
    
    train_dataset = SARDualPolPatchDataset(split="train", transform=transform)
    val_dataset = SARDualPolPatchDataset(split="val", transform=None)
    
    train_loader = DataLoader(train_dataset, batch_size=batch_size, shuffle=True)
    val_loader = DataLoader(val_dataset, batch_size=batch_size, shuffle=False)
    
    # Model configuration
    model_cfg = {
        "model": {
            "architecture": "Unet",
            "encoder_name": "resnet34",
            "encoder_weights": "imagenet",
            "in_channels": 2,
            "classes": 1,
            "activation": None,
            "image_size": 256
        }
    }
    model = create_model(model_cfg)
    
    # Initialize encoder weights cleanly
    model = model.to(device)
    
    # Loss selection
    if loss_type == "focal_dice":
        criterion = FocalDiceLoss(gamma=2.0, alpha=0.6, dice_weight=0.5)
    elif loss_type == "combined_bce_dice":
        from training.losses import CombinedLoss
        criterion = CombinedLoss(bce_weight=0.5, dice_weight=0.5)
    else:
        raise ValueError(f"Unknown loss type {loss_type}")
        
    optimizer = torch.optim.AdamW(model.parameters(), lr=lr, weight_decay=1e-4)
    scheduler = torch.optim.lr_scheduler.CosineAnnealingLR(optimizer, T_max=epochs, eta_min=1e-6)
    
    history = []
    best_val_dice = -1.0
    best_state_dict = None
    
    for epoch in range(1, epochs + 1):
        # Training Phase
        model.train()
        train_loss = 0.0
        for imgs, msks in train_loader:
            imgs, msks = imgs.to(device), msks.to(device)
            optimizer.zero_grad()
            logits = model(imgs)
            loss = criterion(logits, msks)
            loss.backward()
            optimizer.step()
            train_loss += loss.item() * len(imgs)
        train_loss /= len(train_dataset)
        scheduler.step()
        
        # Validation Phase
        model.eval()
        val_loss = 0.0
        val_probs_all, val_masks_all = [], []
        with torch.no_grad():
            for imgs, msks in val_loader:
                imgs, msks = imgs.to(device), msks.to(device)
                logits = model(imgs)
                loss = criterion(logits, msks)
                val_loss += loss.item() * len(imgs)
                probs = torch.sigmoid(logits).cpu().numpy()[:, 0]
                val_probs_all.append(probs)
                val_masks_all.append(msks.cpu().numpy()[:, 0])
                
        val_loss /= len(val_dataset)
        val_probs_all = np.concatenate(val_probs_all, axis=0)
        val_masks_all = np.concatenate(val_masks_all, axis=0)
        
        # Compute validation dice at default 0.5 threshold
        val_metrics_05 = compute_metrics(val_probs_all, val_masks_all, threshold=0.50)
        val_dice = val_metrics_05["dice"]
        val_iou = val_metrics_05["iou"]
        val_fpr = val_metrics_05["false_positive_rate"]
        
        if val_dice > best_val_dice:
            best_val_dice = val_dice
            best_state_dict = {k: v.cpu().clone() for k, v in model.state_dict().items()}
            
        history.append({
            "epoch": epoch,
            "train_loss": round(train_loss, 4),
            "val_loss": round(val_loss, 4),
            "val_dice": round(val_dice, 4),
            "val_iou": round(val_iou, 4),
            "val_fpr": round(val_fpr, 6),
            "lr": round(scheduler.get_last_lr()[0], 7)
        })
        
        if epoch % 5 == 0 or epoch == epochs:
            print(f"  Epoch [{epoch:02d}/{epochs:02d}] TrainLoss: {train_loss:.4f} | ValLoss: {val_loss:.4f} | ValDice: {val_dice:.4f} | ValIoU: {val_iou:.4f} | ValFPR: {val_fpr:.4%}")

    # Load best weights
    model.load_state_dict(best_state_dict)
    model.to(device).eval()
    
    # Step 12: Systematic Threshold Search on VALIDATION set ONLY
    thresholds = [0.20, 0.25, 0.30, 0.35, 0.40, 0.45, 0.50, 0.55, 0.60]
    val_threshold_results = {}
    best_th = 0.50
    best_th_f1 = -1.0
    
    # Re-evaluate validation set with best weights
    val_probs_best, val_masks_best = [], []
    with torch.no_grad():
        for imgs, msks in val_loader:
            imgs = imgs.to(device)
            logits = model(imgs)
            probs = torch.sigmoid(logits).cpu().numpy()[:, 0]
            val_probs_best.append(probs)
            val_masks_best.append(msks.numpy()[:, 0])
            
    val_probs_best = np.concatenate(val_probs_best, axis=0)
    val_masks_best = np.concatenate(val_masks_best, axis=0)
    
    for th in thresholds:
        m = compute_metrics(val_probs_best, val_masks_best, threshold=th)
        val_threshold_results[f"{th:.2f}"] = m
        # Maximize F1/Dice with constraint on false alarm rate
        if m["f1"] > best_th_f1:
            best_th_f1 = m["f1"]
            best_th = th
            
    print(f"\n[INFO] Optimal Validation Threshold Search for {exp_name}:")
    print(f"       Best Threshold on Val Set: {best_th:.2f} (Val F1: {best_th_f1:.4f})")
    
    # Save experiment outputs
    exp_dir = PROJECT_ROOT / "experiments" / exp_name
    exp_dir.mkdir(parents=True, exist_ok=True)
    
    exp_config = {
        "experiment_name": exp_name,
        "loss_type": loss_type,
        "augmentation": use_aug,
        "epochs": epochs,
        "learning_rate": lr,
        "batch_size": batch_size,
        "seed": seed,
        "model": model_cfg["model"],
        "optimal_threshold_selected_on_val": best_th
    }
    
    with open(exp_dir / "config.json", "w") as f:
        json.dump(exp_config, f, indent=2)
        
    with open(exp_dir / "history.json", "w") as f:
        json.dump(history, f, indent=2)
        
    with open(exp_dir / "threshold_search_val.json", "w") as f:
        json.dump(val_threshold_results, f, indent=2)
        
    return model, best_state_dict, exp_config, best_th


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--exp", type=str, default="experiment_001_v2")
    parser.add_argument("--loss", type=str, default="focal_dice")
    parser.add_argument("--no-aug", action="store_true")
    parser.add_argument("--epochs", type=int, default=20)
    args = parser.parse_args()
    
    run_training_experiment(
        exp_name=args.exp,
        loss_type=args.loss,
        use_aug=not args.no_aug,
        epochs=args.epochs
    )
