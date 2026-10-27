"""DRISHTI AI — Dataset Management & Leakage-Free Splitting Pipeline.

Inspects raw currency banknotes, standardizes class nomenclature, checks image integrity,
detects duplicate hashes to eliminate cross-split data leakage, and provides PyTorch
DataLoaders with augmentations restricted strictly to the training partition.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import os
import random
import shutil
from pathlib import Path
from typing import Dict, List, Optional, Tuple

from PIL import Image

# Canonical Indian currency denominations (Banknotes and Coins)
BANKNOTE_CLASSES = ["₹10", "₹20", "₹50", "₹100", "₹200", "₹500", "₹2000"]
COIN_CLASSES = [
    "₹1 Coin",
    "₹2 Coin",
    "₹5 Coin",
    "₹10 Coin",
    "₹20 Coin",
    "25 Paisa Coin",
    "50 Paisa Coin",
]
CANONICAL_CLASSES = BANKNOTE_CLASSES + COIN_CLASSES

# Mapping dictionary for diverse raw directory naming conventions
CLASS_SYNONYMS: Dict[str, str] = {
    # Banknotes
    "10": "₹10",
    "10_rupees": "₹10",
    "rs10": "₹10",
    "ten": "₹10",
    "₹10": "₹10",
    "20": "₹20",
    "20_rupees": "₹20",
    "rs20": "₹20",
    "twenty": "₹20",
    "₹20": "₹20",
    "50": "₹50",
    "50_rupees": "₹50",
    "rs50": "₹50",
    "fifty": "₹50",
    "₹50": "₹50",
    "100": "₹100",
    "100_rupees": "₹100",
    "rs100": "₹100",
    "hundred": "₹100",
    "₹100": "₹100",
    "200": "₹200",
    "200_rupees": "₹200",
    "rs200": "₹200",
    "two_hundred": "₹200",
    "₹200": "₹200",
    "500": "₹500",
    "500_rupees": "₹500",
    "rs500": "₹500",
    "five_hundred": "₹500",
    "₹500": "₹500",
    "2000": "₹2000",
    "2000_rupees": "₹2000",
    "rs2000": "₹2000",
    "two_thousand": "₹2000",
    "₹2000": "₹2000",
    # Coins
    "1_coin": "₹1 Coin",
    "coin_1": "₹1 Coin",
    "1coin": "₹1 Coin",
    "rs1_coin": "₹1 Coin",
    "₹1_coin": "₹1 Coin",
    "1 rupee coin": "₹1 Coin",
    "₹1 coin": "₹1 Coin",
    "2_coin": "₹2 Coin",
    "coin_2": "₹2 Coin",
    "2coin": "₹2 Coin",
    "rs2_coin": "₹2 Coin",
    "₹2_coin": "₹2 Coin",
    "2 rupees coin": "₹2 Coin",
    "₹2 coin": "₹2 Coin",
    "5_coin": "₹5 Coin",
    "coin_5": "₹5 Coin",
    "5coin": "₹5 Coin",
    "rs5_coin": "₹5 Coin",
    "₹5_coin": "₹5 Coin",
    "5 rupees coin": "₹5 Coin",
    "₹5 coin": "₹5 Coin",
    "10_coin": "₹10 Coin",
    "coin_10": "₹10 Coin",
    "10coin": "₹10 Coin",
    "rs10_coin": "₹10 Coin",
    "₹10_coin": "₹10 Coin",
    "10 rupees coin": "₹10 Coin",
    "₹10 coin": "₹10 Coin",
    "20_coin": "₹20 Coin",
    "coin_20": "₹20 Coin",
    "20coin": "₹20 Coin",
    "rs20_coin": "₹20 Coin",
    "₹20_coin": "₹20 Coin",
    "20 rupees coin": "₹20 Coin",
    "₹20 coin": "₹20 Coin",
    "25 paisa coin": "25 Paisa Coin",
    "25_paisa_coin": "25 Paisa Coin",
    "25 paisa": "25 Paisa Coin",
    "25_paisa": "25 Paisa Coin",
    "25p coin": "25 Paisa Coin",
    "25p": "25 Paisa Coin",
    "50 paisa coin": "50 Paisa Coin",
    "50_paisa_coin": "50 Paisa Coin",
    "50 paisa": "50 Paisa Coin",
    "50_paisa": "50 Paisa Coin",
    "50p coin": "50 Paisa Coin",
    "50p": "50 Paisa Coin",
}

VALID_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".bmp"}


def normalize_class_name(raw_name: str) -> Optional[str]:
    """Normalize raw directory or class name to canonical INR denomination or dynamic detected class."""
    if not raw_name or raw_name.startswith("."):
        return None
    cleaned = raw_name.strip().lower().replace(" ", "_")
    if cleaned in CLASS_SYNONYMS:
        return CLASS_SYNONYMS[cleaned]
    if raw_name.strip() in CLASS_SYNONYMS:
        return CLASS_SYNONYMS[raw_name.strip()]
    if raw_name.strip().lower() in CLASS_SYNONYMS:
        return CLASS_SYNONYMS[raw_name.strip().lower()]
    for canon in CANONICAL_CLASSES:
        if canon.lower() == raw_name.strip().lower():
            return canon
    return raw_name.strip()


def resolve_class_from_path(fpath: Path, root_dir: Optional[Path] = None) -> Optional[str]:
    """Inspect all parent directories of fpath up to root_dir to find a matching canonical class."""
    for parent in fpath.parents:
        if root_dir and parent == root_dir:
            break
        cls = normalize_class_name(parent.name)
        if cls in CANONICAL_CLASSES:
            return cls
    # Fallback to direct parent
    return normalize_class_name(fpath.parent.name)


def calculate_image_hash(filepath: Path) -> str:
    """Compute MD5 hash of raw image bytes to identify identical assets."""
    hasher = hashlib.md5()
    with open(filepath, "rb") as f:
        while chunk := f.read(65536):
            hasher.update(chunk)
    return hasher.hexdigest()


def audit_dataset(data_dir: Path) -> Dict[str, any]:
    """Audit raw currency dataset for classes, corrupt files, duplicates, and leakage."""
    report = {
        "dataset_path": str(data_dir),
        "exists": data_dir.exists(),
        "total_images_found": 0,
        "valid_images": 0,
        "corrupt_images": 0,
        "duplicate_images": 0,
        "class_counts": {},
        "corrupt_files": [],
        "duplicate_groups": [],
        "ready_for_training": False,
        "message": "",
    }

    if not data_dir.exists():
        report["message"] = f"Directory {data_dir} does not exist. Place your currency folders in data/raw/."
        return report

    # Find candidate image files
    all_files = [p for p in data_dir.rglob("*") if p.is_file() and p.suffix.lower() in VALID_EXTENSIONS]
    report["total_images_found"] = len(all_files)

    if not all_files:
        report["message"] = (
            f"No image files found in {data_dir}. Place denomination folders "
            f"(e.g., 10, 20, 50, 100, 200, 500, 2000) inside data/raw/."
        )
        return report

    hashes: Dict[str, List[Path]] = {}
    class_tallies: Dict[str, int] = {}

    for fpath in all_files:
        # Determine class from parent directory or ancestry
        canonical = resolve_class_from_path(fpath, root_dir=data_dir)
        if not canonical or canonical == data_dir.name:
            continue

        # Verify image integrity with PIL
        try:
            with Image.open(fpath) as img:
                img.verify()
            # Reopen to test reading bands/mode
            with Image.open(fpath) as img:
                img.load()
            report["valid_images"] += 1
            class_tallies[canonical] = class_tallies.get(canonical, 0) + 1

            # Hash check
            img_hash = calculate_image_hash(fpath)
            hashes.setdefault(img_hash, []).append(fpath)

        except Exception as err:
            report["corrupt_images"] += 1
            report["corrupt_files"].append({"file": str(fpath), "error": str(err)})

    # Detect duplicates
    duplicates_count = 0
    for h, files in hashes.items():
        if len(files) > 1:
            duplicates_count += len(files) - 1
            report["duplicate_groups"].append([str(p) for p in files])

    report["duplicate_images"] = duplicates_count
    report["class_counts"] = {k: v for k, v in class_tallies.items() if v > 0}
    report["ready_for_training"] = report["valid_images"] >= 14 and len(report["class_counts"]) >= 2

    if report["ready_for_training"]:
        report["message"] = f"Dataset audit passed with {report['valid_images']} valid images across {len(report['class_counts'])} classes."
    else:
        report["message"] = "Dataset does not meet minimum training requirements (need at least 2 classes with valid samples)."

    return report


def prepare_splits(
    raw_dir: Path,
    output_dir: Path,
    train_ratio: float = 0.70,
    val_ratio: float = 0.15,
    test_ratio: float = 0.15,
    seed: int = 42,
) -> Dict[str, any]:
    """Create reproducible, leakage-free stratified splits.

    Identical images (duplicate hashes) are excluded to ensure zero cross-partition leakage.
    """
    random.seed(seed)
    audit = audit_dataset(raw_dir)
    if not audit["ready_for_training"]:
        raise ValueError(f"Cannot split dataset: {audit['message']}")

    # Collect valid unique images grouped by class
    seen_hashes = set()
    class_assets: Dict[str, List[Path]] = {}

    for fpath in raw_dir.rglob("*"):
        if not (fpath.is_file() and fpath.suffix.lower() in VALID_EXTENSIONS):
            continue
        canonical = resolve_class_from_path(fpath, root_dir=raw_dir)
        if not canonical:
            continue

        try:
            h = calculate_image_hash(fpath)
            if h in seen_hashes:
                continue  # Eliminate exact duplicate to prevent leakage
            seen_hashes.add(h)

            with Image.open(fpath) as img:
                img.verify()
            class_assets.setdefault(canonical, []).append(fpath)
        except Exception:
            continue

    # Prepare output split directories
    for split in ["train", "val", "test"]:
        split_dir = output_dir / split
        if split_dir.exists():
            shutil.rmtree(split_dir)
        split_dir.mkdir(parents=True, exist_ok=True)
        for c in class_assets.keys():
            (split_dir / c).mkdir(parents=True, exist_ok=True)

    split_counts = {"train": 0, "val": 0, "test": 0, "classes": {}}

    for cls_name, files in class_assets.items():
        random.shuffle(files)
        n = len(files)
        n_train = int(n * train_ratio)
        n_val = int(n * val_ratio)
        if n_train == 0 and n > 0:
            n_train = max(1, n - 2)

        train_files = files[:n_train]
        val_files = files[n_train : n_train + n_val]
        test_files = files[n_train + n_val :]

        split_counts["classes"][cls_name] = {
            "train": len(train_files),
            "val": len(val_files),
            "test": len(test_files),
            "total": n,
        }

        for split, flist in [("train", train_files), ("val", val_files), ("test", test_files)]:
            for src_file in flist:
                dest = output_dir / split / cls_name / src_file.name
                shutil.copy2(src_file, dest)
                split_counts[split] += 1

    metadata_path = output_dir / "splits_metadata.json"
    with open(metadata_path, "w", encoding="utf-8") as f:
        json.dump(
            {
                "split_counts": split_counts,
                "train_ratio": train_ratio,
                "val_ratio": val_ratio,
                "test_ratio": test_ratio,
                "seed": seed,
                "deduplicated_images": len(seen_hashes),
            },
            f,
            indent=2,
        )

    return split_counts


# PyTorch Dataset Definition (Loaded conditionally when PyTorch is available)
def get_transforms(is_train: bool = False):
    """Data transformations. Augmentation is strictly restricted to training."""
    from torchvision import transforms

    if is_train:
        return transforms.Compose(
            [
                transforms.Resize((256, 256)),
                transforms.RandomCrop(224),
                transforms.RandomHorizontalFlip(p=0.5),
                transforms.RandomRotation(degrees=15),
                transforms.ColorJitter(brightness=0.2, contrast=0.2, saturation=0.2),
                transforms.ToTensor(),
                transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
            ]
        )
    else:
        return transforms.Compose(
            [
                transforms.Resize((256, 256)),
                transforms.CenterCrop(224),
                transforms.ToTensor(),
                transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
            ]
        )


def get_data_loaders(
    splits_dir: Path,
    batch_size: int = 16,
    num_workers: int = 0,  # 0 is safest on Windows multiprocessing
) -> Tuple[any, any, any, List[str]]:
    """Build PyTorch DataLoaders for train, val, and test splits."""
    from torch.utils.data import DataLoader
    from torchvision.datasets import ImageFolder

    train_dir = splits_dir / "train"
    val_dir = splits_dir / "val"
    test_dir = splits_dir / "test"

    if not (train_dir.exists() and val_dir.exists()):
        raise FileNotFoundError(f"Splits not found at {splits_dir}. Run `python -m ml.dataset --prepare` first.")

    train_ds = ImageFolder(str(train_dir), transform=get_transforms(is_train=True))
    val_ds = ImageFolder(str(val_dir), transform=get_transforms(is_train=False))

    classes = train_ds.classes

    train_loader = DataLoader(
        train_ds,
        batch_size=batch_size,
        shuffle=True,
        num_workers=num_workers,
        pin_memory=True,
    )
    val_loader = DataLoader(
        val_ds,
        batch_size=batch_size,
        shuffle=False,
        num_workers=num_workers,
        pin_memory=True,
    )

    test_loader = None
    if test_dir.exists():
        test_ds = ImageFolder(str(test_dir), transform=get_transforms(is_train=False))
        test_loader = DataLoader(
            test_ds,
            batch_size=batch_size,
            shuffle=False,
            num_workers=num_workers,
            pin_memory=True,
        )

    return train_loader, val_loader, test_loader, classes


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="DRISHTI AI Dataset Tools")
    parser.add_argument("--audit", action="store_true", help="Audit data/raw/ dataset")
    parser.add_argument("--prepare", action="store_true", help="Prepare stratified splits into data/splits/")
    parser.add_argument("--raw-dir", type=str, default="data/raw", help="Path to raw dataset")
    parser.add_argument("--splits-dir", type=str, default="data/splits", help="Output path for splits")
    args = parser.parse_args()

    raw_path = Path(args.raw_dir)
    splits_path = Path(args.splits_dir)

    if args.audit:
        print("Auditing dataset at:", raw_path)
        report = audit_dataset(raw_path)
        print(json.dumps(report, indent=2))

    if args.prepare:
        print(f"Creating stratified splits from {raw_path} -> {splits_path}")
        try:
            res = prepare_splits(raw_path, splits_path)
            print("Splits created successfully:")
            print(json.dumps(res, indent=2))
        except Exception as e:
            print("Error creating splits:", e)
