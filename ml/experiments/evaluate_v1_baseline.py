"""
MarineTrace — Step 8: Evaluate V1 Baseline Model on Held-Out Test Set
"""

import os
import sys
import glob
import time
import json
from pathlib import Path

import numpy as np
import torch
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt

PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

from models.unet import create_model
from preprocessing.sar_preprocessing import preprocess_sar_image
from features.candidate_features import extract_candidates
from evaluation.evaluate import compute_metrics


def evaluate_v1():
    print("=" * 60)
    print("   EVALUATING V1 BASELINE MODEL (best_model.pth) ON TEST SPLIT")
    print("=" * 60)
    
    device = torch.device("mps" if torch.backends.mps.is_available() else "cpu")
    print(f"[INFO] Compute Device: {device}")
    
    ckpt_path = PROJECT_ROOT / "checkpoints" / "best_model.pth"
    assert ckpt_path.exists(), f"Checkpoint {ckpt_path} not found"
    
    checkpoint = torch.load(str(ckpt_path), map_location=device, weights_only=False)
    config = checkpoint.get("config", {})
    
    model = create_model(config)
    model.load_state_dict(checkpoint["model_state_dict"])
    model.to(device).eval()
    
    # Load test files
    test_img_dir = PROJECT_ROOT / "data" / "processed" / "test" / "images"
    test_msk_dir = PROJECT_ROOT / "data" / "processed" / "test" / "masks"
    
    img_files = sorted(glob.glob(str(test_img_dir / "*.tif")))
    msk_files = sorted(glob.glob(str(test_msk_dir / "*.tif")))
    
    print(f"[INFO] Loaded {len(img_files)} held-out test patches.")
    
    import tifffile
    
    norm_bounds = [(-30.0, 0.0), (-35.0, -5.0)]
    threshold = config.get("inference", {}).get("default_threshold", 0.35)
    
    all_probs = []
    all_targets = []
    all_images = []
    latencies = []
    
    total_candidate_tp = 0
    total_candidate_fp = 0
    
    for ip, mp in zip(img_files, msk_files):
        raw_img = tifffile.imread(ip)
        raw_msk = tifffile.imread(mp)
        
        # Radiometric preprocessing
        norm_img = preprocess_sar_image(raw_img, normalization="minmax", channel_bounds=norm_bounds)
        tensor_img = torch.from_numpy(norm_img[np.newaxis]).float().to(device)
        
        # Time forward pass
        t0 = time.perf_counter()
        with torch.no_grad():
            logits = model(tensor_img)
            probs = torch.sigmoid(logits).cpu().numpy()[0, 0]
        t1 = time.perf_counter()
        latencies.append((t1 - t0) * 1000.0)  # ms
        
        all_probs.append(probs)
        all_targets.append(raw_msk)
        all_images.append(norm_img)
        
        # Candidate level extraction
        candidates = extract_candidates(probs, threshold=threshold, min_area_pixels=50)
        gt_has_oil = (raw_msk > 0.5).sum() > 50
        if gt_has_oil:
            if len(candidates) > 0:
                total_candidate_tp += 1
        else:
            if len(candidates) > 0:
                total_candidate_fp += len(candidates)

    all_probs = np.array(all_probs)
    all_targets = np.array(all_targets)
    
    # Compute pixel metrics at production threshold 0.35
    metrics_035 = compute_metrics(all_probs, all_targets, threshold=0.35)
    metrics_050 = compute_metrics(all_probs, all_targets, threshold=0.50)
    
    mean_latency = float(np.mean(latencies))
    std_latency = float(np.std(latencies))
    
    results = {
        "model_version": "v1_baseline",
        "checkpoint": "ml/checkpoints/best_model.pth",
        "eval_dataset": "ml/data/processed/test",
        "num_test_patches": len(img_files),
        "production_threshold": 0.35,
        "latency_ms_per_patch": {
            "mean": round(mean_latency, 2),
            "std": round(std_latency, 2)
        },
        "metrics_at_default_threshold_0_35": metrics_035,
        "metrics_at_standard_threshold_0_50": metrics_050,
        "candidate_level": {
            "candidate_true_positives": total_candidate_tp,
            "candidate_false_positives": total_candidate_fp
        }
    }
    
    # Save metrics.json
    out_dir = PROJECT_ROOT / "experiments" / "baseline_v1"
    out_dir.mkdir(parents=True, exist_ok=True)
    with open(out_dir / "metrics.json", "w") as f:
        json.dump(results, f, indent=2)
    print(f"[INFO] Saved metrics to {out_dir / 'metrics.json'}")
    
    # Print Table
    print("\n" + "=" * 50)
    print("    V1 BASELINE TEST SET PERFORMANCE")
    print("=" * 50)
    print(f"  Dice Score (0.35):   {metrics_035['dice']:.4f}")
    print(f"  IoU Score  (0.35):   {metrics_035['iou']:.4f}")
    print(f"  Precision  (0.35):   {metrics_035['precision']:.4f}")
    print(f"  Recall     (0.35):   {metrics_035['recall']:.4f}")
    print(f"  F1 Score   (0.35):   {metrics_035['f1']:.4f}")
    print(f"  Pixel Acc  (0.35):   {metrics_035['pixel_accuracy']:.4f}")
    print(f"  Pixel FPR  (0.35):   {metrics_035['false_positive_rate']:.4%}")
    print(f"  Dice Score (0.50):   {metrics_050['dice']:.4f}")
    print(f"  Pixel FPR  (0.50):   {metrics_050['false_positive_rate']:.4%}")
    print(f"  Mean Latency:        {mean_latency:.2f} ms +- {std_latency:.2f} ms")
    print(f"  Candidate FP count:  {total_candidate_fp}")
    print("=" * 50)
    
    # Generate Qualitative Plots
    plots_dir = out_dir / "plots"
    plots_dir.mkdir(parents=True, exist_ok=True)
    
    for i in range(min(6, len(img_files))):
        fig, axes = plt.subplots(1, 4, figsize=(16, 4))
        
        vv = all_images[i][0]
        gt = all_targets[i]
        prob = all_probs[i]
        pred_bin = (prob > 0.35).astype(np.float32)
        
        im0 = axes[0].imshow(vv, cmap="gray")
        axes[0].set_title(f"Patch {i+1}: Sentinel-1 VV (norm)")
        axes[0].axis("off")
        plt.colorbar(im0, ax=axes[0], fraction=0.046, pad=0.04)
        
        im1 = axes[1].imshow(gt, cmap="Reds", vmin=0, vmax=1)
        axes[1].set_title("Ground Truth Mask")
        axes[1].axis("off")
        plt.colorbar(im1, ax=axes[1], fraction=0.046, pad=0.04)
        
        im2 = axes[2].imshow(prob, cmap="magma", vmin=0, vmax=1)
        axes[2].set_title("V1 Probability Map")
        axes[2].axis("off")
        plt.colorbar(im2, ax=axes[2], fraction=0.046, pad=0.04)
        
        im3 = axes[3].imshow(pred_bin, cmap="Blues", vmin=0, vmax=1)
        patch_dice = 2 * np.sum((pred_bin == 1) & (gt == 1)) / (np.sum(pred_bin) + np.sum(gt) + 1e-8)
        axes[3].set_title(f"V1 Prediction (Th=0.35)\nDice: {patch_dice:.3f}")
        axes[3].axis("off")
        plt.colorbar(im3, ax=axes[3], fraction=0.046, pad=0.04)
        
        plt.tight_layout()
        plot_path = plots_dir / f"test_sample_{i+1:02d}.png"
        plt.savefig(plot_path, dpi=120)
        plt.close(fig)
        
    print(f"[INFO] Qualitative comparison plots saved to {plots_dir}")


if __name__ == "__main__":
    evaluate_v1()
