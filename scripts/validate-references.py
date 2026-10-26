#!/usr/bin/env python3
"""Validate the local, DOM-observed Gummble corpus without network requests."""
import hashlib
import json
import uuid
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
REFERENCE = ROOT / "research" / "gummble"


def main():
    manifest = json.loads((REFERENCE / "gallery.json").read_text())
    screens = manifest["screens"]
    expected = manifest["indexedScreens"]
    if [row["n"] for row in screens] != list(range(1, expected + 1)):
        raise SystemExit("Source indices must be ordered, complete and contiguous.")
    ids = [row["id"] for row in screens]
    if len(set(ids)) != expected:
        raise SystemExit("Duplicate source IDs detected.")
    for source_id in ids:
        uuid.UUID(source_id)

    local = []
    for row in screens:
        path = REFERENCE / "screens" / f"{row['n']:03d}.png"
        if not path.is_file():
            raise SystemExit(f"Missing source image: {path}")
        with Image.open(path) as image:
            image.verify()
        with Image.open(path) as image:
            width, height = image.size
            encoding = image.format
        if width < 393 or height < 852 or abs(width / height - 393 / 852) > 0.01:
            raise SystemExit(f"Unexpected source dimensions: {path.name} {width}x{height}")
        local.append({
            **row,
            "path": str(path.relative_to(ROOT)),
            "width": width,
            "height": height,
            "encoding": encoding,
            "sha256": hashlib.sha256(path.read_bytes()).hexdigest(),
        })
    output = REFERENCE / "local-inventory.json"
    output.write_text(json.dumps({
        "captureDate": manifest["captureDate"],
        "source": manifest["source"],
        "validatedScreens": len(local),
        "screens": local,
    }, indent=2) + "\n")
    print(f"Validated {len(local)}/{expected} unique source IDs and readable images.")
    print(f"Local dimension variants: {sorted({(r['width'], r['height']) for r in local})}")
    print(f"Encoding counts: { {kind: sum(r['encoding'] == kind for r in local) for kind in sorted({r['encoding'] for r in local})} }")
    print(f"Inventory: {output}")


if __name__ == "__main__":
    main()
