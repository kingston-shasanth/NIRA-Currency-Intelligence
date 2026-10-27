"""DRISHTI / NIRA AI — Coin Region of Interest (ROI) Localization & Extraction Engine.

Preserves circular coin geometry and high-frequency edge relief by extracting
a resolution-preserving square crop around the coin candidate before tensor transformation.
Prevents uncropped 16:9 camera aspect-ratio squashing and small-object detail dilution.
"""

from __future__ import annotations

from typing import Optional, Tuple
import numpy as np
from PIL import Image, ImageFilter, ImageOps


def extract_coin_roi(
    image: Image.Image,
) -> Tuple[Image.Image, Optional[Tuple[int, int, int, int]]]:
    """Extract coin region of interest (ROI) preserving circular geometry and resolution.

    Returns:
        (cropped_image, bounding_box_tuple)
        where bounding_box_tuple is (x1, y1, x2, y2) in original image coordinates,
        or None if the image is already a tight crop filling the frame.
    """
    # Physical EXIF orientation normalization
    transposed = ImageOps.exif_transpose(image)
    w, h = transposed.size
    aspect = max(w, h) / max(min(w, h), 1)

    # 1. Fast 320px working thumbnail for rapid, deterministic localization (< 2ms)
    scale = 320.0 / max(w, h)
    tw, th = int(w * scale), int(h * scale)
    thumb_gray = transposed.resize((tw, th), Image.Resampling.BILINEAR).convert("L")

    # 2. Gradient / edge map
    edges = thumb_gray.filter(ImageFilter.FIND_EDGES)
    edge_arr_raw = np.array(edges, dtype=np.float32)
    edge_smooth_raw = np.array(
        Image.fromarray(edge_arr_raw.astype(np.uint8)).filter(ImageFilter.GaussianBlur(radius=2)),
        dtype=np.float32,
    )
    thresh_raw = max(float(np.percentile(edge_smooth_raw, 82)), 20.0)
    binary_raw = edge_smooth_raw > thresh_raw

    # 3. Pre-flight check: If image is already a tight square/rectangular dataset crop
    # (aspect < 1.40) and significant edge energy extends across the border margins (or aspect is exact 1:1 square),
    # the coin already occupies the entire image. Preserve image untouched to avoid clipping outer rim.
    if aspect < 1.40:
        mx = int(tw * 0.12)
        my = int(th * 0.12)
        outer_edges = (
            np.sum(binary_raw[:my, :])
            + np.sum(binary_raw[-my:, :])
            + np.sum(binary_raw[:, :mx])
            + np.sum(binary_raw[:, -mx:])
        )
        if aspect < 1.05 or outer_edges > np.sum(binary_raw) * 0.08:
            return transposed, None

    # For uncropped camera frames: clear outer boundary convolution padding artifacts
    edge_arr = edge_arr_raw.copy()
    edge_arr[:3, :] = 0.0
    edge_arr[-3:, :] = 0.0
    edge_arr[:, :3] = 0.0
    edge_arr[:, -3:] = 0.0

    edge_smooth = np.array(
        Image.fromarray(edge_arr.astype(np.uint8)).filter(ImageFilter.GaussianBlur(radius=2)),
        dtype=np.float32,
    )

    thresh = max(float(np.percentile(edge_smooth, 82)), 18.0)
    binary = edge_smooth > thresh

    # 4. Bounded Candidate Localization via Localized 2D Edge Density
    # Computes localized edge concentration across the entire frame.
    density = np.array(
        Image.fromarray(edge_arr.astype(np.uint8)).filter(ImageFilter.GaussianBlur(radius=8)),
        dtype=np.float32,
    )

    # Broad, gentle viewfinder preference (sigma=360px on a 320x180 frame drops by only ~15% at borders)
    # Serves strictly as a tie-breaker without suppressing off-center coins
    y_idx, x_idx = np.indices((th, tw))
    cx_frame, cy_frame = tw / 2.0, th / 2.0
    soft_center_prior = 1.0 / (1.0 + ((x_idx - cx_frame) ** 2 + (y_idx - cy_frame) ** 2) / (360.0**2))
    scored_density = density * soft_center_prior

    # Safe fallback if frame is featureless or lacks minimum edge structure
    if np.max(scored_density) < 4.0 or np.sum(binary) < 30:
        side = min(w, h)
        x1 = (w - side) // 2
        y1 = (h - side) // 2
        return transposed.crop((x1, y1, x1 + side, y1 + side)), (x1, y1, x1 + side, y1 + side)

    # Locate peak edge concentration candidate
    peak_y, peak_x = np.unravel_index(np.argmax(scored_density), scored_density.shape)

    # Isolate candidate coin cluster in neighborhood around peak
    dists_from_peak = np.sqrt((x_idx - peak_x) ** 2 + (y_idx - peak_y) ** 2)
    local_mask = binary & (dists_from_peak < 65)
    if np.sum(local_mask) < 20:
        local_mask = binary

    pts_y = y_idx[local_mask]
    pts_x = x_idx[local_mask]

    # 5. Robust Spatial Extent & Center Estimation
    # Uses 2nd and 98th coordinate percentiles to lock onto outer circular boundary
    # while eliminating isolated outlier noise.
    x_min = float(np.percentile(pts_x, 2))
    x_max = float(np.percentile(pts_x, 98))
    y_min = float(np.percentile(pts_y, 2))
    y_max = float(np.percentile(pts_y, 98))

    cand_cx = (x_min + x_max) / 2.0
    cand_cy = (y_min + y_max) / 2.0

    est_diameter = max(x_max - x_min, y_max - y_min)
    est_radius = max(est_diameter / 2.0, 14.0)

    # Optimal 22% margin around the outer rim so subsequent CenterCrop(224) preserves rim relief and edge beads
    box_radius = est_radius * 1.22

    orig_cx = cand_cx / scale
    orig_cy = cand_cy / scale
    orig_r = box_radius / scale

    # Enforce square aspect ratio to preserve circular coin geometry
    side = int(orig_r * 2.0)
    side = min(side, min(w, h))

    x1 = max(0, int(orig_cx - side / 2.0))
    y1 = max(0, int(orig_cy - side / 2.0))
    x2 = min(w, x1 + side)
    y2 = min(h, y1 + side)

    # Shift bounding box within image frame if boundary is touched
    if (x2 - x1) < side and x1 > 0:
        x1 = max(0, x2 - side)
    if (y2 - y1) < side and y1 > 0:
        y1 = max(0, y2 - side)

    bbox = (x1, y1, x2, y2)
    return transposed.crop(bbox), bbox
