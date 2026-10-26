#!/usr/bin/env python3
from pathlib import Path
import html,json,shutil
ROOT=Path(__file__).resolve().parents[1]
report=json.loads((ROOT/'qa/visual-metrics.json').read_text())
items=[]
for row in report['screens']:
    name=html.escape(row['route'])
    items.append(f'<section><h2>{name} <small>chưa zero-diff</small></h2><p>MAE {row["mae_0_255"]}/255 · reference {row["reference"]} · <a href="overlays/{name}.png">Overlay 50%</a> · <a href="diffs/{name}.png">Diff ×3</a></p><img loading="lazy" src="comparisons/{name}.png" alt="{name}: reference trái, app phải"></section>')
page='''<!doctype html><html lang="vi"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>CapWords — Visual QA</title><style>body{margin:0;background:#202329;color:#e5e7eb;font:15px/1.6 system-ui}main{max-width:820px;margin:auto;padding:28px 16px}h1{font-size:27px;line-height:1.3}h2{font-size:21px}small{font-size:12px;color:#dfbf79;margin-left:12px}p{color:#acb4c0}a{color:#c3c1f4}section{margin:46px 0}img{width:100%;height:auto;border-radius:12px;display:block}nav{display:flex;gap:16px}</style><main><h1>CapWords · đối chiếu giao diện</h1><p>Baseline Gummble 29/09/2025, 393×852. Trái: reference. Phải: app render. Không có màn zero-diff. MAE là sai số RGB toàn khung, không phải phần trăm độ giống. Font và timing còn suy luận; native-device QA chưa thực hiện.</p><nav><a href="/">Mở app tương tác</a><a href="visual-metrics.json">Số đo JSON</a></nav>'''+''.join(items)+'</main></html>\n'
(ROOT/'qa/index.html').write_text(page)
DEST=ROOT/'dist/qa';DEST.mkdir(parents=True,exist_ok=True)
for folder in ['comparisons','overlays','diffs']:
    shutil.copytree(ROOT/'qa'/folder,DEST/folder,dirs_exist_ok=True)
for file in ['index.html','visual-metrics.json']:shutil.copy2(ROOT/'qa'/file,DEST/file)
print(f'QA viewer published: {DEST}/index.html ({len(items)} pairs)')
