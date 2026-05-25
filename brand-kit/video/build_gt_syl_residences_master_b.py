"""
GT-SYL-RESIDENCES-MASTER — Long-form spotlight for MODCON SYL Residences
─────────────────────────────────────────────────────────
~33s source @ 120 BPM · 1080x1920 · 60fps · slowed 1.32x at mux → ~43.5s

The RESIDENTIAL side of MODCON SYL (parallel to the gt-agartha-master).
Companion to gt-syl-commercial-master (the commercial-side reel).

STRATEGIES APPLIED (per competitor-research synthesis):
  - Drone-style opener  : first ~0.9s is the photo alone, then text fades in
  - Number scramble     : NUMBERS beat uses the slot-machine reveal primitive
  - SAFE_TOP=270        : Meta March 2026 unified safe zone
  - Speed-ramped slams  : chip stagger tightened from 0.45 → 0.35s
  - Hand-drawn circle   : scribble oval around RESIDENCES (not clean ellipse)
  - NO price on screen  : brief C4 + RERA prudence; price-per-SFT is in DM

NARRATIVE:
  1. HOOK          drone-style → "BEFORE YOU GO LOOKING / TRY THIS."
  2. REVEAL        "MODCON SYL · RESIDENCES"
  3. CONTEXT       Tukkuguda · ORR Exit-14 · 10 min to airport
  4. NUMBERS       4.5 ACRES · 22,000 SQ FT CLUBHOUSE · 2500-4500 SFT · BIOPHILIC
  5. AMENITIES     Natural Bio Pool · Yoga Pavilion · forest-view balconies
  6. THE OPPORTUNITY  Agartha investors gained +37%  → "SYL is the next window"
  7. PHILOSOPHY    "a modern address where luxury meets nature."
  8. CTA           COMMENT 'SYL' — we DM the full brief

provenance:
  - thegreenteam.in MODCON SYL Residences listing (Tukkuguda ORR Exit-14,
    4.5 acres biophilic, 2500-4500 SFT villaments, 22,000 sq ft clubhouse
    with chemical-free Natural Bio Pool + Yoga Pavilion, 10 min airport)
  - Agartha +37% in 18 months — sourced from site copy
"""
from __future__ import annotations

import io
import subprocess
import sys
import time
from pathlib import Path

import cairosvg
import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parent
REPO = ROOT.parent.parent
sys.path.insert(0, str(ROOT))

from _lib import (  # noqa: E402
    CX, FONT_DISPLAY, FONT_MONO, FONT_SERIF,
    GT_CREAM, GT_GOLD_LIGHT, GT_OLIVE_700, GT_OLIVE_800, GT_OLIVE_900,
    GT_SAGE, GT_TERRACOTTA, GT_TERRACOTTA_LIGHT,
    H, SAFE_TEXT_W, SAFE_TOP, W, FPS,
    Beat, beat_grid, clamp, ease_in_out_cubic, ease_out_back, ease_out_cubic,
    embed_logo, escape, fit_to_width, hand_arrow, hand_circle, kicker,
    number_scramble, serif_pullquote, shake_offset, svg_text,
)

LOGO = ROOT.parent / "logo" / "the-green-team-monogram.svg"
GAL = REPO / "public" / "gallery" / "syl"

# Residential SYL imagery (only hi-res, residential-coded photos)
PHOTO_LOBBY       = GAL / "1776279315359.webp"   # lobby with palms
PHOTO_PLAZA       = GAL / "1776279320251.webp"   # biophilic plaza interior
PHOTO_3PANEL      = GAL / "1776279339464.webp"   # 3-panel: pool / gym / lounge
PHOTO_INFINITY    = GAL / "1776279350036.webp"   # infinity pool with forest view
PHOTO_BALCONY_TUB = GAL / "1776279361294.webp"   # sunset balcony with soaking tub
PHOTO_BEDROOM     = GAL / "1776279377269.webp"   # forest-view bedroom

# ─── Ben Böhmer beat-sync (123 BPM, melodic house) ─────────────────────
# Matched to the Agartha master — both videos now ride the same 123 BPM
# grid so they cross-cut cleanly in a campaign.
BPM = 123
SCALE = 120.0 / BPM  # 0.9756
SECTIONS = {
    "HOOK":         (0.0  * SCALE, 3.5  * SCALE, PHOTO_INFINITY),
    "REVEAL":       (3.5  * SCALE, 7.5  * SCALE, PHOTO_PLAZA),
    "CONTEXT":      (7.5  * SCALE, 10.5 * SCALE, GT_OLIVE_900),
    "NUMBERS":      (10.5 * SCALE, 15.5 * SCALE, PHOTO_3PANEL),
    "AMENITIES":    (15.5 * SCALE, 19.0 * SCALE, PHOTO_LOBBY),
    "OPPORTUNITY":  (19.0 * SCALE, 23.0 * SCALE, PHOTO_BALCONY_TUB),
    "LIFESTYLE":    (23.0 * SCALE, 26.5 * SCALE, PHOTO_BEDROOM),
    "PHILOSOPHY":   (26.5 * SCALE, 29.0 * SCALE, PHOTO_INFINITY),
    "CTA":          (29.0 * SCALE, 33.0 * SCALE, None),
}
SOURCE_LENGTH = 33.0 * SCALE
SLOW = 1.0
IMPACT_BEATS = [0, 7, 15, 21, 31, 38, 46, 53, 58]

OUT_ROOT = REPO / "out"
FRAMES_DIR = OUT_ROOT / "frames_gt-syl-residences-master-b"
SILENT_MP4 = OUT_ROOT / "brandmint-gt-syl-residences-master-b-silent.mp4"

MAX_ZOOM = 1.20


# ─── Photo + gradient caches (Pillow path, ~10x faster than cairosvg embed) ─
_PHOTO_AT_MAX: dict[Path, Image.Image] = {}
_GRAD_CACHE: dict[tuple[float, float], Image.Image] = {}


def photo_at_max_zoom(path: Path) -> Image.Image:
    if path in _PHOTO_AT_MAX:
        return _PHOTO_AT_MAX[path]
    im = Image.open(path).convert("RGB")
    pw, ph = im.size
    target_w = int(W * MAX_ZOOM)
    target_h = int(H * MAX_ZOOM)
    r = max(target_w / pw, target_h / ph)
    im = im.resize((int(pw * r), int(ph * r)), Image.LANCZOS)
    _PHOTO_AT_MAX[path] = im
    return im


def gradient_overlay_image(top: float, bottom: float) -> Image.Image:
    key = (round(top, 3), round(bottom, 3))
    if key in _GRAD_CACHE:
        return _GRAD_CACHE[key]
    y = np.arange(H, dtype=np.float32) / H
    alpha = (top + (bottom - top) * y) * 255
    alpha = np.clip(alpha, 0, 255).astype(np.uint8)
    arr = np.zeros((H, W, 4), dtype=np.uint8)
    arr[..., 0] = 0x1a; arr[..., 1] = 0x24; arr[..., 2] = 0x10
    arr[..., 3] = alpha[:, None]
    im = Image.fromarray(arr, "RGBA")
    _GRAD_CACHE[key] = im
    return im


def render_photo_backdrop(path, t_local, duration,
                          scale_from=1.02, scale_to=1.14, pan_y=-40,
                          gradient_top=0.40, gradient_bottom=0.85):
    u = clamp(t_local / max(duration, 1e-6))
    sc = scale_from + (scale_to - scale_from) * ease_in_out_cubic(u)
    photo = photo_at_max_zoom(path)
    pw, ph = photo.size
    factor = MAX_ZOOM / sc
    win_w = int(W * factor)
    win_h = int(H * factor)
    photo_pan_y = pan_y * u * factor
    x0 = max(0, min(pw - win_w, (pw - win_w) // 2))
    y0 = max(0, min(ph - win_h, (ph - win_h) // 2 - int(photo_pan_y)))
    cropped = photo.crop((x0, y0, x0 + win_w, y0 + win_h))
    if cropped.size != (W, H):
        cropped = cropped.resize((W, H), Image.LANCZOS)
    grad = gradient_overlay_image(gradient_top, gradient_bottom)
    composed = cropped.convert("RGBA")
    composed.alpha_composite(grad)
    return composed.convert("RGB")


def cream_backdrop():
    return Image.new("RGB", (W, H), (0xfa, 0xf9, 0xf6))


def solid_backdrop(hex_color: str):
    r = int(hex_color[1:3], 16); g = int(hex_color[3:5], 16); b = int(hex_color[5:7], 16)
    return Image.new("RGB", (W, H), (r, g, b))


def render_text_layer(body_svg, shake):
    sx, sy = shake
    svg = (
        f'<?xml version="1.0" encoding="UTF-8"?>'
        f'<svg xmlns="http://www.w3.org/2000/svg" '
        f'width="{W}" height="{H}" viewBox="0 0 {W} {H}">'
        f'<g transform="translate({sx:.2f},{sy:.2f})">{body_svg}</g></svg>'
    )
    png_bytes = cairosvg.svg2png(bytestring=svg.encode("utf-8"),
                                  output_width=W, output_height=H)
    return Image.open(io.BytesIO(png_bytes)).convert("RGBA")


# ─── CONTEXT diagram: stylised highway-line connectivity map ───────────
def context_diagram_svg(t_local: float, dur: float) -> str:
    parts: list[str] = []
    parts.append(serif_pullquote("on the next-city corridor.",
                                 CX, 560, size=40, color=GT_GOLD_LIGHT))
    parts.append(kicker("TUKKUGUDA · ORR EXIT-14", y=620, color=GT_CREAM))

    line_y = 950
    parts.append(
        f'<line x1="120" y1="{line_y}" x2="{W-120}" y2="{line_y}" '
        f'stroke="{GT_SAGE}" stroke-width="6" stroke-linecap="round"/>'
    )

    side_landmarks = [
        (0.3,  220, "ORR EXIT-14",   "ADJACENT"),
        (0.6,  860, "INT'L AIRPORT", "10 MIN"),
    ]
    for start, x, big, small in side_landmarks:
        if t_local < start:
            continue
        a = clamp((t_local - start) / 0.35)
        parts.append(
            f'<g opacity="{a:.3f}">'
            f'<circle cx="{x}" cy="{line_y}" r="10" fill="{GT_GOLD_LIGHT}"/>'
            f'{svg_text(big,   x, line_y - 60, 30, fill=GT_CREAM, font=FONT_DISPLAY, letter_spacing=-1)}'
            f'{svg_text(small, x, line_y - 28, 20, fill=GT_SAGE,  font=FONT_MONO,    letter_spacing=4)}'
            f'</g>'
        )

    parts.append(
        f'<circle cx="{CX}" cy="{line_y}" r="34" fill="{GT_GOLD_LIGHT}" '
        f'stroke="{GT_OLIVE_900}" stroke-width="6"/>'
    )
    if t_local > 1.0:
        a = clamp((t_local - 1.0) / 0.35)
        parts.append(
            f'<g opacity="{a:.3f}">'
            f'{svg_text("SYL RESIDENCES",  CX, line_y + 80,  44, fill=GT_GOLD_LIGHT, font=FONT_DISPLAY, letter_spacing=-1)}'
            f'{svg_text("4TH-CITY CORRIDOR", CX, line_y + 118, 24, fill=GT_CREAM,    font=FONT_MONO,    letter_spacing=6)}'
            f'</g>'
        )

    if t_local > 1.5:
        a = clamp((t_local - 1.5) / 0.4)
        line = svg_text("THRESHOLD OF HYDERABAD'S FOURTH CITY",
                        CX, 1280, 30, fill=GT_GOLD_LIGHT,
                        font=FONT_MONO, letter_spacing=5)
        parts.append(f'<g opacity="{a:.3f}">{line}</g>')

    return "".join(parts)


def text_for_section(name: str, t_local: float, dur: float) -> str:
    parts: list[str] = []

    if name == "HOOK":
        # STRATEGY: drone-style — pure photo for the first ~0.9s, no text.
        eyebrow_a = clamp((t_local - 0.6) / 0.4)
        if eyebrow_a > 0:
            parts.append(
                f'<g opacity="{eyebrow_a:.3f}">'
                f'{serif_pullquote("the green team — editorial", CX, SAFE_TOP + 50, size=32, color=GT_SAGE)}'
                f'</g>'
            )
        hl_a = clamp((t_local - 0.9) / 0.35)
        if hl_a > 0:
            parts.append(
                f'<g opacity="{hl_a:.3f}">'
                f'{svg_text("BEFORE YOU GO", CX, 540, 66, fill=GT_CREAM, font=FONT_DISPLAY)}'
                f'</g>'
            )
        chip_y = 770
        chip_t = clamp((t_local - 1.1) / 0.4)
        sc = ease_out_back(chip_t)
        if chip_t > 0:
            parts.append(
                f'<g opacity="{clamp(chip_t * 1.2):.3f}" '
                f'transform="translate({CX},{chip_y}) rotate(-3.5) scale({sc:.3f}) translate({-CX},{-chip_y})">'
                f'<rect x="{CX-400}" y="{chip_y-130}" width="800" height="260" '
                f'rx="22" fill="{GT_SAGE}" stroke="{GT_OLIVE_900}" stroke-width="6"/>'
                f'{svg_text("LOOKING ELSEWHERE", CX, chip_y+20, 76, fill=GT_OLIVE_900, font=FONT_DISPLAY, letter_spacing=-2)}'
                f'{svg_text("LOOK HERE FIRST.", CX, chip_y+95, 50, fill=GT_OLIVE_900, font=FONT_DISPLAY, letter_spacing=-2)}'
                f'</g>'
            )
        sub_a = clamp((t_local - 1.7) / 0.35)
        if sub_a > 0:
            parts.append(
                f'<g opacity="{sub_a:.3f}">'
                f'{svg_text("TUKKUGUDA · ORR EXIT-14", CX, 1150, 32, fill=GT_GOLD_LIGHT, font=FONT_MONO, letter_spacing=8)}'
                f'{svg_text("4.5 ACRES · BIOPHILIC", CX, 1200, 26, fill=GT_CREAM, font=FONT_MONO, letter_spacing=6)}'
                f'</g>'
            )

    elif name == "REVEAL":
        parts.append(serif_pullquote("introducing", CX, 540, size=44, color=GT_GOLD_LIGHT))
        sc = ease_out_back(clamp(t_local / 0.5))
        parts.append(
            f'<g transform="translate({CX},900) scale({sc:.3f}) translate({-CX},{-900})">'
            f'{svg_text("MODCON SYL", CX, 790, 110, fill=GT_CREAM, font=FONT_DISPLAY, stroke=GT_OLIVE_900, stroke_w=5)}'
            f'{svg_text("RESIDENCES", CX, 960, 130, fill=GT_SAGE, font=FONT_DISPLAY, stroke=GT_OLIVE_900, stroke_w=5, letter_spacing=-2)}'
            f'</g>'
        )
        if t_local > 1.0:
            a = clamp((t_local - 1.0) / 0.4)
            # SCRIBBLE oval — measured for RESIDENCES (130pt, similar bounds to COMMERCIAL)
            parts.append(f'<g opacity="{a:.3f}">'
                        f'{hand_circle(CX, 912, 490, 100, stroke_w=10, seed=44, color=GT_GOLD_LIGHT)}'
                        f'</g>')
        if t_local > 1.5:
            a = clamp((t_local - 1.5) / 0.4)
            parts.append(f'<g opacity="{a:.3f}">'
                        f'{serif_pullquote("a modern address where luxury meets nature.", CX, 1110, size=34, color=GT_GOLD_LIGHT)}'
                        f'</g>')
        if t_local > 2.0:
            a = clamp((t_local - 2.0) / 0.4)
            parts.append(
                f'<g opacity="{a:.3f}">'
                f'{svg_text("VILLAMENTS · 2,500 – 4,500 SFT", CX, 1215, 32, fill=GT_CREAM, font=FONT_MONO, letter_spacing=6)}'
                f'</g>'
            )

    elif name == "CONTEXT":
        parts.append(context_diagram_svg(t_local, dur))

    elif name == "NUMBERS":
        # STRATEGY: number scramble on each stat — slot-machine reveal
        parts.append(kicker("VERIFIED ON THE GROUND", y=SAFE_TOP + 60, color=GT_CREAM))
        parts.append(serif_pullquote("the numbers, not the pitch.",
                                     CX, SAFE_TOP + 140, size=34, color=GT_SAGE))
        chips = [
            (0.0,  "4.5 ACRES",            GT_SAGE,       GT_OLIVE_900, 600,  -4),
            (0.35, "22,000 SQ FT CLUBHOUSE", GT_GOLD_LIGHT, GT_OLIVE_900, 830, 3),
            (0.75, "2,500 – 4,500 SFT",    GT_CREAM,      GT_OLIVE_900, 1060, -3),
            (1.15, "10 MIN TO AIRPORT",    GT_SAGE,       GT_OLIVE_900, 1290,  2),
        ]
        for idx, (start, label, fill, ink, y, rot) in enumerate(chips):
            if t_local < start:
                continue
            local = t_local - start
            sc = ease_out_back(clamp(local / 0.3))
            pt = fit_to_width(label, 720, start_pt=84, floor_pt=42)
            text_el = number_scramble(
                label, t_local=local, duration=0.55,
                x=CX, y=y + 30, size=pt,
                fill=ink, font=FONT_DISPLAY, letter_spacing=-2,
                seed=20 + idx,
            )
            parts.append(
                f'<g transform="translate({CX},{y}) rotate({rot}) scale({sc:.3f}) translate({-CX},{-y})">'
                f'<rect x="{CX-400}" y="{y-95}" width="800" height="190" '
                f'rx="18" fill="{fill}" stroke="{GT_OLIVE_900}" stroke-width="5"/>'
                f'{text_el}'
                f'</g>'
            )

    elif name == "AMENITIES":
        parts.append(serif_pullquote("inside the 22,000 sq ft clubhouse",
                                     CX, 580, size=40, color=GT_GOLD_LIGHT))
        items = [
            (0.0,  "NATURAL BIO POOL"),
            (0.25, "YOGA PAVILION"),
            (0.5,  "FOREST-VIEW BALCONIES"),
            (0.75, "BIOPHILIC INTERIORS"),
            (1.0,  "GATED · CHEMICAL-FREE"),
        ]
        for i, (start, label) in enumerate(items):
            if t_local < start:
                continue
            a = clamp((t_local - start) / 0.25)
            y = 740 + i * 88
            sc = ease_out_back(clamp((t_local - start) / 0.3))
            parts.append(
                f'<g opacity="{a:.3f}" transform="translate({CX},{y}) scale({sc:.3f}) translate({-CX},{-y})">'
                f'<rect x="{CX-360}" y="{y-38}" width="720" height="72" '
                f'rx="14" fill="{GT_OLIVE_800}" stroke="{GT_OLIVE_900}" stroke-width="4"/>'
                f'{svg_text(label, CX, y+18, 36, fill=GT_CREAM, font=FONT_DISPLAY, letter_spacing=-1)}'
                f'</g>'
            )

    elif name == "OPPORTUNITY":
        # Pre-investor framing referencing Agartha's +37%
        parts.append(serif_pullquote("the last pre-investor window paid:",
                                     CX, 520, size=38, color=GT_GOLD_LIGHT))
        chip_y = 800
        sc = ease_out_back(clamp(t_local / 0.4))
        parts.append(
            f'<g transform="translate({CX},{chip_y}) rotate(-3) scale({sc:.3f}) translate({-CX},{-chip_y})">'
            f'<rect x="{CX-440}" y="{chip_y-170}" width="880" height="340" '
            f'rx="24" fill="{GT_SAGE}" stroke="{GT_OLIVE_900}" stroke-width="6"/>'
            # Scramble the +37% number for kinetic impact
            f'{number_scramble("+37%", t_local=t_local, duration=0.6, x=CX, y=chip_y+90, size=240, fill=GT_OLIVE_900, font=FONT_DISPLAY, letter_spacing=-6, seed=44)}'
            f'</g>'
        )
        if t_local > 0.8:
            a = clamp((t_local - 0.8) / 0.4)
            parts.append(
                f'<g opacity="{a:.3f}">'
                f'{svg_text("AGARTHA INVESTORS · 18 MONTHS", CX, 1180, 52, fill=GT_CREAM, font=FONT_DISPLAY, stroke=GT_OLIVE_900, stroke_w=3)}'
                f'{svg_text("(SITE COPY · SYL IS THE NEXT WINDOW)", CX, 1240, 24, fill=GT_GOLD_LIGHT, font=FONT_MONO, letter_spacing=6)}'
                f'</g>'
            )

    elif name == "LIFESTYLE":
        # Soft beat — quiet pull quote over the bedroom photo
        if t_local > 0.3:
            a = clamp((t_local - 0.3) / 0.5)
            parts.append(
                f'<g opacity="{a:.3f}">'
                f'{serif_pullquote("the view is the amenity.", CX, 950, size=64, color=GT_CREAM)}'
                f'</g>'
            )
        if t_local > 1.2:
            a = clamp((t_local - 1.2) / 0.4)
            parts.append(
                f'<g opacity="{a:.3f}">'
                f'{svg_text("FOREST-VIEW UNITS · LIMITED", CX, 1080, 28, fill=GT_GOLD_LIGHT, font=FONT_MONO, letter_spacing=8)}'
                f'</g>'
            )

    elif name == "PHILOSOPHY":
        if t_local > 0.2:
            a = clamp((t_local - 0.2) / 0.5)
            parts.append(
                f'<g opacity="{a:.3f}">'
                f'{serif_pullquote("where luxury", CX, 900, size=78, color=GT_CREAM)}'
                f'{serif_pullquote("meets nature.", CX, 990, size=78, color=GT_GOLD_LIGHT)}'
                f'</g>'
            )

    elif name == "CTA":
        # VARIANT B — lifestyle-led CTA (A/B test against the 'SYL' /
        # 'pre-investor brief' control in build_gt_syl_residences_master.py).
        # Information-led ask: floor plans + brochure, no investor language.
        parts.append(serif_pullquote("for the floor plans:",
                                     CX, 460, size=42, color=GT_OLIVE_800))
        parts.append(kicker("COMMENT THE KEYWORD", y=540, color=GT_OLIVE_700))
        chip_y = 760
        pulse = 1.0 + 0.03 * (1 if int(t_local * 4) % 2 == 0 else -1)
        parts.append(
            f'<g transform="translate({CX},{chip_y}) rotate(-2) scale({pulse:.3f}) translate({-CX},{-chip_y})">'
            f'<rect x="{CX-360}" y="{chip_y-110}" width="720" height="220" '
            f'rx="22" fill="{GT_OLIVE_800}" stroke="{GT_OLIVE_900}" stroke-width="6"/>'
            f'{svg_text("‘FOREST’", CX, chip_y+50, 150, fill=GT_GOLD_LIGHT, font=FONT_DISPLAY, letter_spacing=-2)}'
            f'</g>'
        )
        parts.append(svg_text("WE DM THE FLOOR PLANS", CX, 1000, 54,
                              fill=GT_OLIVE_800, font=FONT_DISPLAY, letter_spacing=-2))
        parts.append(svg_text("+ FULL BROCHURE.", CX, 1075, 60,
                              fill=GT_TERRACOTTA, font=FONT_DISPLAY, letter_spacing=-2))
        logo_size = 160
        logo_y = 1280
        logo_x = W - 60 - logo_size
        parts.append(embed_logo(LOGO, logo_x, logo_y, logo_size))
        parts.append(svg_text("THE GREEN TEAM", 80, logo_y + 60, 38,
                              fill=GT_OLIVE_800, font=FONT_DISPLAY,
                              anchor="start", letter_spacing=-1))
        parts.append(
            f'<text x="80" y="{logo_y + 105}" text-anchor="start" '
            f'font-family="{FONT_SERIF}" font-style="italic" font-weight="400" '
            f'font-size="26" fill="{GT_OLIVE_700}">'
            f'editorial real estate · hyderabad</text>'
        )
        parts.append(svg_text("THEGREENTEAM.IN", 80, logo_y + 150, 22,
                              fill=GT_OLIVE_800, font=FONT_MONO,
                              anchor="start", letter_spacing=6))

    return "".join(parts)


def get_section(t: float):
    for name, (a, b, bg) in SECTIONS.items():
        if a <= t < b:
            return name, a, b, bg
    last_name, last_t = list(SECTIONS.items())[-1]
    return last_name, *last_t


def render_frame(i: int, beats):
    t_sec = i / FPS
    name, a, b, bg = get_section(t_sec)
    t_local = t_sec - a
    dur = b - a
    sx, sy = shake_offset(t_sec, beats)

    if isinstance(bg, Path):
        backdrop = render_photo_backdrop(
            bg, t_local, dur,
            scale_from=1.02,
            scale_to=1.18 if name == "REVEAL" else 1.14,
            pan_y=-50 if name in ("PHILOSOPHY", "LIFESTYLE") else -40,
            gradient_top=0.50 if name in ("REVEAL", "PHILOSOPHY", "OPPORTUNITY", "LIFESTYLE") else 0.40,
            gradient_bottom=0.92 if name in ("HOOK", "REVEAL", "OPPORTUNITY") else 0.85,
        )
    elif isinstance(bg, str) and bg.startswith("#"):
        backdrop = solid_backdrop(bg)
    else:
        backdrop = cream_backdrop()

    body = text_for_section(name, t_local, dur)
    text_layer = render_text_layer(body, (sx, sy))
    canvas = backdrop.convert("RGBA")
    canvas.alpha_composite(text_layer)
    return canvas.convert("RGB")


def main():
    FRAMES_DIR.mkdir(parents=True, exist_ok=True)
    beats = beat_grid(120, SOURCE_LENGTH)
    impact = set(IMPACT_BEATS)
    for i, b in enumerate(beats):
        b.is_impact = i in impact

    total = int(SOURCE_LENGTH * FPS)
    print(f"[render] gt-syl-residences-master — {total} frames @ {FPS}fps "
          f"· {SOURCE_LENGTH}s source × {SLOW}x slow ≈ {SOURCE_LENGTH*SLOW:.1f}s playback")

    t0 = time.time()
    for i in range(total):
        img = render_frame(i, beats)
        img.save(FRAMES_DIR / f"f{i:05d}.jpg",
                 format="JPEG", quality=92, optimize=False)
        if i % 60 == 0 and i > 0:
            el = time.time() - t0
            r = i / el
            eta = (total - i) / r
            print(f"  frame {i}/{total} · {r:.1f} fps · ETA {eta:.0f}s")

    print(f"[render] done in {time.time()-t0:.0f}s")

    cmd = [
        "ffmpeg", "-y", "-framerate", str(FPS),
        "-i", str(FRAMES_DIR / "f%05d.jpg"),
        "-vf", f"setpts=PTS*{SLOW:.4f}",
        "-an",
        "-c:v", "libx264", "-preset", "slow", "-crf", "22",
        "-pix_fmt", "yuv420p", "-movflags", "+faststart",
        str(SILENT_MP4),
    ]
    print("[mux] " + " ".join(cmd[-3:]))
    subprocess.run(cmd, check=True, capture_output=True)
    print(f"[done] {SILENT_MP4}")


if __name__ == "__main__":
    main()
