"""
MarineTrace — U-Net Model for SAR Oil Spill Segmentation

Uses segmentation_models_pytorch with an ImageNet-pretrained encoder
adapted for 2-channel SAR input (VV + VH).
"""

import torch
import torch.nn as nn

try:
    import segmentation_models_pytorch as smp
    SMP_AVAILABLE = True
except ImportError:
    SMP_AVAILABLE = False


class UNet(nn.Module):
    """
    U-Net semantic segmentation model for oil spill detection.

    Uses segmentation_models_pytorch with a configurable encoder backbone.
    The encoder is pre-trained on ImageNet and automatically adapted for
    non-RGB (2-channel SAR) input by SMP.

    Input:  [batch, 2, H, W]  — VV and VH channels
    Output: [batch, 1, H, W]  — oil probability logits (no sigmoid)
    """

    def __init__(
        self,
        encoder_name: str = "resnet34",
        encoder_weights: str = "imagenet",
        in_channels: int = 2,
        classes: int = 1,
        activation=None,
    ):
        super().__init__()

        if not SMP_AVAILABLE:
            raise ImportError(
                "segmentation_models_pytorch is required. "
                "Install with: pip install segmentation-models-pytorch"
            )

        self.model = smp.Unet(
            encoder_name=encoder_name,
            encoder_weights=encoder_weights,
            in_channels=in_channels,
            classes=classes,
            activation=activation,  # None → raw logits for BCEWithLogitsLoss
        )
        self.encoder_name = encoder_name
        self.in_channels = in_channels
        self.classes = classes

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        """
        Forward pass.

        Args:
            x: Input tensor of shape [batch, in_channels, H, W].
               H and W must be divisible by 32.

        Returns:
            Logits tensor of shape [batch, classes, H, W].
        """
        return self.model(x)


class FallbackUNet(nn.Module):
    """
    Lightweight fallback U-Net implementation for when segmentation_models_pytorch
    is not available. Uses a simple encoder-decoder architecture.

    Input:  [batch, 2, H, W]
    Output: [batch, 1, H, W]  — logits
    """

    def __init__(self, in_channels: int = 2, classes: int = 1):
        super().__init__()
        self.in_channels = in_channels
        self.classes = classes

        # Encoder
        self.enc1 = self._block(in_channels, 64)
        self.enc2 = self._block(64, 128)
        self.enc3 = self._block(128, 256)
        self.enc4 = self._block(256, 512)

        self.pool = nn.MaxPool2d(2, 2)

        # Bottleneck
        self.bottleneck = self._block(512, 1024)

        # Decoder
        self.up4 = nn.ConvTranspose2d(1024, 512, kernel_size=2, stride=2)
        self.dec4 = self._block(1024, 512)
        self.up3 = nn.ConvTranspose2d(512, 256, kernel_size=2, stride=2)
        self.dec3 = self._block(512, 256)
        self.up2 = nn.ConvTranspose2d(256, 128, kernel_size=2, stride=2)
        self.dec2 = self._block(256, 128)
        self.up1 = nn.ConvTranspose2d(128, 64, kernel_size=2, stride=2)
        self.dec1 = self._block(128, 64)

        # Output — no activation (raw logits)
        self.out_conv = nn.Conv2d(64, classes, kernel_size=1)

    @staticmethod
    def _block(in_ch: int, out_ch: int) -> nn.Sequential:
        return nn.Sequential(
            nn.Conv2d(in_ch, out_ch, kernel_size=3, padding=1, bias=False),
            nn.BatchNorm2d(out_ch),
            nn.ReLU(inplace=True),
            nn.Conv2d(out_ch, out_ch, kernel_size=3, padding=1, bias=False),
            nn.BatchNorm2d(out_ch),
            nn.ReLU(inplace=True),
        )

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        # Encoder
        e1 = self.enc1(x)
        e2 = self.enc2(self.pool(e1))
        e3 = self.enc3(self.pool(e2))
        e4 = self.enc4(self.pool(e3))

        # Bottleneck
        b = self.bottleneck(self.pool(e4))

        # Decoder with skip connections
        d4 = self.dec4(torch.cat([self.up4(b), e4], dim=1))
        d3 = self.dec3(torch.cat([self.up3(d4), e3], dim=1))
        d2 = self.dec2(torch.cat([self.up2(d3), e2], dim=1))
        d1 = self.dec1(torch.cat([self.up1(d2), e1], dim=1))

        return self.out_conv(d1)


def create_model(config: dict) -> nn.Module:
    """
    Factory function to create the appropriate model based on configuration.

    Args:
        config: Model configuration dictionary with keys:
            - encoder_name (str)
            - encoder_weights (str or None)
            - in_channels (int)
            - classes (int)
            - activation (str or None)

    Returns:
        A PyTorch nn.Module.
    """
    model_cfg = config.get("model", {})

    encoder_name = model_cfg.get("encoder_name", "resnet34")
    encoder_weights = model_cfg.get("encoder_weights", "imagenet")
    in_channels = model_cfg.get("in_channels", 2)
    classes = model_cfg.get("classes", 1)
    activation = model_cfg.get("activation", None)

    if SMP_AVAILABLE:
        return UNet(
            encoder_name=encoder_name,
            encoder_weights=encoder_weights,
            in_channels=in_channels,
            classes=classes,
            activation=activation,
        )
    else:
        print(
            "[WARNING] segmentation_models_pytorch not available. "
            "Using fallback U-Net (no pretrained encoder)."
        )
        return FallbackUNet(in_channels=in_channels, classes=classes)
