"""DRISHTI AI — Dataset Staging, Deduplication & Leakage-Free Stratified Splitting.

1. Ingests banknotes (Indian Currency Dataset) and coins (Image Dataset of Indian Coins).
2. Correctly maps nested commemorative coin hierarchies to denomination-level classes.
3. Resizes images to max 512px preserving aspect ratio.
4. Filters out duplicate image hashes to prevent cross-split leakage.
5. Performs stratified splitting (70% train, 15% val, 15% test) with fixed seed (42).
6. Computes balanced class weights for training.
"""

from __future__ import annotations

import hashlib
import io
import json
import os
import random
import shutil
import sys
import time
from collections import Counter, defaultdict
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
from typing import Dict, List, Optional, Tuple

from PIL import Image, ImageOps

if sys.stdout and hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
if sys.stderr and hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")

ROOT_DIR = Path(__file__).resolve().parent.parent
EXTERNAL_BANKNOTES_DIR = ROOT_DIR / "data" / "external" / "banknotes"
EXTERNAL_COINS_DIR = ROOT_DIR / "data" / "external" / "coins"
RAW_DIR = ROOT_DIR / "data" / "raw"
SPLITS_DIR = ROOT_DIR / "data" / "splits"

# Canonical 14 classes
CANONICAL_CLASSES = [
    "₹10", "₹20", "₹50", "₹100", "₹200", "₹500", "₹2000",
    "₹1 Coin", "₹2 Coin", "₹5 Coin", "₹10 Coin", "₹20 Coin",
    "25 Paisa Coin", "50 Paisa Coin"
]

# Resolution mapping for directory names and subpaths
SYNONYM_MAP: Dict[str, str] = {
    # Banknotes
    "10": "₹10",
    "20": "₹20",
    "50": "₹50",
    "100": "₹100",
    "200": "₹200",
    "500": "₹500",
    "2000": "₹2000",
    # Coins
    "1 rupee coin": "₹1 Coin",
    "1_rupee_coin": "₹1 Coin",
    "1 rupee": "₹1 Coin",
    "1 coin": "₹1 Coin",
    "2 rupee coin": "₹2 Coin",
    "2_rupee_coin": "₹2 Coin",
    "2 rupee": "₹2 Coin",
    "2 coin": "₹2 Coin",
    "5 rupee coin": "₹5 Coin",
    "5_rupee_coin": "₹5 Coin",
    "5 rupee": "₹5 Coin",
    "5 coin": "₹5 Coin",
    "10 rupee coin": "₹10 Coin",
    "10_rupee_coin": "₹10 Coin",
    "10 rupee": "₹10 Coin",
    "10 coin": "₹10 Coin",
    "20 rupee coin": "₹20 Coin",
    "20_rupee_coin": "₹20 Coin",
    "20 rupee": "₹20 Coin",
    "20 coin": "₹20 Coin",
    "25 paisa coin": "25 Paisa Coin",
    "25_paisa_coin": "25 Paisa Coin",
    "25 paisa": "25 Paisa Coin",
    "25p": "25 Paisa Coin",
    "50 paisa coin": "50 Paisa Coin",
    "50_paisa_coin": "50 Paisa Coin",
    "50 paisa": "50 Paisa Coin",
    "50p": "50 Paisa Coin",
}

VALID_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".bmp"}


def resolve_class_from_path(file_path: Path) -> Optional[str]:
    """Inspect all parent folder names of file_path to determine canonical class."""
    for parent in file_path.parents:
        p_name = parent.name.strip().lower()
        if p_name in SYNONYM_MAP:
            return SYNONYM_MAP[p_name]
        # Also check direct match
        for canon in CANONICAL_CLASSES:
            if canon.lower() == p_name:
                return canon
    return None


def resize_image_max_dim(img: Image.Image, max_dim: int = 512) -> Image.Image:
    """Resize image so its longest edge is at most max_dim, preserving aspect ratio."""
    # Convert EXIF orientation if present
    img = ImageOps.exif_transpose(img)
    w, h = img.size
    if max(w, h) > max_dim:
        ratio = max_dim / float(max(w, h))
        new_size = (max(1, int(w * ratio)), max(1, int(h * ratio)))
        return img.resize(new_size, Image.Resampling.LANCZOS)
    return img


def process_single_image(args: Tuple[Path, str, Path]) -> Optional[Dict[str, any]]:
    """Verify, resize to max 512, compute hash, and stage image."""
    src_path, canonical_class, target_dir = args
    try:
        size = src_path.stat().st_size
        if size == 0:
            return {"status": "corrupt", "reason": "zero_byte", "path": str(src_path)}

        with Image.open(src_path) as img:
            img.verify()

        # Reopen to read pixel data and process
        with Image.open(src_path) as img:
            rgb_img = img.convert("RGB")
            resized_img = resize_image_max_dim(rgb_img, max_dim=512)

            # Compute MD5 on raw RGB pixels for exact content hashing
            raw_bytes = resized_img.tobytes()
            img_hash = hashlib.md5(raw_bytes).hexdigest()

            # Save JPEG to buffer to get actual file size
            buf = io.BytesIO()
            resized_img.save(buf, format="JPEG", quality=92, optimize=True)
            jpeg_bytes = buf.getvalue()

            dest_file = target_dir / f"{img_hash[:16]}.jpg"
            with open(dest_file, "wb") as f:
                f.write(jpeg_bytes)

        return {
            "status": "success",
            "class": canonical_class,
            "hash": img_hash,
            "dest_path": str(dest_file),
            "orig_size": size,
            "staged_size": len(jpeg_bytes),
            "final_dims": resized_img.size,
        }

    except Exception as e:
        return {"status": "corrupt", "reason": str(e), "path": str(src_path)}


def stage_datasets():
    print("=" * 70)
    print("DRISHTI AI — STAGING, DEDUPLICATION & STRATIFIED SPLITTING")
    print("=" * 70)

    # 1. Gather all candidate images
    all_candidates: List[Tuple[Path, str]] = []

    # Check banknotes
    if EXTERNAL_BANKNOTES_DIR.exists():
        for f in EXTERNAL_BANKNOTES_DIR.rglob("*"):
            if f.is_file() and f.suffix.lower() in VALID_EXTENSIONS:
                c_name = resolve_class_from_path(f)
                if c_name:
                    all_candidates.append((f, c_name))
    print(f"[*] Found {len([c for c in all_candidates if 'Coin' not in c[1]])} banknote candidates.")

    # Check coins
    if EXTERNAL_COINS_DIR.exists():
        for f in EXTERNAL_COINS_DIR.rglob("*"):
            if f.is_file() and f.suffix.lower() in VALID_EXTENSIONS:
                c_name = resolve_class_from_path(f)
                if c_name:
                    all_candidates.append((f, c_name))
    print(f"[*] Total candidates (Banknotes + Coins): {len(all_candidates)}")

    # Check class distribution of candidates
    cand_counts = Counter(c[1] for c in all_candidates)
    print("\nCandidates per Canonical Class:")
    for cls in CANONICAL_CLASSES:
        print(f"  {cls:16s}: {cand_counts.get(cls, 0)}")

    # 2. Prepare raw staging directory
    if RAW_DIR.exists():
        print(f"\n[*] Cleaning previous raw directory: {RAW_DIR}")
        for item in RAW_DIR.iterdir():
            if item.name == ".gitkeep":
                continue
            if item.is_dir():
                shutil.rmtree(item)
            else:
                item.unlink()

    for cls in CANONICAL_CLASSES:
        (RAW_DIR / cls).mkdir(parents=True, exist_ok=True)

    # 3. Process, resize, and deduplicate
    print(f"\n[*] Staging and resizing images to max 512px with aspect-ratio preservation...")
    t0 = time.time()

    tasks = [
        (src, cls, RAW_DIR / cls)
        for src, cls in all_candidates
    ]

    seen_hashes: Dict[str, str] = {}  # hash -> class
    duplicate_groups: Dict[str, List[str]] = defaultdict(list)
    staged_counts: Counter = Counter()
    corrupt_records: List[Dict[str, str]] = []
    total_orig_bytes = 0
    total_staged_bytes = 0

    with ThreadPoolExecutor(max_workers=8) as executor:
        results = list(executor.map(process_single_image, tasks))

    for res in results:
        if not res:
            continue
        if res["status"] == "corrupt":
            corrupt_records.append(res)
            continue

        h = res["hash"]
        cls = res["class"]
        total_orig_bytes += res["orig_size"]

        if h in seen_hashes:
            # Duplicate found! Remove the saved duplicate file
            dest_p = Path(res["dest_path"])
            if dest_p.exists():
                dest_p.unlink()
            duplicate_groups[h].append(str(dest_p))
            continue

        seen_hashes[h] = cls
        staged_counts[cls] += 1
        total_staged_bytes += res["staged_size"]

    elapsed = time.time() - t0
    total_staged = sum(staged_counts.values())
    total_duplicates = sum(len(g) for g in duplicate_groups.values())

    print(f"\n[+] Staging Complete in {elapsed:.1f}s!")
    print(f"    Total Staged Unique Images: {total_staged}")
    print(f"    Duplicate Images Filtered:  {total_duplicates}")
    print(f"    Corrupt / Zero-byte Images: {len(corrupt_records)}")
    print(f"    Original Storage:           {total_orig_bytes / (1024 * 1024):.1f} MB")
    print(f"    Staged Storage:             {total_staged_bytes / (1024 * 1024):.1f} MB (Compression ratio: {total_orig_bytes / max(1, total_staged_bytes):.1f}x)")

    print("\nStaged Unique Images per Class:")
    for cls in CANONICAL_CLASSES:
        print(f"  {cls:16s}: {staged_counts.get(cls, 0)}")

    # 4. Perform Leakage-Free Stratified Splitting (70% Train, 15% Val, 15% Test)
    print("\n" + "=" * 70)
    print("GENERATING STRATIFIED SPLITS (70% Train / 15% Val / 15% Test, Seed=42)")
    print("=" * 70)

    random.seed(42)

    if SPLITS_DIR.exists():
        shutil.rmtree(SPLITS_DIR)

    for split in ["train", "val", "test"]:
        for cls in CANONICAL_CLASSES:
            (SPLITS_DIR / split / cls).mkdir(parents=True, exist_ok=True)

    split_counts = {
        "train": 0,
        "val": 0,
        "test": 0,
        "classes": {}
    }

    train_class_counts: Dict[str, int] = {}

    for cls in CANONICAL_CLASSES:
        cls_dir = RAW_DIR / cls
        files = sorted(list(cls_dir.glob("*.jpg")))
        random.shuffle(files)

        n = len(files)
        n_train = int(n * 0.70)
        n_val = int(n * 0.15)
        # Ensure at least 1 in val and test if n >= 3
        if n >= 3:
            n_train = max(1, min(n - 2, n_train))
            n_val = max(1, min(n - n_train - 1, n_val))

        train_files = files[:n_train]
        val_files = files[n_train: n_train + n_val]
        test_files = files[n_train + n_val:]

        split_counts["classes"][cls] = {
            "train": len(train_files),
            "val": len(val_files),
            "test": len(test_files),
            "total": n,
        }

        train_class_counts[cls] = len(train_files)

        for split, flist in [("train", train_files), ("val", val_files), ("test", test_files)]:
            for src_file in flist:
                dest = SPLITS_DIR / split / cls / src_file.name
                shutil.copy2(src_file, dest)
                split_counts[split] += 1

    # 5. Compute class weights for cross-entropy loss to handle class imbalance
    # Weight formula: N_total / (N_classes * count_i)
    total_train_samples = sum(train_class_counts.values())
    num_classes = len(CANONICAL_CLASSES)
    class_weights = {}
    for cls in CANONICAL_CLASSES:
        cnt = train_class_counts.get(cls, 1)
        w = total_train_samples / (num_classes * max(1, cnt))
        class_weights[cls] = round(w, 4)

    # Normalize weights so mean is 1.0
    mean_w = sum(class_weights.values()) / len(class_weights)
    norm_class_weights = {k: round(v / mean_w, 4) for k, v in class_weights.items()}

    print("\n--- Stratified Split Summary ---")
    print(f"  Training Set:   {split_counts['train']} images")
    print(f"  Validation Set: {split_counts['val']} images")
    print(f"  Test Set:       {split_counts['test']} images")
    print(f"  Grand Total:    {split_counts['train'] + split_counts['val'] + split_counts['test']} images")

    print("\nPer-Class Split Distribution & Training Weights:")
    print(f"  {'Class':<16} {'Train':>6} {'Val':>6} {'Test':>6} {'Total':>6} {'Loss Weight':>12}")
    print("  " + "-" * 56)
    for cls in CANONICAL_CLASSES:
        sc = split_counts["classes"][cls]
        w = norm_class_weights[cls]
        print(f"  {cls:<16} {sc['train']:>6} {sc['val']:>6} {sc['test']:>6} {sc['total']:>6} {w:>12.4f}")

    # Save split metadata
    metadata = {
        "dataset_name": "DRISHTI Indian Banknotes & Coins Hybrid Dataset",
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "max_dimension_px": 512,
        "seed": 42,
        "split_ratios": {"train": 0.70, "val": 0.15, "test": 0.15},
        "split_counts": split_counts,
        "canonical_classes": CANONICAL_CLASSES,
        "train_class_counts": train_class_counts,
        "normalized_class_weights": norm_class_weights,
        "deduplicated_images_count": total_staged,
        "duplicates_removed": total_duplicates,
        "corrupt_images_removed": len(corrupt_records),
    }

    meta_file = SPLITS_DIR / "splits_metadata.json"
    with open(meta_file, "w", encoding="utf-8") as f:
        json.dump(metadata, f, indent=2)

    print(f"\n[+] Staging and splitting complete! Metadata saved to: {meta_file}")
    return metadata


if __name__ == "__main__":
    stage_datasets()
