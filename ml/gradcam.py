"""DRISHTI AI — Grad-CAM Explainability Module for ResNet-50.

Hooks into the final residual bottleneck convolution (layer4[-1].conv3),
computes gradients with respect to the predicted currency denomination logit,
generates a localized activation heatmap, and renders an overlay.
"""

from __future__ import annotations

import base64
import io
from typing import Optional, Tuple

import numpy as np
import torch
import torch.nn as nn
from PIL import Image


class GradCAM:
    """Computes Grad-CAM visualizations for ResNet-50."""

    def __init__(self, model: nn.Module, target_layer: Optional[nn.Module] = None):
        self.model = model
        self.model.eval()

        # Resolve the final convolutional layer (supports ResNet-18, ResNet-50, MobileNetV3)
        if target_layer is not None:
            self.target_layer = target_layer
        elif hasattr(self.model, "layer4"):
            last_block = self.model.layer4[-1]
            if hasattr(last_block, "conv3"):
                self.target_layer = last_block.conv3  # ResNet-50 / ResNet-101
            elif hasattr(last_block, "conv2"):
                self.target_layer = last_block.conv2  # ResNet-18 / ResNet-34
            else:
                self.target_layer = last_block
        elif hasattr(self.model, "features"):
            self.target_layer = self.model.features[-1]  # MobileNetV3
        else:
            convs = [m for m in self.model.modules() if isinstance(m, nn.Conv2d)]
            self.target_layer = convs[-1] if convs else self.model

        self.activations: Optional[torch.Tensor] = None
        self.gradients: Optional[torch.Tensor] = None

        # Register forward and backward hooks
        self.forward_handle = self.target_layer.register_forward_hook(self._save_activation)
        self.backward_handle = self.target_layer.register_full_backward_hook(self._save_gradient)

    def _save_activation(self, module, input, output):
        self.activations = output.detach()

    def _save_gradient(self, module, grad_input, grad_output):
        self.gradients = grad_output[0].detach()

    def generate_heatmap(
        self,
        input_tensor: torch.Tensor,
        target_class_idx: Optional[int] = None,
    ) -> np.ndarray:
        """Generate normalized 2D Grad-CAM heatmap for input tensor [1, 3, 224, 224]."""
        self.model.zero_grad()

        output = self.model(input_tensor)

        if target_class_idx is None:
            target_class_idx = output.argmax(dim=1).item()

        score = output[0, target_class_idx]
        score.backward(retain_graph=True)

        # Global average pool the gradients across spatial dimensions
        # gradients shape: [1, C, H, W]
        weights = self.gradients.mean(dim=(2, 3), keepdim=True)  # [1, C, 1, 1]

        # Weighted combination of activation maps
        cam = (weights * self.activations).sum(dim=1, keepdim=True)  # [1, 1, H, W]
        cam = nn.functional.relu(cam)  # Discard negative contributions

        # Resize to input image resolution (224, 224)
        cam = nn.functional.interpolate(
            cam,
            size=(input_tensor.shape[2], input_tensor.shape[3]),
            mode="bilinear",
            align_corners=False,
        )

        cam_np = cam.squeeze().cpu().numpy()
        cam_min, cam_max = cam_np.min(), cam_np.max()
        if cam_max > cam_min:
            cam_np = (cam_np - cam_min) / (cam_max - cam_min)
        else:
            cam_np = np.zeros_like(cam_np)

        return cam_np

    def generate_overlay_base64(
        self,
        raw_pil_image: Image.Image,
        input_tensor: torch.Tensor,
        target_class_idx: Optional[int] = None,
        alpha: float = 0.5,
    ) -> str:
        """Overlay Grad-CAM heatmap on original image and return as base64 JPEG string."""
        heatmap_2d = self.generate_heatmap(input_tensor, target_class_idx)

        # Convert original image to RGB array
        orig_img = raw_pil_image.convert("RGB").resize((224, 224))
        orig_np = np.array(orig_img, dtype=np.float32) / 255.0

        # Create pseudo-colored heatmap (Teal to Amber/Ruby gradient)
        # Low activations: transparent/dark; High activations: vibrant teal / warm glow
        r = heatmap_2d
        g = np.sin(heatmap_2d * np.pi)
        b = 1.0 - heatmap_2d
        color_map = np.stack([r, g, b], axis=-1)

        # Blend original with heatmap
        overlay = (1.0 - alpha) * orig_np + alpha * color_map
        overlay = np.clip(overlay * 255.0, 0, 255).astype(np.uint8)

        overlay_pil = Image.fromarray(overlay)
        buf = io.BytesIO()
        overlay_pil.save(buf, format="JPEG", quality=88)
        buf.seek(0)
        b64 = base64.b64encode(buf.read()).decode("utf-8")
        return f"data:image/jpeg;base64,{b64}"

    def remove_hooks(self):
        """Clean up hooks to prevent memory leaks."""
        self.forward_handle.remove()
        self.backward_handle.remove()
