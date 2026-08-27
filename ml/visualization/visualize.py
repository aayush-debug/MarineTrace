"""
MarineTrace — Visualization

Generates 6-panel visualization figures:
1. Original VV channel
2. Original VH channel
3. Ground-truth mask
4. Predicted probability map
5. Binary prediction
6. Polygon overlay on VV
"""

import os
import sys
from pathlib import Path
from typing import Optional

import numpy as np

try:
    import matplotlib

    matplotlib.use("Agg")  # Non-interactive backend
    import matplotlib.pyplot as plt
    import matplotlib.patches as mpatches
    from matplotlib.colors import ListedColormap

    MPL_AVAILABLE = True
except ImportError:
    MPL_AVAILABLE = False

PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT))


def create_visualization(
    vv: np.ndarray,
    vh: np.ndarray,
    ground_truth: np.ndarray | None,
    prob_map: np.ndarray,
    binary_pred: np.ndarray,
    candidates: list[dict] | None = None,
    title: str = "Oil Spill Detection",
    output_path: str | None = None,
    figsize: tuple = (18, 12),
    dpi: int = 150,
    colormap: str = "RdYlGn_r",
) -> None:
    """
    Generate a 6-panel visualization figure.

    Args:
        vv: VV channel image [H, W].
        vh: VH channel image [H, W].
        ground_truth: Binary ground truth mask [H, W], or None.
        prob_map: Predicted probability map [H, W], values in [0, 1].
        binary_pred: Binary prediction mask [H, W].
        candidates: Optional list of candidate dicts with bbox info.
        title: Figure title.
        output_path: Path to save the figure. If None, shows interactively.
        figsize: Figure size.
        dpi: Resolution.
        colormap: Colormap for probability map.
    """
    if not MPL_AVAILABLE:
        print("[WARNING] matplotlib not available. Skipping visualization.")
        return

    fig, axes = plt.subplots(2, 3, figsize=figsize)
    fig.suptitle(title, fontsize=16, fontweight="bold")

    # Panel 1: VV channel
    ax = axes[0, 0]
    ax.imshow(vv, cmap="gray", aspect="auto")
    ax.set_title("VV Channel (Sigma0 dB)", fontsize=12)
    ax.axis("off")

    # Panel 2: VH channel
    ax = axes[0, 1]
    ax.imshow(vh, cmap="gray", aspect="auto")
    ax.set_title("VH Channel (Sigma0 dB)", fontsize=12)
    ax.axis("off")

    # Panel 3: Ground truth
    ax = axes[0, 2]
    if ground_truth is not None:
        # Custom colormap: black=background, red=oil
        gt_cmap = ListedColormap(["black", "#FF4444"])
        ax.imshow(ground_truth, cmap=gt_cmap, vmin=0, vmax=1, aspect="auto")
        ax.set_title("Ground Truth", fontsize=12)
    else:
        ax.text(0.5, 0.5, "No Ground Truth\nAvailable",
                ha="center", va="center", transform=ax.transAxes, fontsize=14)
        ax.set_title("Ground Truth (N/A)", fontsize=12)
    ax.axis("off")

    # Panel 4: Probability map
    ax = axes[1, 0]
    im = ax.imshow(prob_map, cmap=colormap, vmin=0, vmax=1, aspect="auto")
    ax.set_title("Predicted Probability Map", fontsize=12)
    ax.axis("off")
    plt.colorbar(im, ax=ax, fraction=0.046, pad=0.04, label="Oil Probability")

    # Panel 5: Binary prediction
    ax = axes[1, 1]
    pred_cmap = ListedColormap(["black", "#FF8800"])
    ax.imshow(binary_pred, cmap=pred_cmap, vmin=0, vmax=1, aspect="auto")
    ax.set_title("Binary Prediction", fontsize=12)
    ax.axis("off")

    # Panel 6: Polygon overlay on VV
    ax = axes[1, 2]
    ax.imshow(vv, cmap="gray", aspect="auto")

    # Overlay binary prediction as transparent mask
    overlay = np.zeros((*binary_pred.shape, 4))
    overlay[binary_pred > 0] = [1.0, 0.2, 0.0, 0.4]  # Semi-transparent orange
    ax.imshow(overlay, aspect="auto")

    # Draw candidate bounding boxes
    if candidates:
        for cand in candidates:
            bbox = cand.get("bbox", {})
            if all(k in bbox for k in ["min_row", "min_col", "max_row", "max_col"]):
                r0, c0 = bbox["min_row"], bbox["min_col"]
                r1, c1 = bbox["max_row"], bbox["max_col"]
                rect = mpatches.Rectangle(
                    (c0, r0), c1 - c0, r1 - r0,
                    linewidth=2, edgecolor="cyan", facecolor="none",
                )
                ax.add_patch(rect)
                prob = cand.get("oil_probability", 0)
                cid = cand.get("candidate_id", "?")
                ax.text(
                    c0, r0 - 5,
                    f"#{cid} ({prob:.0%})",
                    color="cyan", fontsize=8, fontweight="bold",
                )

    ax.set_title("Detection Overlay on VV", fontsize=12)
    ax.axis("off")

    plt.tight_layout()

    if output_path:
        os.makedirs(os.path.dirname(output_path) if os.path.dirname(output_path) else ".", exist_ok=True)
        fig.savefig(output_path, dpi=dpi, bbox_inches="tight")
        plt.close(fig)
        print(f"[INFO] Visualization saved to {output_path}")
    else:
        plt.show()


def visualize_batch(
    images: np.ndarray,
    masks: np.ndarray | None,
    predictions: np.ndarray,
    threshold: float = 0.5,
    output_dir: str = "results/visualizations",
    max_samples: int = 8,
    candidates_list: list[list[dict]] | None = None,
):
    """
    Generate visualizations for a batch of samples.

    Args:
        images: Batch of SAR images [N, 2, H, W].
        masks: Batch of ground truth masks [N, 1, H, W] or None.
        predictions: Batch of probability maps [N, 1, H, W].
        threshold: Binarization threshold.
        output_dir: Directory to save visualizations.
        max_samples: Maximum number of samples to visualize.
        candidates_list: Optional list of candidate lists per sample.
    """
    os.makedirs(output_dir, exist_ok=True)
    n_samples = min(len(images), max_samples)

    for i in range(n_samples):
        vv = images[i, 0]  # [H, W]
        vh = images[i, 1] if images.shape[1] > 1 else images[i, 0]

        gt = masks[i, 0] if masks is not None else None
        prob = predictions[i, 0]
        binary = (prob > threshold).astype(np.float32)

        candidates = candidates_list[i] if candidates_list else None

        output_path = os.path.join(output_dir, f"sample_{i:04d}.png")
        create_visualization(
            vv=vv, vh=vh,
            ground_truth=gt,
            prob_map=prob,
            binary_pred=binary,
            candidates=candidates,
            title=f"Sample {i} — Oil Spill Detection",
            output_path=output_path,
        )

    print(f"[INFO] Generated {n_samples} visualizations in {output_dir}")
