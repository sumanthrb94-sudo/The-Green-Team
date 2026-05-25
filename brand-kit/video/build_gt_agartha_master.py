"""
GT-AGARTHA-MASTER — Long-form spotlight (Pillow-accelerated render)
─────────────────────────────────────────────────────────
33s source @ 120 BPM · 1080x1920 · 60fps
Slowed 1.32x at mux → ~43.5s playback.

This build uses a hybrid pipeline:
  - Pillow handles the photo backdrop (Ken Burns transform + dark gradient)
  - cairosvg renders text + annotations on a transparent canvas
  - Pillow composites text on top of the photo

This is ~10x faster than the cairosvg-embed-image approach for photo-heavy
frames (e.g. this master video, which is photo-backed for 8 of 9 sections).

Uses ONLY hi-res Agartha images (>= 1800px wide).

NARRATIVE:
  1. HOOK              "when we say curated, this is what we mean"
  2. REVEAL            "MODCON AGARTHA · roots of earth · Narsapur"
  3. AWARD             "Best Sustainable Project · Outlook Business 2024"
  4. NUMBERS           AQI 12 · 18 dB · 25 acres · 36 plots · 100+ trees
  5. ARCHITECTURE      biophilic · earthen · forest-bound
  6. AMENITIES         36,000 sqft clubhouse · pool · kayaking · farm-to-table
  7. RETURNS           Agartha investors gained +37% in 18 months
  8. PHILOSOPHY        "where the forest becomes home"
  9. CTA               COMMENT 'AGARTHA' — DM the full research doc
"""
from __future__ import annotations

import subprocess
import sys
from pathlib import Path

import cairosvg
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parent
REPO = ROOT.parent.parent
sys.path.insert(0, str(ROOT))

from _lib import (  # noqa: E402
    CX, FONT_DISPLAY, FONT_MONO, FONT_SERIF,
    GT_CREAM, GT_GOLD_LIGHT, GT_OLIVE_700, GT_OLIVE_800, GT_OLIVE_900,
    GT_SAGE, GT_TERRACOTTA, GT_TERRACOTTA_LIGHT,
    H, SAFE_TEXT_W, SAFE_TOP, W, FPS,
    Beat, beat_grid, clamp, clean_oval, ease_in_out_cubic, ease_out_back,
    ease_out_cubic, embed_logo, escape, fit_to_width, hand_arrow,
    hand_circle, kicker, serif_pullquote, shake_offset, svg_text,
)

LOGO = ROOT.parent / "logo" / "the-green-team-monogram.svg"
GAL = REPO / "public" / "gallery" / "agartha"

PHOTO_AERIAL_CLUBHOUSE = GAL / "2.webp"
PHOTO_ROUND_HOUSE      = GAL / "4.webp"
PHOTO_BIOPHILIC_HOUSE  = GAL / "11.webp"
PHOTO_BAMBOO_PATH      = GAL / "5.webp"
PHOTO_TREFOIL_AERIAL   = GAL / "7.webp"
PHOTO_HERBAL_GARDEN    = GAL / "8.webp"
PHOTO_MODERN_VILLA     = GAL / "13.webp"
PHOTO_VILLA_CLUSTER    = GAL / "17.webp"

SECTIONS = {
    "HOOK":         (0.0,  3.5,  PHOTO_AERIAL_CLUBHOUSE),
    "REVEAL":       (3.5,  7.5,  PHOTO_ROUND_HOUSE),
    "AWARD":        (7.5, 11.0,  PHOTO_BIOPHILIC_HOUSE),
    "NUMBERS":      (11.0, 16.0, PHOTO_TREFOIL_AERIAL),
    "ARCHITECTURE": (16.0, 19.5, PHOTO_HERBAL_GARDEN),
    "AMENITIES":    (19.5, 23.0, PHOTO_MODERN_VILLA),
    "RETURNS":      (23.0, 26.5, PHOTO_VILLA_CLUSTER),
    "PHILOSOPHY":   (26.5, 29.0, PHOTO_BAMBOO_PATH),
    "CTA":          (29.0, 33.0, None),  # cream paper
}
SOURCE_LENGTH = 33.0
SLOW = 1.32
IMPACT_BEATS = [0, 7, 15, 22, 32, 39, 46, 53, 58]

OUT_ROOT = REPO / "out"
FRAMES_DIR = OUT_ROOT / "frames_gt-agartha-master"
SILENT_MP4 = OUT_ROOT / "brandmint-gt-agartha-master-silent.mp4"

import numpy as np  # noqa: E402

# Maximum zoom factor across any section — used to pre-rasterize photos at
# the size they'd be at their tightest zoom. Per-frame Ken Burns is then just
# a crop (no resize), which is ~30x faster than per-frame resize.
MAX_ZOOM = 1.20

# ─── Photo cache: pre-rasterized at MAX_ZOOM covering full canvas ───────
_PHOTO_AT_MAX: dict[Path, Image.Image] = {}


def photo_at_max_zoom(path: Path) -> Image.Image:
    """Load and resize once so the photo covers (W * MAX_ZOOM) × (H * MAX_ZOOM)."""
    if path in _PHOTO_AT_MAX:
        return _PHOTO_AT_MAX[path]
    im = Image.open(path).convert("RGB")
    pw, ph = im.size
    target_w = int(W * MAX_ZOOM)
    target_h = int(H * MAX_ZOOM)
    # cover: scale by the max ratio
    r = max(target_w / pw, target_h / ph)
    new_w, new_h = int(pw * r), int(ph * r)
    im = im.resize((new_w, new_h), Image.LANCZOS)
    _PHOTO_AT_MAX[path] = im
    return im


# ─── Pre-computed gradient overlay cache (one per gradient_top/_bottom) ─
_GRAD_CACHE: dict[tuple[float, float], Image.Image] = {}


def gradient_overlay_image(top: float, bottom: float) -> Image.Image:
    key = (round(top, 3), round(bottom, 3))
    if key in _GRAD_CACHE:
        return _GRAD_CACHE[key]
    # Build the gradient as a numpy RGBA array (vectorized, ~100x faster than ImageDraw.line)
    y = np.arange(H, dtype=np.float32) / H
    alpha = (top + (bottom - top) * y) * 255
    alpha = np.clip(alpha, 0, 255).astype(np.uint8)
    arr = np.zeros((H, W, 4), dtype=np.uint8)
    arr[..., 0] = 0x1a   # R (GT_OLIVE_900)
    arr[..., 1] = 0x24   # G
    arr[..., 2] = 0x10   # B
    arr[..., 3] = alpha[:, None]
    im = Image.fromarray(arr, "RGBA")
    _GRAD_CACHE[key] = im
    return im


def render_photo_backdrop(path: Path, t_local: float, duration: float,
                          scale_from: float = 1.02, scale_to: float = 1.14,
                          pan_y: float = -40,
                          gradient_top: float = 0.40,
                          gradient_bottom: float = 0.85) -> Image.Image:
    """1080×1920 photo backdrop with Ken Burns + dark gradient.

    Pre-rasterized photo is cropped to a window whose size shrinks as the
    Ken Burns "zoom" progresses. Then resized to canvas in one pass.
    No per-frame resize of the source photo.
    """
    u = clamp(t_local / max(duration, 1e-6))
    sc = scale_from + (scale_to - scale_from) * ease_in_out_cubic(u)

    photo = photo_at_max_zoom(path)
    pw, ph = photo.size
    # Compute the crop window in the photo: smaller window = more zoom.
    # At MAX_ZOOM the photo covers WxH * MAX_ZOOM, so to render canvas at
    # zoom `sc` we want a window that is W * (MAX_ZOOM/sc) wide in the photo.
    factor = MAX_ZOOM / sc
    win_w = int(W * factor)
    win_h = int(H * factor)
    # Pan: shift the window vertically (positive pan_y = window moves up).
    # The window is centered then offset by `pan_y * u` scaled to photo coords.
    photo_pan_y = pan_y * u * factor  # in photo-pixel space
    x0 = (pw - win_w) // 2
    y0 = (ph - win_h) // 2 - int(photo_pan_y)
    # Clamp
    x0 = max(0, min(pw - win_w, x0))
    y0 = max(0, min(ph - win_h, y0))
    cropped = photo.crop((x0, y0, x0 + win_w, y0 + win_h))
    # Resize to canvas
    if cropped.size != (W, H):
        cropped = cropped.resize((W, H), Image.LANCZOS)

    grad = gradient_overlay_image(gradient_top, gradient_bottom)
    composed = cropped.convert("RGBA")
    composed.alpha_composite(grad)
    return composed.convert("RGB")


def cream_backdrop() -> Image.Image:
    return Image.new("RGB", (W, H), (0xfa, 0xf9, 0xf6))


# ─── Cairo SVG → transparent PNG (text + annotations only) ─────────────
def render_text_layer(body_svg: str, shake: tuple[float, float]) -> Image.Image:
    """Render the text/annotation SVG on a transparent canvas."""
    sx, sy = shake
    svg = (
        f'<?xml version="1.0" encoding="UTF-8"?>'
        f'<svg xmlns="http://www.w3.org/2000/svg" '
        f'width="{W}" height="{H}" viewBox="0 0 {W} {H}">'
        f'<g transform="translate({sx:.2f},{sy:.2f})">'
        f'{body_svg}'
        f'</g></svg>'
    )
    png_bytes = cairosvg.svg2png(
        bytestring=svg.encode("utf-8"),
        output_width=W, output_height=H,
    )
    import io
    return Image.open(io.BytesIO(png_bytes)).convert("RGBA")


# ─── Per-section text bodies (returns SVG body string, NO photo) ────────
def text_for_section(section_name: str, t_local: float, dur: float) -> str:
    parts: list[str] = []

    if section_name == "HOOK":
        parts.append(serif_pullquote("the green team — editorial",
                                     CX, SAFE_TOP + 50, size=32, color=GT_SAGE))
        parts.append(svg_text("WHEN WE SAY", CX, 540, 64,
                              fill=GT_CREAM, font=FONT_DISPLAY))
        chip_y = 760
        sc = ease_out_back(clamp(t_local / 0.4))
        parts.append(
            f'<g transform="translate({CX},{chip_y}) rotate(-3.5) scale({sc:.3f}) translate({-CX},{-chip_y})">'
            f'<rect x="{CX-380}" y="{chip_y-120}" width="760" height="240" '
            f'rx="20" fill="{GT_SAGE}" stroke="{GT_OLIVE_900}" stroke-width="6"/>'
            f'{svg_text("CURATED", CX, chip_y+50, 130, fill=GT_OLIVE_900, font=FONT_DISPLAY, letter_spacing=-3)}'
            f'</g>'
        )
        parts.append(svg_text("THIS IS WHAT WE MEAN.", CX, 1100, 50,
                              fill=GT_CREAM, font=FONT_DISPLAY))
        parts.append(svg_text("(25 ACRES · NARSAPUR FOREST)", CX, 1160, 28,
                              fill=GT_GOLD_LIGHT, font=FONT_MONO, letter_spacing=8))
        if t_local > 1.0:
            a = clamp((t_local - 1.0) / 0.4)
            parts.append(f'<g opacity="{a:.3f}">'
                        f'{hand_circle(CX, chip_y, 410, 140, stroke_w=10, seed=7, color=GT_TERRACOTTA_LIGHT)}'
                        f'</g>')
        if t_local > 1.4:
            a = clamp((t_local - 1.4) / 0.3)
            parts.append(f'<g opacity="{a:.3f}">'
                        f'{hand_arrow(CX+460, 1260, CX+220, 1110, stroke_w=10, seed=41, color=GT_TERRACOTTA_LIGHT)}'
                        f'</g>')

    elif section_name == "REVEAL":
        parts.append(serif_pullquote("the 1 in 100", CX, 540, size=44, color=GT_GOLD_LIGHT))
        sc = ease_out_back(clamp(t_local / 0.5))
        parts.append(
            f'<g transform="translate({CX},900) scale({sc:.3f}) translate({-CX},{-900})">'
            f'{svg_text("MODCON", CX, 800, 120, fill=GT_CREAM, font=FONT_DISPLAY, stroke=GT_OLIVE_900, stroke_w=5)}'
            f'{svg_text("AGARTHA", CX, 970, 160, fill=GT_SAGE, font=FONT_DISPLAY, stroke=GT_OLIVE_900, stroke_w=6, letter_spacing=-2)}'
            f'</g>'
        )
        if t_local > 1.0:
            a = clamp((t_local - 1.0) / 0.4)
            # Symmetrical clean ellipse — no wobble dipping into letterforms.
            # Sized to enclose AGARTHA (160pt) with ≥30px breathing room.
            parts.append(f'<g opacity="{a:.3f}">'
                        f'{clean_oval(CX, 975, 520, 130, stroke_w=9, color=GT_GOLD_LIGHT, rotate_deg=-2)}'
                        f'</g>')
        # Tagline pushed lower (was y=1140) so there is a clear gap between
        # the oval bottom (~1105) and the italic baseline.
        if t_local > 1.4:
            a = clamp((t_local - 1.4) / 0.4)
            parts.append(f'<g opacity="{a:.3f}">'
                        f'{serif_pullquote("roots of earth", CX, 1185, size=44, color=GT_GOLD_LIGHT)}'
                        f'</g>')
        if t_local > 2.0:
            a = clamp((t_local - 2.0) / 0.4)
            parts.append(
                f'<g opacity="{a:.3f}">'
                f'{svg_text("NARSAPUR FOREST · NEAR THE RRR", CX, 1295, 36, fill=GT_CREAM, font=FONT_MONO, letter_spacing=8)}'
                f'{svg_text("40 MIN TO HYDERABAD FINANCIAL DISTRICT", CX, 1351, 26, fill=GT_SAGE, font=FONT_MONO, letter_spacing=6)}'
                f'</g>'
            )

    elif section_name == "AWARD":
        parts.append(serif_pullquote("public record · outlook business",
                                     CX, SAFE_TOP + 60, size=30, color=GT_SAGE))
        parts.append(kicker("THE PROOF", y=SAFE_TOP + 130, color=GT_CREAM))
        ay = 700
        sc = ease_out_back(clamp(t_local / 0.4))
        block_w, block_h = 940, 480
        bx = CX - block_w / 2
        by = ay
        parts.append(
            f'<g transform="translate({CX},{by + block_h/2}) rotate(-2) scale({sc:.3f}) translate({-CX},{-(by + block_h/2)})">'
            f'<rect x="{bx}" y="{by}" width="{block_w}" height="{block_h}" '
            f'rx="22" fill="{GT_OLIVE_800}" stroke="{GT_OLIVE_900}" stroke-width="6"/>'
            f'{svg_text("WINNER", CX, by + 80, 38, fill=GT_SAGE, font=FONT_MONO, letter_spacing=14)}'
            f'{svg_text("OUTLOOK ECO", CX, by + 220, 84, fill=GT_CREAM, font=FONT_DISPLAY)}'
            f'{svg_text("AWARD  2024", CX, by + 380, 100, fill=GT_GOLD_LIGHT, font=FONT_DISPLAY, letter_spacing=-2)}'
            f'</g>'
        )
        if t_local > 1.0:
            a = clamp((t_local - 1.0) / 0.4)
            # Symmetrical clean ellipse — matches REVEAL annotation style.
            parts.append(f'<g opacity="{a:.3f}">'
                        f'{clean_oval(CX, by + 385, 400, 95, stroke_w=9, color=GT_GOLD_LIGHT, rotate_deg=-2)}'
                        f'</g>')
        if t_local > 1.7:
            a = clamp((t_local - 1.7) / 0.4)
            quote = serif_pullquote("best sustainable project — india",
                                    CX, 1410, size=36, color=GT_CREAM)
            parts.append(f'<g opacity="{a:.3f}">{quote}</g>')

    elif section_name == "NUMBERS":
        parts.append(kicker("VERIFIED AT THE SITE", y=SAFE_TOP + 60, color=GT_CREAM))
        parts.append(serif_pullquote("the numbers we measured.",
                                     CX, SAFE_TOP + 140, size=34, color=GT_SAGE))
        chips = [
            (0.0,  "AQI 12",              GT_SAGE,       GT_OLIVE_900, 600,  -4),
            (0.4,  "18 dB NOISE",         GT_GOLD_LIGHT, GT_OLIVE_900, 830,   3),
            (0.85, "25 ACRES · 36 PLOTS", GT_CREAM,      GT_OLIVE_900, 1060, -3),
            (1.3,  "100+ TREE VARIETIES", GT_SAGE,       GT_OLIVE_900, 1290,  2),
        ]
        for start, label, fill, ink, y, rot in chips:
            if t_local < start:
                continue
            sc = ease_out_back(clamp((t_local - start) / 0.35))
            pt = fit_to_width(label, 720, start_pt=90, floor_pt=42)
            parts.append(
                f'<g transform="translate({CX},{y}) rotate({rot}) scale({sc:.3f}) translate({-CX},{-y})">'
                f'<rect x="{CX-400}" y="{y-95}" width="800" height="190" '
                f'rx="18" fill="{fill}" stroke="{GT_OLIVE_900}" stroke-width="5"/>'
                f'{svg_text(label, CX, y+30, pt, fill=ink, font=FONT_DISPLAY, letter_spacing=-2)}'
                f'</g>'
            )

    elif section_name == "ARCHITECTURE":
        parts.append(serif_pullquote("biophilic. earthen. forest-bound.",
                                     CX, 720, size=44, color=GT_CREAM))
        if t_local > 0.6:
            a = clamp((t_local - 0.6) / 0.35)
            parts.append(
                f'<g opacity="{a:.3f}">'
                f'{svg_text("EARTHEN MATERIALS", CX, 900, 56, fill=GT_GOLD_LIGHT, font=FONT_DISPLAY, stroke=GT_OLIVE_900, stroke_w=3)}'
                f'{svg_text("SPIRAL HERBAL GARDENS", CX, 970, 44, fill=GT_CREAM, font=FONT_DISPLAY)}'
                f'{svg_text("100+ TREE VARIETIES PER PLOT", CX, 1040, 32, fill=GT_SAGE, font=FONT_MONO, letter_spacing=6)}'
                f'</g>'
            )

    elif section_name == "AMENITIES":
        parts.append(serif_pullquote("inside the 36,000 sq ft clubhouse",
                                     CX, 580, size=40, color=GT_GOLD_LIGHT))
        amenities = [
            (0.0,  "AQUATIC POOL"),
            (0.25, "KAYAKING LAKE"),
            (0.5,  "FARM-TO-TABLE DINING"),
            (0.75, "GYM"),
            (1.0,  "STAYCATION VILLAS"),
        ]
        for i, (start, label) in enumerate(amenities):
            if t_local < start:
                continue
            a = clamp((t_local - start) / 0.25)
            y = 740 + i * 88
            sc = ease_out_back(clamp((t_local - start) / 0.3))
            parts.append(
                f'<g opacity="{a:.3f}" transform="translate({CX},{y}) scale({sc:.3f}) translate({-CX},{-y})">'
                f'<rect x="{CX-340}" y="{y-38}" width="680" height="72" '
                f'rx="14" fill="{GT_OLIVE_800}" stroke="{GT_OLIVE_900}" stroke-width="4"/>'
                f'{svg_text(label, CX, y+18, 38, fill=GT_CREAM, font=FONT_DISPLAY, letter_spacing=-1)}'
                f'</g>'
            )

    elif section_name == "RETURNS":
        parts.append(serif_pullquote("for early investors:",
                                     CX, 520, size=42, color=GT_GOLD_LIGHT))
        chip_y = 800
        sc = ease_out_back(clamp(t_local / 0.4))
        parts.append(
            f'<g transform="translate({CX},{chip_y}) rotate(-3) scale({sc:.3f}) translate({-CX},{-chip_y})">'
            f'<rect x="{CX-440}" y="{chip_y-170}" width="880" height="340" '
            f'rx="24" fill="{GT_SAGE}" stroke="{GT_OLIVE_900}" stroke-width="6"/>'
            f'{svg_text("+37%", CX, chip_y+90, 250, fill=GT_OLIVE_900, font=FONT_DISPLAY, letter_spacing=-8)}'
            f'</g>'
        )
        if t_local > 0.8:
            a = clamp((t_local - 0.8) / 0.4)
            parts.append(
                f'<g opacity="{a:.3f}">'
                f'{svg_text("IN 18 MONTHS.", CX, 1180, 64, fill=GT_CREAM, font=FONT_DISPLAY, stroke=GT_OLIVE_900, stroke_w=3)}'
                f'{svg_text("(SITE COPY · PRE-INVESTOR PHASE)", CX, 1240, 24, fill=GT_GOLD_LIGHT, font=FONT_MONO, letter_spacing=6)}'
                f'</g>'
            )

    elif section_name == "PHILOSOPHY":
        if t_local > 0.2:
            a = clamp((t_local - 0.2) / 0.5)
            parts.append(
                f'<g opacity="{a:.3f}">'
                f'{serif_pullquote("where the forest", CX, 900, size=70, color=GT_CREAM)}'
                f'{serif_pullquote("becomes home.", CX, 990, size=70, color=GT_GOLD_LIGHT)}'
                f'</g>'
            )

    elif section_name == "CTA":
        parts.append(serif_pullquote("ask us for the full research doc.",
                                     CX, 460, size=42, color=GT_OLIVE_800))
        parts.append(kicker("COMMENT THE KEYWORD", y=540, color=GT_OLIVE_700))
        chip_y = 760
        pulse = 1.0 + 0.03 * (1 if int(t_local * 4) % 2 == 0 else -1)
        parts.append(
            f'<g transform="translate({CX},{chip_y}) rotate(-2) scale({pulse:.3f}) translate({-CX},{-chip_y})">'
            f'<rect x="{CX-380}" y="{chip_y-110}" width="760" height="220" '
            f'rx="22" fill="{GT_OLIVE_800}" stroke="{GT_OLIVE_900}" stroke-width="6"/>'
            f'{svg_text("‘AGARTHA’", CX, chip_y+45, 140, fill=GT_GOLD_LIGHT, font=FONT_DISPLAY, letter_spacing=-2)}'
            f'</g>'
        )
        parts.append(svg_text("DM TO KNOW", CX, 1000, 64,
                              fill=GT_OLIVE_800, font=FONT_DISPLAY, letter_spacing=-2))
        parts.append(svg_text("THE PRICES NOW.", CX, 1078, 70,
                              fill=GT_TERRACOTTA, font=FONT_DISPLAY,
                              letter_spacing=-2))
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


def get_section_for_time(t: float):
    """Return (name, start, end, photo_path | None) for the given source time."""
    for name, (start, end, photo) in SECTIONS.items():
        if start <= t < end:
            return name, start, end, photo
    # Default to last section if past end
    last = list(SECTIONS.items())[-1]
    return last[0], *last[1]


def render_frame(i: int, beats: list[Beat]) -> Image.Image:
    t_sec = i / FPS
    section_name, s_start, s_end, photo_path = get_section_for_time(t_sec)
    t_local = t_sec - s_start
    dur = s_end - s_start

    sx, sy = shake_offset(t_sec, beats)

    # Layer 1 — photo backdrop OR cream
    if photo_path is not None:
        backdrop = render_photo_backdrop(
            photo_path, t_local, dur,
            scale_from=1.02, scale_to=1.18 if section_name == "REVEAL" else 1.14,
            pan_y=-50 if section_name == "PHILOSOPHY" else -40,
            gradient_top=0.50 if section_name in ("REVEAL", "PHILOSOPHY", "RETURNS") else 0.40,
            gradient_bottom=0.92 if section_name in ("HOOK", "REVEAL", "RETURNS") else 0.85,
        )
    else:
        backdrop = cream_backdrop()

    # Layer 2 — text + annotations
    body = text_for_section(section_name, t_local, dur)
    text_layer = render_text_layer(body, shake=(sx, sy))

    # Composite
    canvas = backdrop.convert("RGBA")
    canvas.alpha_composite(text_layer)
    return canvas.convert("RGB")


def main():
    FRAMES_DIR.mkdir(parents=True, exist_ok=True)
    beats = beat_grid(120, SOURCE_LENGTH)
    impact = set(IMPACT_BEATS)
    for i, b in enumerate(beats):
        b.is_impact = i in impact

    total_frames = int(SOURCE_LENGTH * FPS)
    print(f"[render] gt-agartha-master — {total_frames} frames @ {FPS}fps · "
          f"{SOURCE_LENGTH}s source × {SLOW}x slow ≈ {SOURCE_LENGTH*SLOW:.1f}s playback")

    import time
    t0 = time.time()
    for i in range(total_frames):
        frame_img = render_frame(i, beats)
        # JPEG q=92 is visually indistinguishable from PNG on a phone at
        # 1080×1920 with photographic content, and saves ~10× faster.
        # ffmpeg reads the JPEG sequence with `-i f%05d.jpg`.
        frame_img.save(FRAMES_DIR / f"f{i:05d}.jpg",
                       format="JPEG", quality=92, optimize=False, progressive=False)
        if i % 60 == 0 and i > 0:
            elapsed = time.time() - t0
            fps_rate = i / elapsed
            eta = (total_frames - i) / fps_rate
            print(f"  frame {i}/{total_frames} · {fps_rate:.1f} fps · ETA {eta:.0f}s")

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
