"""NIRA — Image Quality Assessment & Currency Candidate Gate Engine.

Inspects currency captures for blur (Laplacian variance), illumination extremes,
textural edge density, color variance, and candidate region suitability.
Distinguishes genuine currency candidates from uniform backgrounds, blank surfaces,
and unidentifiable non-currency captures before model classification.
"""

from __future__ import annotations

import math
from typing import Any, Dict, Optional, Tuple
from PIL import Image, ImageFilter, ImageStat


def calculate_laplacian_variance(gray_pil: Image.Image) -> float:
    """Calculate variance of Laplacian as a measure of edge sharpness / blur."""
    laplacian_kernel = ImageFilter.Kernel(
        size=(3, 3),
        kernel=[0, 1, 0, 1, -4, 1, 0, 1, 0],
        scale=1,
        offset=0,
    )
    lap = gray_pil.filter(laplacian_kernel)
    pixels = list(lap.getdata())
    n = len(pixels)
    if n == 0:
        return 0.0
    mean = sum(pixels) / n
    variance = sum((p - mean) ** 2 for p in pixels) / n
    return variance


def calculate_edge_density(gray_pil: Image.Image, threshold: int = 38) -> float:
    """Compute the ratio of high-gradient edge pixels to total pixels."""
    edges = gray_pil.filter(ImageFilter.FIND_EDGES)
    pixels = list(edges.getdata())
    if not pixels:
        return 0.0
    edge_count = sum(1 for p in pixels if p > threshold)
    return edge_count / len(pixels)


def calculate_color_variation(rgb_pil: Image.Image) -> float:
    """Calculate average standard deviation across RGB channels to detect monochrome surfaces."""
    stat = ImageStat.Stat(rgb_pil)
    std_devs = stat.stddev
    if not std_devs:
        return 0.0
    return sum(std_devs[:3]) / min(len(std_devs[:3]), 3)


def calculate_spatial_heterogeneity(thumb_gray: Image.Image) -> Tuple[float, float]:
    """Compute standard deviation of patch contrast across an 8x8 grid.
    Distinguishes genuine currency (high spatial heterogeneity due to printed motifs and typography)
    from uniform textures like wood desks, bare skin, walls, or fabrics."""
    import numpy as np

    gray_arr = np.array(thumb_gray.resize((224, 224), Image.Resampling.BILINEAR), dtype=np.float32)
    patch_stds = []
    for r in range(0, 224, 28):
        for c in range(0, 224, 28):
            patch = gray_arr[r : r + 28, c : c + 28]
            patch_stds.append(float(np.std(patch)))
    if not patch_stds:
        return 0.0, 0.0
    return float(np.std(patch_stds)), float(np.mean(patch_stds))


def calculate_skin_ratio(thumb_rgb: Image.Image) -> float:
    """Calculate ratio of human skin chromaticity pixels using YCbCr space."""
    import numpy as np

    rgb_arr = np.array(thumb_rgb.resize((224, 224), Image.Resampling.BILINEAR), dtype=np.float32)
    R = rgb_arr[:, :, 0]
    G = rgb_arr[:, :, 1]
    B = rgb_arr[:, :, 2]
    Cb = 128.0 - 0.168736 * R - 0.331264 * G + 0.5 * B
    Cr = 128.0 + 0.5 * R - 0.418688 * G - 0.081312 * B
    skin_mask = (Cb >= 77) & (Cb <= 127) & (Cr >= 133) & (Cr <= 173)
    return float(np.mean(skin_mask))


def assess_image_quality(
    image: Image.Image,
    expected_mode: str = "auto",  # 'auto' | 'banknote' | 'coin'
    language: str = "en",
) -> Dict[str, Any]:
    """Perform comprehensive image quality & candidate region assessment with multilingual guidance."""
    width, height = image.size
    rgb_img = image.convert("RGB")
    gray = image.convert("L")

    # Fast 320x320 thumbnail for consistent, low-latency metrics
    thumb_gray = gray.copy()
    thumb_gray.thumbnail((320, 320), Image.Resampling.BILINEAR)

    thumb_rgb = rgb_img.copy()
    thumb_rgb.thumbnail((320, 320), Image.Resampling.BILINEAR)

    # 1. Blur Detection (Laplacian Variance)
    lap_var = calculate_laplacian_variance(thumb_gray)
    is_blurry = lap_var < 28.0

    # 2. Illumination Analysis
    histogram = gray.histogram()
    total_pixels = width * height
    mean_luminance = sum(i * count for i, count in enumerate(histogram)) / max(total_pixels, 1)

    is_too_dark = mean_luminance < 20.0
    is_too_bright = mean_luminance > 245.0

    # Localized severe specular glare detection (e.g., flash hotspot washing out coin or note relief)
    if not is_too_bright:
        import numpy as np

        thumb_arr = np.array(thumb_gray, dtype=np.uint8)
        th_h, th_w = thumb_arr.shape
        cy1, cy2 = int(th_h * 0.20), int(th_h * 0.80)
        cx1, cx2 = int(th_w * 0.20), int(th_w * 0.80)
        center_patch = thumb_arr[cy1:cy2, cx1:cx2]
        center_sat = float(np.mean(center_patch > 250))
        global_sat = float(np.mean(thumb_arr > 250))

        if center_sat > 0.10 or global_sat > 0.15:
            is_too_bright = True

    is_poorly_lit = is_too_dark or is_too_bright

    # 3. Geometry & Aspect Ratio
    aspect_ratio = max(width, height) / max(min(width, height), 1)
    framing_concern: Optional[str] = None

    if width < 120 or height < 120:
        framing_concern = "Image resolution is too low for accurate identification."
    elif expected_mode == "coin" and aspect_ratio > 2.4:
        framing_concern = "Frame looks elongated; coin appears distorted or cropped."
    elif expected_mode == "banknote" and aspect_ratio < 1.15:
        framing_concern = "Frame appears square; banknote may be partially out of view."

    # 4. Textural Edge Density, Spatial Heterogeneity, Skin Ratio & Color Variance
    edge_density = calculate_edge_density(thumb_gray, threshold=36)
    color_std = calculate_color_variation(thumb_rgb)
    spatial_hetero, mean_patch_std = calculate_spatial_heterogeneity(thumb_gray)
    skin_ratio = calculate_skin_ratio(thumb_rgb)

    # Candidate evaluation rules:
    # - Completely dark or blown out has no candidate
    # - Low edge density with zero spatial heterogeneity indicates empty desk or uniform surface
    # - High skin ratio with low spatial heterogeneity indicates hand/skin occluding the frame
    # - Blurry with zero edges indicates empty frame
    has_candidate = True
    candidate_reason = None

    if is_too_dark:
        has_candidate = False
        candidate_reason = "insufficient_illumination"
    elif is_too_bright:
        has_candidate = False
        candidate_reason = "excessive_glare"
    elif is_blurry and edge_density < 0.015:
        has_candidate = False
        candidate_reason = "blurry_no_edges"
    elif skin_ratio > 0.75 and spatial_hetero < 6.0:
        has_candidate = False
        candidate_reason = "hand_skin_dominant"
    elif spatial_hetero < 4.5 and edge_density < 0.035:
        has_candidate = False
        candidate_reason = "uniform_surface_no_currency"
    elif edge_density < 0.012 and color_std < 10.0:
        has_candidate = False
        candidate_reason = "blank_featureless_frame"

    candidate_type = "none"
    if has_candidate:
        if expected_mode == "coin" or (aspect_ratio < 1.35 and edge_density < 0.16):
            candidate_type = "coin"
        else:
            candidate_type = "banknote"

    # 5. Synthesize Multilingual Actionable Voice Guidance
    guidance_en = "Currency framed properly."
    guidance_ta = "பணம் சரியாக நிலைநிறுத்தப்பட்டுள்ளது."
    guidance_hi = "मुद्रा सही तरीके से केंद्रित है।"

    if is_too_dark:
        guidance_en = "Lighting is too dark. Turn on torch or move to brighter light."
        guidance_ta = "வெளிச்சம் குறைவாக உள்ளது. டார்ச்சை ஆன் செய்யவும் அல்லது வெளிச்சத்திற்கு வரவும்."
        guidance_hi = "रोशनी बहुत कम है। टॉर्च चालू करें या रोशनी में आएं।"
    elif is_too_bright:
        guidance_en = "Too much glare on currency surface. Tilt phone slightly to reduce glare."
        guidance_ta = "அதிக வெளிச்சம் அல்லது பிரதிபலிப்பு உள்ளது. போனை லேசாக சாய்க்கவும்."
        guidance_hi = "नोट पर बहुत तेज चमक है। फोन को थोड़ा झुकाएं।"
    elif is_blurry:
        guidance_en = "Image is blurry. Hold phone steady and capture again."
        guidance_ta = "படம் தெளிவாக இல்லை. போனை அசைக்காமல் பிடித்து மீண்டும் எடுக்கவும்."
        guidance_hi = "तस्वीर धुंधली है। फोन को स्थिर रखें और दोबारा प्रयास करें।"
    elif candidate_reason == "hand_skin_dominant":
        guidance_en = "Hand is blocking the view. Hold currency clearly in front of camera."
        guidance_ta = "கை பார்வையை மறைக்கிறது. பணத்தை கேமரா முன் தெளிவாகப் பிடிக்கவும்."
        guidance_hi = "हाथ दृश्य को रोक रहा है। मुद्रा को कैमरे के सामने स्पष्ट रूप से रखें।"
    elif candidate_reason == "uniform_surface_no_currency":
        guidance_en = "Empty surface detected. Place a currency note or coin within the frame."
        guidance_ta = "வெற்று மேற்பரப்பு. நோட்டு அல்லது நாணயத்தை சட்டத்திற்குள் வைக்கவும்."
        guidance_hi = "खाली सतह का पता चला। फ्रेम के भीतर एक नोट या सिक्का रखें।"
    elif not has_candidate:
        guidance_en = "I cannot identify a currency note or coin yet. Please point the camera at the currency and hold steady."
        guidance_ta = "பணம் அல்லது நாணயத்தை கேமரா முன் நிலையாகப் பிடிக்கவும்."
        guidance_hi = "कृपया फोन को किसी नोट या सिक्के के सामने स्थिर रखें।"
    elif framing_concern:
        guidance_en = f"Framing issue: {framing_concern} Move closer to the currency."
        guidance_ta = "நாணயம் அல்லது நோட்டை கேமராவிற்கு அருகில் கொண்டு வாருங்கள்."
        guidance_hi = "कैमरे को मुद्रा के थोड़ा और करीब लाएं।"

    selected_guidance = (
        guidance_ta if language == "ta" else (guidance_hi if language == "hi" else guidance_en)
    )

    is_usable = has_candidate and not (is_blurry and is_too_dark)

    return {
        "is_usable": is_usable,
        "has_currency_candidate": has_candidate,
        "candidate_type": candidate_type,
        "candidate_reason": candidate_reason,
        "edge_density": round(edge_density, 4),
        "color_std": round(color_std, 2),
        "spatial_heterogeneity": round(spatial_hetero, 2),
        "skin_ratio": round(skin_ratio, 3),
        "is_blurry": is_blurry,
        "blur_score": round(lap_var, 2),
        "mean_luminance": round(mean_luminance, 1),
        "is_too_dark": is_too_dark,
        "is_too_bright": is_too_bright,
        "is_poorly_lit": is_poorly_lit,
        "resolution": f"{width}x{height}",
        "aspect_ratio": round(aspect_ratio, 2),
        "framing_concern": framing_concern,
        "guidance_message": selected_guidance,
        "guidance_en": guidance_en,
        "guidance_ta": guidance_ta,
        "guidance_hi": guidance_hi,
    }
