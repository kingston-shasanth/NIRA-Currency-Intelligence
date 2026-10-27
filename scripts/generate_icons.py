"""Generate raster PNG icons for PWA, Android Launcher mipmaps, Splash screens, and web favicons
using the authoritative master image: Luxury Navy Gold Rupee N Emblem.png
"""
import base64
import hashlib
from io import BytesIO
from pathlib import Path
from PIL import Image, ImageDraw

ROOT_DIR = Path(__file__).resolve().parent.parent
MASTER_FILENAME = "Luxury Navy Gold Rupee N Emblem.png"
MASTER_PATH = ROOT_DIR / MASTER_FILENAME
EXPECTED_SHA256 = "81e9f8206fe5b818530b32b3469fea6e77dbbcbde717cfe9ddfaae124cb0e1a9"

# Official Brand Palette
NAVY_BG = (17, 20, 23, 255)            # #111417 (Matching Android system theme & app background)
DEEP_NAVY_BG = (11, 15, 25, 255)       # #0B0F19 (Deep luxury midnight)
GOLD_ACCENT = (223, 183, 87, 255)      # #DFB757 Champagne gold

def verify_master_image() -> Image.Image:
    """Verify master image exists, is unchanged, and load it."""
    if not MASTER_PATH.exists():
        raise FileNotFoundError(f"Master image not found at {MASTER_PATH}")
    
    with open(MASTER_PATH, "rb") as f:
        actual_hash = hashlib.sha256(f.read()).hexdigest()
    
    if actual_hash != EXPECTED_SHA256:
        raise ValueError(
            f"Master image SHA256 mismatch!\nExpected: {EXPECTED_SHA256}\nActual:   {actual_hash}"
        )
    
    print(f"[*] Verified immutable master image:")
    print(f"    Path:   {MASTER_PATH}")
    print(f"    SHA256: {actual_hash}")
    
    img = Image.open(MASTER_PATH).convert("RGBA")
    print(f"    Size:   {img.size}")
    print(f"    Mode:   {img.mode}")
    return img

def create_padded_icon(
    master: Image.Image,
    target_size: int,
    padding_ratio: float = 0.12,
    bg_color=None,
    shape: str = "transparent" # "transparent", "squircle", "round", "square"
) -> Image.Image:
    """Fit emblem cleanly onto square canvas with specified padding, preserving exact aspect ratio."""
    # Target canvas
    canvas = Image.new("RGBA", (target_size, target_size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(canvas)

    # Background shape
    if shape == "round":
        bg = bg_color or NAVY_BG
        draw.ellipse([0, 0, target_size, target_size], fill=bg)
    elif shape == "squircle":
        bg = bg_color or NAVY_BG
        radius = max(4, int(target_size * 0.22))
        draw.rounded_rectangle([0, 0, target_size, target_size], radius=radius, fill=bg)
    elif shape == "square":
        bg = bg_color or NAVY_BG
        draw.rectangle([0, 0, target_size, target_size], fill=bg)

    # Compute scaled size for master emblem
    available_size = int(target_size * (1.0 - 2 * padding_ratio))
    mw, mh = master.size
    scale = min(available_size / mw, available_size / mh)
    new_w = max(1, int(round(mw * scale)))
    new_h = max(1, int(round(mh * scale)))

    resized = master.resize((new_w, new_h), Image.Resampling.LANCZOS)

    # Center placement
    pos_x = (target_size - new_w) // 2
    pos_y = (target_size - new_h) // 2

    canvas.paste(resized, (pos_x, pos_y), resized)
    return canvas

def create_splash_screen(
    master: Image.Image,
    width: int,
    height: int,
    bg_color=NAVY_BG
) -> Image.Image:
    """Create splash screen image with centered NIRA emblem on luxury dark background."""
    img = Image.new("RGBA", (width, height), bg_color)
    
    # Emblem size: approx 32% of minimum screen dimension
    min_dim = min(width, height)
    emblem_target = max(96, int(min_dim * 0.35))
    
    mw, mh = master.size
    scale = min(emblem_target / mw, emblem_target / mh)
    new_w = int(round(mw * scale))
    new_h = int(round(mh * scale))

    resized = master.resize((new_w, new_h), Image.Resampling.LANCZOS)
    pos_x = (width - new_w) // 2
    pos_y = (height - new_h) // 2

    img.paste(resized, (pos_x, pos_y), resized)
    return img

def create_svg_wrapper(png_image: Image.Image, width: int = 512, height: int = 512) -> str:
    """Create self-contained valid SVG that embeds the high-res PNG as base64."""
    buf = BytesIO()
    png_image.save(buf, format="PNG", optimize=True)
    b64_data = base64.b64encode(buf.getvalue()).decode("ascii")
    
    return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {width} {height}" width="{width}" height="{height}">
  <defs>
    <style>
      .emblem {{ width: 100%; height: 100%; object-fit: contain; }}
    </style>
  </defs>
  <image href="data:image/png;base64,{b64_data}" width="{width}" height="{height}" class="emblem" />
</svg>'''

def main():
    master = verify_master_image()

    frontend_dir = ROOT_DIR / "frontend"
    public_dir = frontend_dir / "public"
    icons_dir = public_dir / "icons"
    assets_dir = frontend_dir / "src" / "assets"
    res_dir = frontend_dir / "android" / "app" / "src" / "main" / "res"

    public_dir.mkdir(parents=True, exist_ok=True)
    icons_dir.mkdir(parents=True, exist_ok=True)
    assets_dir.mkdir(parents=True, exist_ok=True)

    # 1. Master Copies
    print("\n[*] 1. Deploying authoritative master copy to frontend assets...")
    master.save(assets_dir / "nira-emblem.png", "PNG")
    print(f"    -> {assets_dir / 'nira-emblem.png'}")

    # 2. PWA Icons (192x192 and 512x512)
    print("\n[*] 2. Generating PWA icons...")
    # Safe margin for maskable icon compliance: 15% padding
    pwa_192 = create_padded_icon(master, 192, padding_ratio=0.10, bg_color=NAVY_BG, shape="squircle")
    pwa_512 = create_padded_icon(master, 512, padding_ratio=0.10, bg_color=NAVY_BG, shape="squircle")
    
    pwa_192.save(icons_dir / "icon-192.png", "PNG")
    pwa_512.save(icons_dir / "icon-512.png", "PNG")
    
    # SVG equivalents for PWA manifest
    (icons_dir / "icon-192.svg").write_text(create_svg_wrapper(pwa_192, 192, 192), encoding="utf-8")
    (icons_dir / "icon-512.svg").write_text(create_svg_wrapper(pwa_512, 512, 512), encoding="utf-8")
    print(f"    -> Saved icon-192.png, icon-512.png, icon-192.svg, icon-512.svg")

    # 3. Favicon Assets
    print("\n[*] 3. Generating Web Favicons...")
    fav_16 = create_padded_icon(master, 16, padding_ratio=0.04, shape="transparent")
    fav_32 = create_padded_icon(master, 32, padding_ratio=0.04, shape="transparent")
    fav_48 = create_padded_icon(master, 48, padding_ratio=0.04, shape="transparent")
    apple_touch = create_padded_icon(master, 180, padding_ratio=0.10, bg_color=NAVY_BG, shape="squircle")
    fav_svg_source = create_padded_icon(master, 128, padding_ratio=0.04, shape="transparent")

    fav_16.save(public_dir / "favicon-16x16.png", "PNG")
    fav_32.save(public_dir / "favicon-32x32.png", "PNG")
    fav_48.save(public_dir / "favicon-48x48.png", "PNG")
    apple_touch.save(public_dir / "apple-touch-icon.png", "PNG")

    # Multi-resolution ICO
    fav_32.save(
        public_dir / "favicon.ico",
        format="ICO",
        sizes=[(16, 16), (32, 32), (48, 48)]
    )

    # Master favicon.svg (optimized 128x128 retina tab SVG)
    fav_svg_content = create_svg_wrapper(fav_svg_source, 128, 128)
    (public_dir / "favicon.svg").write_text(fav_svg_content, encoding="utf-8")
    print(f"    -> Saved favicon.ico, favicon.svg, apple-touch-icon.png, favicon-*.png")

    # 4. Windows Desktop Shortcut Icon (app.ico)
    print("\n[*] 4. Generating Windows desktop icon...")
    app_ico_sizes = [(16, 16), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)]
    ico_master = create_padded_icon(master, 256, padding_ratio=0.06, shape="transparent")
    ico_master.save(
        ROOT_DIR / "app.ico",
        format="ICO",
        sizes=app_ico_sizes
    )
    print(f"    -> Saved root app.ico (multi-resolution 16px to 256px)")

    # 5. Android Mipmap Launchers & Adaptive Icons
    print("\n[*] 5. Generating Android Mipmap Launchers & Adaptive Icons...")
    legacy_density_map = {
        "mipmap-mdpi": 48,
        "mipmap-hdpi": 72,
        "mipmap-xhdpi": 96,
        "mipmap-xxhdpi": 144,
        "mipmap-xxxhdpi": 192,
    }

    adaptive_foreground_map = {
        "mipmap-mdpi": 108,
        "mipmap-hdpi": 162,
        "mipmap-xhdpi": 216,
        "mipmap-xxhdpi": 324,
        "mipmap-xxxhdpi": 432,
    }

    for folder_name, px_legacy in legacy_density_map.items():
        target_folder = res_dir / folder_name
        target_folder.mkdir(parents=True, exist_ok=True)

        px_fg = adaptive_foreground_map[folder_name]

        # Adaptive foreground layer: 108dp viewport, emblem fits inside 72dp safe circular mask (padding ~0.20)
        img_fg = create_padded_icon(master, px_fg, padding_ratio=0.20, shape="transparent")
        # Legacy square / squircle icon
        img_sq = create_padded_icon(master, px_legacy, padding_ratio=0.08, bg_color=NAVY_BG, shape="squircle")
        # Legacy round icon
        img_rd = create_padded_icon(master, px_legacy, padding_ratio=0.12, bg_color=NAVY_BG, shape="round")

        img_fg.save(target_folder / "ic_launcher_foreground.png", "PNG")
        img_sq.save(target_folder / "ic_launcher.png", "PNG")
        img_rd.save(target_folder / "ic_launcher_round.png", "PNG")
        print(f"    -> Updated {folder_name} (Adaptive FG: {px_fg}x{px_fg}, Legacy: {px_legacy}x{px_legacy})")

    # Ensure mipmap-anydpi-v26 references @mipmap/ic_launcher_foreground
    anydpi_dir = res_dir / "mipmap-anydpi-v26"
    anydpi_dir.mkdir(parents=True, exist_ok=True)
    adaptive_xml = '''<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@color/ic_launcher_background"/>
    <foreground android:drawable="@mipmap/ic_launcher_foreground"/>
</adaptive-icon>'''
    (anydpi_dir / "ic_launcher.xml").write_text(adaptive_xml, encoding="utf-8")
    (anydpi_dir / "ic_launcher_round.xml").write_text(adaptive_xml, encoding="utf-8")
    print("    -> Verified mipmap-anydpi-v26/ic_launcher*.xml point to @mipmap/ic_launcher_foreground")

    # Remove any stale legacy vector foregrounds in drawable/ and drawable-v24/
    for stale_path in [
        res_dir / "drawable" / "ic_launcher_foreground.xml",
        res_dir / "drawable-v24" / "ic_launcher_foreground.xml",
    ]:
        if stale_path.exists():
            stale_path.unlink()
            print(f"    -> Removed obsolete legacy vector: {stale_path.name}")

    # 6. Android Splash Screens (Portrait & Landscape)
    print("\n[*] 6. Generating Android Splash Screens...")
    splash_port_densities = {
        "drawable-port-mdpi": (320, 480),
        "drawable-port-hdpi": (480, 800),
        "drawable-port-xhdpi": (720, 1280),
        "drawable-port-xxhdpi": (960, 1600),
        "drawable-port-xxxhdpi": (1280, 1920),
    }

    for folder_name, (w, h) in splash_port_densities.items():
        target_folder = res_dir / folder_name
        if target_folder.exists():
            splash_img = create_splash_screen(master, w, h)
            splash_img.save(target_folder / "splash.png", "PNG")
            print(f"    -> Updated {folder_name} ({w}x{h})")

    splash_land_densities = {
        "drawable-land-mdpi": (480, 320),
        "drawable-land-hdpi": (800, 480),
        "drawable-land-xhdpi": (1280, 720),
        "drawable-land-xxhdpi": (1600, 960),
        "drawable-land-xxxhdpi": (1920, 1280),
    }

    for folder_name, (w, h) in splash_land_densities.items():
        target_folder = res_dir / folder_name
        if target_folder.exists():
            splash_img = create_splash_screen(master, w, h)
            splash_img.save(target_folder / "splash.png", "PNG")
            print(f"    -> Updated {folder_name} ({w}x{h})")

    # Base drawable splash
    base_drawable = res_dir / "drawable"
    if base_drawable.exists():
        create_splash_screen(master, 480, 800).save(base_drawable / "splash.png", "PNG")
        print(f"    -> Updated drawable/splash.png (480x800)")

    print("\n[SUCCESS] Global asset generation from master image complete.")

if __name__ == "__main__":
    main()
