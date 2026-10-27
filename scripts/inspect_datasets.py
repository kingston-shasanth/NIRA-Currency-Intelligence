"""Inspect external banknote and coin datasets in detail."""
import os
import sys
from pathlib import Path
from collections import defaultdict, Counter
from PIL import Image

ROOT_DIR = Path(__file__).resolve().parent.parent

def inspect_banknotes(banknote_dir: Path):
    print("=" * 60)
    print("INSPECTING BANKNOTE DATASET:", banknote_dir)
    print("=" * 60)
    
    if not banknote_dir.exists():
        print("Banknote directory does not exist!")
        return

    # Check top-level items
    top_items = list(banknote_dir.iterdir())
    print(f"Top-level items ({len(top_items)}): {[p.name for p in top_items]}")

    # Dataset folder
    ds_dir = banknote_dir / "Indian Currency Dataset"
    if not ds_dir.exists():
        ds_dir = banknote_dir
    
    classes = [d for d in ds_dir.iterdir() if d.is_dir()]
    print(f"\nBanknote Class Folders ({len(classes)}): {[c.name for c in classes]}")

    total_images = 0
    class_stats = {}
    formats = Counter()
    corrupt_count = 0
    zero_byte_count = 0
    resolutions = []

    for c in sorted(classes, key=lambda x: str(x.name)):
        img_files = [f for f in c.rglob("*") if f.is_file()]
        valid_for_class = 0
        corrupt_for_class = 0
        
        for f in img_files:
            total_images += 1
            ext = f.suffix.lower()
            formats[ext] += 1
            
            size = f.stat().st_size
            if size == 0:
                zero_byte_count += 1
                corrupt_for_class += 1
                continue
                
            try:
                with Image.open(f) as img:
                    img.verify()
                valid_for_class += 1
                # sample resolution for first 10
                if len(resolutions) < 20:
                    with Image.open(f) as img:
                        resolutions.append(img.size)
            except Exception as e:
                corrupt_count += 1
                corrupt_for_class += 1
        
        class_stats[c.name] = {
            "total": len(img_files),
            "valid": valid_for_class,
            "corrupt": corrupt_for_class,
        }

    print("\n--- Banknote Class Counts ---")
    for c_name, stats in class_stats.items():
        print(f"  Class '{c_name}': {stats['valid']} valid images ({stats['corrupt']} corrupt/empty)")
    
    print(f"\nTotal Banknote Images: {total_images}")
    print(f"File Formats: {dict(formats)}")
    print(f"Corrupt / Zero-byte Images: {corrupt_count + zero_byte_count}")
    if resolutions:
        print(f"Sample Resolutions: {resolutions[:5]}")

def inspect_coins(coin_dir: Path):
    print("\n" + "=" * 60)
    print("INSPECTING COIN DATASET:", coin_dir)
    print("=" * 60)
    
    if not coin_dir.exists():
        print("Coin directory does not exist!")
        return

    top_items = list(coin_dir.iterdir())
    print(f"Top-level items ({len(top_items)}): {[p.name for p in top_items]}")

    ds_dir = coin_dir / "Image Dataset of Indian Coins"
    if not ds_dir.exists():
        ds_dir = coin_dir
    
    classes = [d for d in ds_dir.iterdir() if d.is_dir()]
    print(f"\nCoin Denomination Folders ({len(classes)}): {[c.name for c in classes]}")

    total_images = 0
    class_stats = {}
    formats = Counter()
    corrupt_count = 0
    zero_byte_count = 0
    resolutions = []
    subfolder_structures = defaultdict(set)

    for c in sorted(classes, key=lambda x: str(x.name)):
        img_files = [f for f in c.rglob("*") if f.is_file()]
        valid_for_class = 0
        corrupt_for_class = 0
        
        for f in img_files:
            total_images += 1
            ext = f.suffix.lower()
            formats[ext] += 1
            
            # Record subfolder hierarchy relative to class folder
            rel_parent = f.relative_to(c).parent
            subfolder_structures[c.name].add(str(rel_parent))
            
            size = f.stat().st_size
            if size == 0:
                zero_byte_count += 1
                corrupt_for_class += 1
                continue
                
            try:
                with Image.open(f) as img:
                    img.verify()
                valid_for_class += 1
                if len(resolutions) < 20:
                    with Image.open(f) as img:
                        resolutions.append(img.size)
            except Exception as e:
                corrupt_count += 1
                corrupt_for_class += 1
        
        class_stats[c.name] = {
            "total": len(img_files),
            "valid": valid_for_class,
            "corrupt": corrupt_for_class,
        }

    print("\n--- Coin Class Counts ---")
    for c_name, stats in class_stats.items():
        print(f"  Class '{c_name}': {stats['valid']} valid images ({stats['corrupt']} corrupt/empty)")
    
    print(f"\nTotal Coin Images: {total_images}")
    print(f"File Formats: {dict(formats)}")
    print(f"Corrupt / Zero-byte Images: {corrupt_count + zero_byte_count}")
    if resolutions:
        print(f"Sample Resolutions: {resolutions[:5]}")
    
    print("\n--- Coin Subfolder Sample Structures ---")
    for c_name, subpaths in subfolder_structures.items():
        sample_paths = list(subpaths)[:4]
        print(f"  {c_name} ({len(subpaths)} subfolder combinations): {sample_paths}")

def main():
    banknote_dir = ROOT_DIR / "data" / "external" / "banknotes"
    coin_dir = ROOT_DIR / "data" / "external" / "coins"
    inspect_banknotes(banknote_dir)
    inspect_coins(coin_dir)

if __name__ == "__main__":
    main()
