"""
SlickTrace — Segmentation Loss Functions

Combined BCE + Dice loss for oil spill segmentation,
handling the severe class imbalance (small oil regions vs. large background).
"""

import torch
import torch.nn as nn
import torch.nn.functional as F


class DiceLoss(nn.Module):
    """
    Dice Loss for binary segmentation.

    Dice = 2 * |X ∩ Y| / (|X| + |Y|)
    DiceLoss = 1 - Dice

    Works directly on logits (applies sigmoid internally).
    """

    def __init__(self, smooth: float = 1.0):
        """
        Args:
            smooth: Smoothing factor to avoid division by zero.
                    Also known as Laplace smoothing.
        """
        super().__init__()
        self.smooth = smooth

    def forward(self, logits: torch.Tensor, targets: torch.Tensor) -> torch.Tensor:
        """
        Args:
            logits: Model output logits, shape [B, 1, H, W].
            targets: Binary ground truth, shape [B, 1, H, W].

        Returns:
            Scalar dice loss.
        """
        probs = torch.sigmoid(logits)

        # Flatten
        probs_flat = probs.view(-1)
        targets_flat = targets.view(-1)

        intersection = (probs_flat * targets_flat).sum()
        dice = (2.0 * intersection + self.smooth) / (
            probs_flat.sum() + targets_flat.sum() + self.smooth
        )

        return 1.0 - dice


class CombinedLoss(nn.Module):
    """
    Combined loss: weighted sum of BCEWithLogitsLoss and DiceLoss.

    Loss = bce_weight * BCE + dice_weight * Dice

    This combination addresses class imbalance:
    - BCE provides stable pixel-level gradients
    - Dice directly optimizes the overlap metric
    """

    def __init__(
        self,
        bce_weight: float = 0.5,
        dice_weight: float = 0.5,
        smooth: float = 1.0,
    ):
        """
        Args:
            bce_weight: Weight for BCEWithLogitsLoss.
            dice_weight: Weight for DiceLoss.
            smooth: Smoothing factor for DiceLoss.
        """
        super().__init__()
        self.bce_weight = bce_weight
        self.dice_weight = dice_weight
        self.bce_loss = nn.BCEWithLogitsLoss()
        self.dice_loss = DiceLoss(smooth=smooth)

    def forward(self, logits: torch.Tensor, targets: torch.Tensor) -> torch.Tensor:
        """
        Args:
            logits: Model output logits, shape [B, 1, H, W].
            targets: Binary ground truth, shape [B, 1, H, W].

        Returns:
            Scalar combined loss.
        """
        bce = self.bce_loss(logits, targets)
        dice = self.dice_loss(logits, targets)
        return self.bce_weight * bce + self.dice_weight * dice


def create_loss(config: dict) -> nn.Module:
    """
    Factory function to create the loss based on configuration.

    Args:
        config: Loss configuration dictionary.

    Returns:
        A PyTorch loss module.
    """
    loss_cfg = config.get("loss", {})
    loss_type = loss_cfg.get("type", "combined")
    bce_weight = loss_cfg.get("bce_weight", 0.5)
    dice_weight = loss_cfg.get("dice_weight", 0.5)
    smooth = loss_cfg.get("smooth", 1.0)

    if loss_type == "bce":
        return nn.BCEWithLogitsLoss()
    elif loss_type == "dice":
        return DiceLoss(smooth=smooth)
    elif loss_type == "combined":
        return CombinedLoss(
            bce_weight=bce_weight,
            dice_weight=dice_weight,
            smooth=smooth,
        )
    else:
        raise ValueError(f"Unknown loss type: {loss_type}")
