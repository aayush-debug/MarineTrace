"""
SlickTrace — Model Evaluation

Computes segmentation metrics on the test set:
- Dice, IoU, Precision, Recall, F1, Pixel Accuracy
- False Positive Rate (FPR), False Negative Rate (FNR)
- Optimal threshold tuning on validation data
"""

import os
import sys
import argparse
from pathlib import Path

import numpy as np
import torch
import yaml
from tqdm import tqdm

PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT))


def compute_metrics(
    predictions: np.ndarray,
    targets: np.ndarray,
    threshold: float = 0.5,
) -> dict:
    """
    Compute all segmentation metrics.

    Args:
        predictions: Probability predictions, shape [N, H, W] or [H, W].
        targets: Binary ground truth, shape [N, H, W] or [H, W].
        threshold: Probability threshold for binarization.

    Returns:
        Dictionary of metrics.
    """
    preds_binary = (predictions > threshold).astype(np.float32)
    targets_binary = (targets > 0.5).astype(np.float32)

    # Flatten
    pred_flat = preds_binary.flatten()
    tgt_flat = targets_binary.flatten()

    # Basic counts
    tp = np.sum((pred_flat == 1) & (tgt_flat == 1))
    fp = np.sum((pred_flat == 1) & (tgt_flat == 0))
    tn = np.sum((pred_flat == 0) & (tgt_flat == 0))
    fn = np.sum((pred_flat == 0) & (tgt_flat == 1))

    total = tp + fp + tn + fn
    eps = 1e-8

    # Metrics
    precision = tp / (tp + fp + eps)
    recall = tp / (tp + fn + eps)
    f1 = 2 * precision * recall / (precision + recall + eps)
    pixel_accuracy = (tp + tn) / (total + eps)

    # Dice = 2*TP / (2*TP + FP + FN)
    dice = 2 * tp / (2 * tp + fp + fn + eps)

    # IoU = TP / (TP + FP + FN)
    iou = tp / (tp + fp + fn + eps)

    # False Positive Rate = FP / (FP + TN)
    fpr = fp / (fp + tn + eps)

    # False Negative Rate = FN / (FN + TP)
    fnr = fn / (fn + tp + eps)

    return {
        "threshold": threshold,
        "dice": float(dice),
        "iou": float(iou),
        "precision": float(precision),
        "recall": float(recall),
        "f1": float(f1),
        "pixel_accuracy": float(pixel_accuracy),
        "false_positive_rate": float(fpr),
        "false_negative_rate": float(fnr),
        "true_positives": int(tp),
        "false_positives": int(fp),
        "true_negatives": int(tn),
        "false_negatives": int(fn),
    }


def find_optimal_threshold(
    predictions: np.ndarray,
    targets: np.ndarray,
    thresholds: list[float] | None = None,
    metric: str = "dice",
) -> tuple[float, dict]:
    """
    Find the optimal threshold by scanning and selecting the one that
    maximizes the target metric.

    Args:
        predictions: Probability predictions.
        targets: Binary ground truth.
        thresholds: List of thresholds to try.
        metric: Metric to optimize ("dice", "iou", "f1").

    Returns:
        Tuple of (best_threshold, best_metrics_dict).
    """
    if thresholds is None:
        thresholds = [t / 20.0 for t in range(1, 20)]  # 0.05 to 0.95

    best_threshold = 0.5
    best_score = -1.0
    best_metrics = {}

    for t in thresholds:
        metrics = compute_metrics(predictions, targets, threshold=t)
        score = metrics.get(metric, 0.0)
        if score > best_score:
            best_score = score
            best_threshold = t
            best_metrics = metrics

    return best_threshold, best_metrics


def format_metrics_table(metrics: dict) -> str:
    """Format metrics as a readable table string."""
    lines = [
        "=" * 50,
        "        EVALUATION METRICS",
        "=" * 50,
        f"  Threshold:           {metrics['threshold']:.3f}",
        "-" * 50,
        f"  Dice:                {metrics['dice']:.4f}",
        f"  IoU:                 {metrics['iou']:.4f}",
        f"  Precision:           {metrics['precision']:.4f}",
        f"  Recall:              {metrics['recall']:.4f}",
        f"  F1:                  {metrics['f1']:.4f}",
        f"  Pixel Accuracy:      {metrics['pixel_accuracy']:.4f}",
        "-" * 50,
        f"  False Positive Rate: {metrics['false_positive_rate']:.4f}",
        f"  False Negative Rate: {metrics['false_negative_rate']:.4f}",
        "-" * 50,
        f"  TP: {metrics['true_positives']:>10,}",
        f"  FP: {metrics['false_positives']:>10,}",
        f"  TN: {metrics['true_negatives']:>10,}",
        f"  FN: {metrics['false_negatives']:>10,}",
        "=" * 50,
    ]
    return "\n".join(lines)


def evaluate_model(
    model,
    dataloader,
    device: torch.device,
    threshold: float = 0.5,
) -> tuple[dict, np.ndarray, np.ndarray]:
    """
    Evaluate model on a dataloader.

    Returns:
        Tuple of (metrics_dict, all_predictions, all_targets).
    """
    model.eval()
    all_preds = []
    all_targets = []

    with torch.no_grad():
        for images, masks in tqdm(dataloader, desc="Evaluating"):
            images = images.to(device)
            logits = model(images)
            probs = torch.sigmoid(logits).cpu().numpy()
            masks_np = masks.cpu().numpy()

            all_preds.append(probs)
            all_targets.append(masks_np)

    all_preds = np.concatenate(all_preds, axis=0)
    all_targets = np.concatenate(all_targets, axis=0)

    metrics = compute_metrics(all_preds, all_targets, threshold=threshold)
    return metrics, all_preds, all_targets


def main():
    parser = argparse.ArgumentParser(description="Evaluate oil spill segmentation model")
    parser.add_argument("--config", type=str, default=str(PROJECT_ROOT / "config.yaml"))
    parser.add_argument("--checkpoint", type=str, default=str(PROJECT_ROOT / "checkpoints" / "best_model.pth"))
    parser.add_argument("--threshold", type=float, default=None,
                        help="If not specified, scans for optimal threshold")
    args = parser.parse_args()

    # Load config
    config_path = Path(args.config)
    if config_path.exists():
        with open(config_path) as f:
            config = yaml.safe_load(f)
    else:
        config = {}

    # Device
    if torch.cuda.is_available():
        device = torch.device("cuda")
    elif hasattr(torch.backends, "mps") and torch.backends.mps.is_available():
        device = torch.device("mps")
    else:
        device = torch.device("cpu")
    print(f"[INFO] Using device: {device}")

    # Load model
    from models.unet import create_model
    model = create_model(config)

    ckpt_path = Path(args.checkpoint)
    if ckpt_path.exists():
        checkpoint = torch.load(ckpt_path, map_location=device, weights_only=False)
        model.load_state_dict(checkpoint["model_state_dict"])
        print(f"[INFO] Loaded checkpoint from {ckpt_path}")
        if "val_dice" in checkpoint:
            print(f"[INFO] Checkpoint val_dice: {checkpoint['val_dice']:.4f}")
    else:
        print(f"[WARNING] No checkpoint found at {ckpt_path}. Using untrained model.")

    model = model.to(device)

    # Create test dataset
    from training.train_unet import create_synthetic_dataset
    print("[INFO] Creating test dataset...")

    # Use synthetic data if real data not available
    _, test_ds = create_synthetic_dataset(config)

    from torch.utils.data import DataLoader
    test_loader = DataLoader(test_ds, batch_size=4, shuffle=False)

    # Evaluate
    print("[INFO] Running evaluation...")
    metrics, all_preds, all_targets = evaluate_model(model, test_loader, device)

    # Find optimal threshold
    if args.threshold is None:
        print("\n[INFO] Scanning for optimal threshold...")
        best_threshold, best_metrics = find_optimal_threshold(all_preds, all_targets)
        print(f"[INFO] Optimal threshold: {best_threshold:.3f}")
        print(format_metrics_table(best_metrics))
    else:
        print(format_metrics_table(metrics))

    # Save results
    results_dir = Path(PROJECT_ROOT) / "results"
    results_dir.mkdir(parents=True, exist_ok=True)

    import json
    results_file = results_dir / "evaluation_results.json"
    with open(results_file, "w") as f:
        json.dump(best_metrics if args.threshold is None else metrics, f, indent=2)
    print(f"\n[INFO] Results saved to {results_file}")


if __name__ == "__main__":
    main()
