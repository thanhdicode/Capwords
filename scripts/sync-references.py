#!/usr/bin/env python3
"""Download only DOM-observed Gummble image IDs in the local manifests.
Reference images are QA inputs, not runtime app screens.
"""
import concurrent.futures
import json
import subprocess
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
REFERENCE = ROOT / 'research' / 'gummble'
DEST = REFERENCE / 'screens'
DEST.mkdir(parents=True, exist_ok=True)


def download(item):
    dest = DEST / f"{item.get('prefix', '')}{item['n']:03d}.png"
    if not dest.exists():
        url = item.get('src') or f"https://storage.gummble.com/cdn-cgi/image/width=1920,quality=80,format=webp/prod/content/app_screens/{item['id']}.png"
        subprocess.run(['curl', '-L', '--fail', '--silent', '--show-error', '--max-time', '40', url, '-o', str(dest)], check=True)
    with Image.open(dest) as image:
        return str(dest.relative_to(ROOT)), image.size


def main():
    manifest = json.loads((REFERENCE / 'gallery.json').read_text())
    missing = [item for item in manifest['screens'] if not (DEST / f"{item['n']:03d}.png").exists()]
    if missing and manifest.get('downloadPolicy') == 'authenticated-browser':
        raise SystemExit('Missing sources require authenticated browser saveImage; sandbox HTTP returned 403. Do not retry curl. Run validate-references.py after import.')
    with concurrent.futures.ThreadPoolExecutor(max_workers=6) as pool:
        for path, size in pool.map(download, manifest['screens']):
            print(path, size, flush=True)
    screens = [DEST / f"{item['n']:03d}.png" for item in manifest['screens']]
    for start in range(0, len(screens), 12):
        sheet = Image.new('RGB', (4 * 236, 3 * 512), '#dddddd')
        for index, path in enumerate(screens[start:start + 12]):
            with Image.open(path) as image:
                image = image.convert('RGB')
                image.thumbnail((236, 512), Image.Resampling.LANCZOS)
                sheet.paste(image, ((index % 4) * 236, (index // 4) * 512))
        sheet.save(REFERENCE / f"contact-{start+1:03d}-{min(start+12,len(screens)):03d}.jpg", quality=92)


if __name__ == '__main__':
    main()
