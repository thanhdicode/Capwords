#!/usr/bin/env python3
"""Reproducible evaluation artifacts. Reference left, implementation right."""
from pathlib import Path
import json
import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
VIEWPORT = (393, 852)
# Gummble iOS 2025-09-29 logical content bounds; excludes status/home-indicator chrome.
APP_CONTENT_BOUNDS = (0, 47, 393, 818)
PAIR_GUTTER = 8
PAIR_BACKGROUND = "#D3D3D3"

# Pair name: (Gummble source ID, captured app screenshot stem). Source variants
# may reuse a generic app state; their independent comparisons expose the gap.
MAP = {
    "welcome": ("003", "welcome"), "intro": ("004", "intro"),
    "languagesNative": ("075", "languagesNative"), "languagesLearning": ("067", "languagesLearning"),
    "languageNativeSelected080": ("080", "languageNativeSelected080"),
    "home": ("001", "home"), "homeReview": ("056", "homeReview"),
    "homeReview040": ("040", "homeReview040"), "collection": ("008", "collection"),
    "collectionActions018": ("018", "collectionActions018"),
    "collectionDeleted019": ("019", "collectionDeleted019"),
    "collectionEmpty033": ("033", "collectionEmpty033"),
    "collectionDate082": ("082", "dateScopedCollection082"),
    "collectionDate086": ("086", "dateScopedCollection086"),
    "collectionLoading099": ("099", "collectionLoading099"),
    "collectionSaveToast039": ("039", "collectionSaveToast039"),
    "camera": ("009", "camera"), "cameraRecording010": ("010", "cameraRecording010"),
    "cameraSource034": ("034", "cameraSource034"),
    "confirmPreview035": ("035", "confirmPreview035"),
    "confirm": ("012", "confirm"), "confirmVideoFrame": ("012", "confirmVideoFrame"),
    "result013": ("013", "result013"), "result053": ("053", "result053"),
    "result055": ("055", "result055"),
    "resultIceCream093": ("093", "result093"),
    "resultEdit": ("014", "resultEdit"), "detail": ("015", "detail"),
    "detailTransition016": ("016", "detail"),
    "examples": ("017", "examples"), "memoryIntro": ("020", "memoryIntro"), "review": ("021", "review"),
    "reviewEncouragement092": ("092", "reviewEncouragement092"),
    "reviewPractice081": ("081", "reviewPractice081"),
    "reviewPractice087": ("087", "reviewPractice087"),
    "reviewRetry089": ("089", "reviewRetry089"),
    "reviewSnapshot094": ("094", "reviewSnapshot094"),
    "reviewTransition096": ("096", "reviewTransition096"),
    "reviewPractice098": ("098", "reviewPractice098"),
    "reviewGesture042": ("042", "reviewGesture042"),
    "reviewGesture042Live": ("042", "reviewGesture042Live"),
    "reviewNeedsReview058": ("058", "reviewNeedsReview058"),
    "reviewTapDetails068": ("068", "reviewTapDetails068"),
    "memoryIntro085": ("085", "memoryIntro085"),
    "memoryIntro097": ("097", "memoryIntro097"),
    "reviewResult": ("002", "reviewResult"), "streakEmpty041": ("041", "streakEmpty041"),
    "streakReminder057": ("057", "streakReminder057"),
    "reviewGoal": ("022", "reviewGoal"),
    "reviewGoal043": ("043", "reviewGoal043"),
    "reviewSummary105": ("105", "reviewSummary105"),
    "reviewCompletion103": ("103", "reviewCompletion103"),
    "reviewCompletion104": ("104", "reviewCompletion104"),
    "reviewProgress100": ("100", "reviewProgress100"),
    "reviewProgress101": ("101", "reviewProgress101"),
    "reviewProgress102": ("102", "reviewProgress102"),
    "profile": ("023", "profile"), "paywall": ("050", "paywall"), "paywallOffer": ("073", "paywallOffer"),
    "paywallOffer095": ("095", "paywallOffer095"),
    "paywallSuccess064": ("064", "paywallSuccess064"),
    "story": ("005", "story"),
    "paywall007": ("007", "paywall"), "cropEditor011": ("011", "cropEditor"),
    "profileNickname024": ("024", "profileNickname"), "systemLanguage025": ("025", "systemLanguage"),
    "cropRatio036": ("036", "cropRatio"),
    "objectNameSunflower037": ("037", "objectNameSunflower"), "examples038": ("038", "examples"),
    "profile044": ("044", "profile"), "confirm051": ("051", "confirm051"),
    "languages052": ("052", "languagesLearning"), "cropEditor054": ("054", "cropEditor054"),
    "reviewResult059": ("059", "reviewResult059"), "profileNickname061": ("061", "profileNickname"),
    "confirmFullImageHint065": ("065", "confirmFullImageHint"),
    "confirmFullImage066": ("066", "confirmFullImage"),
    # Shared-route aliases expose missing source photos/background processing; they are not matched source renders.
    "confirmIceCream090Alias": ("090", "confirmFullImage"),
    "confirmIceCream091Alias": ("091", "confirmFullImage"),
    "profileNickname070": ("070", "profileNickname"), "profile072": ("072", "profile"),
    "languageSwitchLoading062": ("062", "languageSwitchLoading062"),
    "profileLanguageSheet046": ("046", "profileLanguageSheet046"),
    "dailyReminderDisabled026": ("026", "dailyReminderDisabled026"),
    "dailyReminder047": ("047", "dailyReminder047"),
    "profileVoiceChooser048": ("048", "profileVoiceChooser048"),
    "profileVoiceDownload049": ("049", "profileVoiceDownload049"),
    "dailyReminder063": ("063", "dailyReminder063"),
    "languageSwitchSuccess071": ("071", "languageSwitchSuccess071"),
    "spokenContentStep1": ("028", "spokenContentStep1"),
    "spokenContentStep3": ("029", "spokenContentStep3"),
}
# Fixed source-measured bounds, not a registration/alignment optimization.
REGIONS = {
    "reviewGoal": (59, 234, 334, 618),
    "reviewGoal043": (59, 234, 334, 618),
    "review": (49, 218, 344, 634),
}
for folder in ["comparisons", "diffs", "overlays"]:
    (ROOT / "qa" / folder).mkdir(parents=True, exist_ok=True)

metrics = []
for route, (number, rendered_route) in MAP.items():
    source = ROOT / f"research/gummble/screens/{number}.png"
    rendered = ROOT / f"qa/screens/{rendered_route}.png"
    if not source.exists() or not rendered.exists():
        continue

    source_full = Image.open(source).convert("RGB").resize(VIEWPORT, Image.Resampling.LANCZOS)
    rendered_full = Image.open(rendered).convert("RGB")
    if rendered_full.size != VIEWPORT:
        raise ValueError(f"{route} size {rendered_full.size}")
    source_content = source_full.crop(APP_CONTENT_BOUNDS)
    rendered_content = rendered_full.crop(APP_CONTENT_BOUNDS)
    content_width, content_height = source_content.size
    pair = Image.new(
        "RGB", (content_width * 2 + PAIR_GUTTER, content_height), PAIR_BACKGROUND
    )
    pair.paste(source_content, (0, 0))
    pair.paste(rendered_content, (content_width + PAIR_GUTTER, 0))
    pair.save(ROOT / f"qa/comparisons/{route}.png")
    Image.blend(source_content, rendered_content, 0.5).save(
        ROOT / f"qa/overlays/{route}.png"
    )

    source_array = np.asarray(source_content).astype(float)
    rendered_array = np.asarray(rendered_content).astype(float)
    error = np.abs(source_array - rendered_array)
    heat = np.clip(error * 3, 0, 255).astype("uint8")
    Image.fromarray(heat).save(ROOT / f"qa/diffs/{route}.png")
    metric = {
        "route": route,
        "rendered_screen": rendered_route,
        "reference": number,
        "mae_0_255": round(float(error.mean()), 3),
        "pixels_over_8_channel_error_percent": round(float((error.max(axis=2) > 8).mean() * 100), 3),
        "exactly_equal_percent": round(float((error.max(axis=2) == 0).mean() * 100), 3),
        "pixel_perfect": bool((error == 0).all()),
    }
    if route in REGIONS:
        x0, y0, x1, y1 = REGIONS[route]
        full_error = np.abs(
            np.asarray(source_full).astype(float) - np.asarray(rendered_full).astype(float)
        )
        region = {
            "bounds_viewport_points": list(REGIONS[route]),
            "mae_0_255": round(float(full_error[y0:y1, x0:x1].mean()), 3),
        }
        before_path = ROOT / f"qa/screens/{route}-before.png"
        if before_path.exists():
            before_full = Image.open(before_path).convert("RGB")
            if before_full.size != rendered_full.size:
                raise ValueError(f"{route} baseline size {before_full.size}")
            before_content = before_full.crop(APP_CONTENT_BOUNDS)
            before_error = np.abs(
                np.asarray(source_content).astype(float)
                - np.asarray(before_content).astype(float)
            )
            before_full_error = np.abs(
                np.asarray(source_full).astype(float)
                - np.asarray(before_full).astype(float)
            )
            region["before_mae_0_255"] = round(
                float(before_full_error[y0:y1, x0:x1].mean()), 3
            )
            metric["before_mae_0_255"] = round(float(before_error.mean()), 3)
        metric[
            "dialog_region"
            if route in {"reviewGoal", "reviewGoal043"}
            else "card_region"
        ] = region
    metrics.append(metric)

report = {
    "baseline_viewport": list(VIEWPORT),
    "app_content_bounds_viewport_points": list(APP_CONTENT_BOUNDS),
    "order": "reference left, implementation right; system chrome excluded",
    "method": "Reference resized with Lanczos; content-only RGB absolute error. No registration, masking, or metric-based alignment. Native status/home chrome is excluded; font rasterization and app-content differences remain. This is a QA metric, not a similarity guarantee.",
    "screens": metrics,
}
(ROOT / "qa/visual-metrics.json").write_text(json.dumps(report, indent=2) + "\n")
for metric in metrics:
    print(
        f"{metric['route']:14} MAE={metric['mae_0_255']:7.3f} "
        f"changed>8={metric['pixels_over_8_channel_error_percent']:6.2f}% "
        f"pixel-perfect={metric['pixel_perfect']}"
    )
