"""
GT-SYL-COMMERCIAL-MASTER — Long-form spotlight (Pillow-accelerated)
─────────────────────────────────────────────────────────
~33s source @ 120 BPM · 1080x1920 · 60fps · slowed 1.32x at mux → ~43.5s

The COMMERCIAL side of MODCON SYL Residences.

RERA-SAFE — NO PRICES, NO RENTAL RETURNS, NO PROMISES.
Per master brief C2 (no invented numbers) and C4 (no pricing in feed),
and per operator note: pre-RERA, awaiting permission. The video shows
only verifiable physical/spatial facts plus location context.

NARRATIVE:
  1. HOOK         "before the highway gets busy"
  2. REVEAL       "MODCON SYL · COMMERCIAL"  (200ft frontage · 1.2 acres)
  3. LOCATION     animated location diagram (airport · ORR · Fourth City)
  4. NUMBERS      1.2 ACRES · G+4 · 530 SFT UNITS · 200 FT ROAD (verifiable)
  5. THE SPACE    biophilic · plug-and-play · ready-to-fit-out
  6. NEIGHBORHOOD surrounded by premium villa belt
  7. WHY NOW      pre-RERA · ahead of public launch (no return claims)
  8. PHILOSOPHY   "the address before the address arrives."
  9. CTA          COMMENT 'COMMERCIAL' — we DM the early access brief

provenance:
  - Operator-provided spec sheet (200 ft Srisailam Hwy, 1.2 ac, G+4, 530 SFT)
  - thegreenteam.in MODCON SYL Residences listing
  - Public maps (Tukkuguda · ORR Exit-14 · International Airport ~10 min)
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
    Beat, beat_grid, clamp, clean_oval, ease_in_out_cubic, ease_out_back,
    ease_out_cubic, embed_logo, escape, fit_to_width, hand_arrow,
    hand_circle, kicker, serif_pullquote, shake_offset, svg_text,
)

LOGO = ROOT.parent / "logo" / "the-green-team-monogram.svg"
GAL = REPO / "public" / "gallery" / "syl"

PHOTO_LOBBY      = GAL / "1776279315359.webp"   # lobby with palms, columns
PHOTO_PLAZA      = GAL / "1776279320251.webp"   # biophilic interior plaza
PHOTO_WORKSPACE_A= GAL / "1776279329483.webp"   # commercial workspace with monitors
PHOTO_WORKSPACE_B= GAL / "1776279343905.webp"   # open-plan workspace with desks

SECTIONS = {
    # name           : (start_s, end_s, backdrop)   backdrop = Path(photo) | "#hex" | None(cream)
    "HOOK":         (0.0,  3.5,  PHOTO_LOBBY),
    "REVEAL":       (3.5,  7.5,  PHOTO_PLAZA),
    "LOCATION":     (7.5, 11.0,  GT_OLIVE_900),  # solid olive for diagram
    "NUMBERS":      (11.0, 16.0, PHOTO_WORKSPACE_B),
    "THE_SPACE":    (16.0, 19.5, PHOTO_WORKSPACE_A),
    "NEIGHBORHOOD": (19.5, 23.0, PHOTO_PLAZA),
    "WHY_NOW":      (23.0, 26.5, PHOTO_LOBBY),
    "PHILOSOPHY":   (26.5, 29.0, PHOTO_WORKSPACE_B),
    "CTA":          (29.0, 33.0, None),
}
SOURCE_LENGTH = 33.0
SLOW = 1.32
IMPACT_BEATS = [0, 7, 15, 22, 32, 39, 46, 53, 58]

OUT_ROOT = REPO / "out"
FRAMES_DIR = OUT_ROOT / "frames_gt-syl-commercial-master"
SILENT_MP4 = OUT_ROOT / "brandmint-gt-syl-commercial-master-silent.mp4"

MAX_ZOOM = 1.20


# ─── Photo + gradient caches (identical pattern to agartha master) ──────
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
    r = int(hex_color[1:3], 16)
    g = int(hex_color[3:5], 16)
    b = int(hex_color[5:7], 16)
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


# ─── Location diagram for the LOCATION section ─────────────────────────
def location_diagram_svg(t_local: float, dur: float) -> str:
    """A schematic showing Tukkuguda at the center with key landmarks
    fading in on lines radiating outward. Sage on dark olive."""
    parts: list[str] = []
    cy = 950

    # Title above the diagram
    parts.append(serif_pullquote("on the corridor",
                                 CX, 560, size=40, color=GT_GOLD_LIGHT))
    parts.append(kicker("TUKKUGUDA · 200 FT SRISAILAM HIGHWAY",
                        y=620, color=GT_CREAM))

    # The horizontal "highway" line
    line_y = cy
    line_left = 120
    line_right = W - 120
    parts.append(
        f'<line x1="{line_left}" y1="{line_y}" x2="{line_right}" y2="{line_y}" '
        f'stroke="{GT_SAGE}" stroke-width="6" stroke-linecap="round"/>'
    )

    # Side landmarks (ORR Exit-14 left, Airport right) on the line, labels ABOVE
    side_landmarks = [
        (0.4,  220, "ORR EXIT-14",   "ADJACENT"),
        (0.8,  860, "INT'L AIRPORT", "10 MIN"),
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

    # Center marker — TUKKUGUDA. Drawn last so the gold dot sits on top of the
    # sage line. Big label and project sub-label placed BELOW the line so they
    # don't collide with the side landmarks above.
    parts.append(
        f'<circle cx="{CX}" cy="{line_y}" r="34" fill="{GT_GOLD_LIGHT}" '
        f'stroke="{GT_OLIVE_900}" stroke-width="6"/>'
    )
    if t_local > 1.2:
        a = clamp((t_local - 1.2) / 0.35)
        parts.append(
            f'<g opacity="{a:.3f}">'
            f'{svg_text("TUKKUGUDA",       CX, line_y + 80,  44, fill=GT_GOLD_LIGHT, font=FONT_DISPLAY, letter_spacing=-1)}'
            f'{svg_text("200 FT FRONTAGE", CX, line_y + 118, 24, fill=GT_CREAM,      font=FONT_MONO,    letter_spacing=6)}'
            f'</g>'
        )

    # Subline anchored at the bottom of the safe area
    if t_local > 1.6:
        a = clamp((t_local - 1.6) / 0.4)
        corridor = svg_text("HYDERABAD'S 4TH-CITY GROWTH CORRIDOR",
                            CX, 1280, 30, fill=GT_GOLD_LIGHT,
                            font=FONT_MONO, letter_spacing=5)
        sub = svg_text("(PRE-PUBLIC LAUNCH)",
                       CX, 1330, 22, fill=GT_SAGE,
                       font=FONT_MONO, letter_spacing=6)
        parts.append(f'<g opacity="{a:.3f}">{corridor}{sub}</g>')

    return "".join(parts)


# ─── Per-section text bodies ────────────────────────────────────────────
def text_for_section(name: str, t_local: float, dur: float) -> str:
    parts: list[str] = []

    if name == "HOOK":
        parts.append(serif_pullquote("the green team — commercial",
                                     CX, SAFE_TOP + 50, size=32, color=GT_SAGE))
        parts.append(svg_text("BEFORE", CX, 540, 78,
                              fill=GT_CREAM, font=FONT_DISPLAY))
        chip_y = 760
        sc = ease_out_back(clamp(t_local / 0.4))
        parts.append(
            f'<g transform="translate({CX},{chip_y}) rotate(-3.5) scale({sc:.3f}) translate({-CX},{-chip_y})">'
            f'<rect x="{CX-440}" y="{chip_y-120}" width="880" height="240" '
            f'rx="20" fill="{GT_SAGE}" stroke="{GT_OLIVE_900}" stroke-width="6"/>'
            f'{svg_text("THE HIGHWAY", CX, chip_y-20, 76, fill=GT_OLIVE_900, font=FONT_DISPLAY, letter_spacing=-2)}'
            f'{svg_text("GETS BUSY.", CX, chip_y+60, 76, fill=GT_OLIVE_900, font=FONT_DISPLAY, letter_spacing=-2)}'
            f'</g>'
        )
        parts.append(svg_text("TUKKUGUDA · SRISAILAM HIGHWAY", CX, 1110, 30,
                              fill=GT_GOLD_LIGHT, font=FONT_MONO, letter_spacing=8))
        parts.append(svg_text("200 FT MAIN ROAD FRONTAGE", CX, 1160, 26,
                              fill=GT_CREAM, font=FONT_MONO, letter_spacing=6))
        # Arrow removed — was crossing through "200 FT MAIN ROAD FRONTAGE" text.
        # The chip + subtext below carry the message cleanly without it.

    elif name == "REVEAL":
        parts.append(serif_pullquote("introducing",
                                     CX, 540, size=44, color=GT_GOLD_LIGHT))
        sc = ease_out_back(clamp(t_local / 0.5))
        parts.append(
            f'<g transform="translate({CX},900) scale({sc:.3f}) translate({-CX},{-900})">'
            f'{svg_text("MODCON SYL", CX, 790, 110, fill=GT_CREAM, font=FONT_DISPLAY, stroke=GT_OLIVE_900, stroke_w=5)}'
            f'{svg_text("COMMERCIAL", CX, 960, 130, fill=GT_SAGE, font=FONT_DISPLAY, stroke=GT_OLIVE_900, stroke_w=5, letter_spacing=-2)}'
            f'</g>'
        )
        if t_local > 1.0:
            a = clamp((t_local - 1.0) / 0.4)
            # SCRIBBLE hand-drawn oval around COMMERCIAL.
            # Text measured: top=861, bot=964, width=860 (at 130pt + 5px stroke).
            # 30px margin + 12px wobble safety →
            #   center y = (819 + 1006)/2 = 912
            #   ry = 100 (covers 802..1022 worst case with wobble ±10)
            #   rx = 860/2 + 55 = 485
            parts.append(f'<g opacity="{a:.3f}">'
                        f'{hand_circle(CX, 912, 490, 100, stroke_w=10, seed=44, color=GT_GOLD_LIGHT)}'
                        f'</g>')
        # Tagline at y=1100 — 80px below oval worst-case bottom (1022)
        if t_local > 1.5:
            a = clamp((t_local - 1.5) / 0.4)
            parts.append(f'<g opacity="{a:.3f}">'
                        f'{serif_pullquote("premium high-street, quietly placed.", CX, 1110, size=36, color=GT_GOLD_LIGHT)}'
                        f'</g>')
        if t_local > 2.0:
            a = clamp((t_local - 2.0) / 0.4)
            parts.append(
                f'<g opacity="{a:.3f}">'
                f'{svg_text("200 FT FRONTAGE · 1.2 ACRES · G+4", CX, 1215, 32, fill=GT_CREAM, font=FONT_MONO, letter_spacing=6)}'
                f'</g>'
            )

    elif name == "LOCATION":
        parts.append(location_diagram_svg(t_local, dur))

    elif name == "NUMBERS":
        parts.append(kicker("THE VERIFIABLE FACTS", y=SAFE_TOP + 60, color=GT_CREAM))
        parts.append(serif_pullquote("the asset, in numbers.",
                                     CX, SAFE_TOP + 140, size=34, color=GT_SAGE))
        chips = [
            (0.0,  "1.2 ACRES",        GT_SAGE,       GT_OLIVE_900, 600,  -4),
            (0.4,  "G + 4 FLOORS",     GT_GOLD_LIGHT, GT_OLIVE_900, 830,   3),
            (0.85, "530 SFT UNITS",    GT_CREAM,      GT_OLIVE_900, 1060, -3),
            (1.3,  "200 FT FRONTAGE",  GT_SAGE,       GT_OLIVE_900, 1290,  2),
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

    elif name == "THE_SPACE":
        parts.append(serif_pullquote("biophilic. plug-and-play. ready.",
                                     CX, 720, size=44, color=GT_CREAM))
        if t_local > 0.5:
            a = clamp((t_local - 0.5) / 0.35)
            parts.append(
                f'<g opacity="{a:.3f}">'
                f'{svg_text("READY-TO-FIT-OUT SHELLS", CX, 900, 50, fill=GT_GOLD_LIGHT, font=FONT_DISPLAY, stroke=GT_OLIVE_900, stroke_w=3)}'
                f'{svg_text("BIOPHILIC PUBLIC AREAS", CX, 970, 44, fill=GT_CREAM, font=FONT_DISPLAY)}'
                f'{svg_text("PEDESTRIAN-FIRST FACADE · 200 FT VISIBILITY", CX, 1040, 28, fill=GT_SAGE, font=FONT_MONO, letter_spacing=5)}'
                f'</g>'
            )

    elif name == "NEIGHBORHOOD":
        parts.append(serif_pullquote("surrounded by demand.",
                                     CX, 580, size=42, color=GT_GOLD_LIGHT))
        items = [
            (0.0,  "PREMIUM VILLA BELT"),
            (0.25, "MODCON SYL RESIDENCES"),
            (0.5,  "10 MIN → INTL. AIRPORT"),
            (0.75, "ORR EXIT-14"),
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

    elif name == "WHY_NOW":
        # Non-legal access framing — replaces the PRE-RERA board.
        # NO legal terminology, NO promises, NO returns — just access framing.
        parts.append(serif_pullquote("for early enquiries:",
                                     CX, 540, size=42, color=GT_GOLD_LIGHT))
        chip_y = 820
        sc = ease_out_back(clamp(t_local / 0.4))
        parts.append(
            f'<g transform="translate({CX},{chip_y}) rotate(-2) scale({sc:.3f}) translate({-CX},{-chip_y})">'
            f'<rect x="{CX-440}" y="{chip_y-150}" width="880" height="300" '
            f'rx="22" fill="{GT_SAGE}" stroke="{GT_OLIVE_900}" stroke-width="6"/>'
            f'{svg_text("FIRST PICK", CX, chip_y+30, 140, fill=GT_OLIVE_900, font=FONT_DISPLAY, letter_spacing=-4)}'
            f'{svg_text("AHEAD OF THE WAITLIST", CX, chip_y+100, 28, fill=GT_OLIVE_900, font=FONT_MONO, letter_spacing=6)}'
            f'</g>'
        )
        if t_local > 0.8:
            a = clamp((t_local - 0.8) / 0.4)
            inv = svg_text("BY INVITATION. RESERVED FOR INSIDERS.",
                          CX, 1240, 26, fill=GT_CREAM,
                          font=FONT_MONO, letter_spacing=4)
            parts.append(f'<g opacity="{a:.3f}">{inv}</g>')

    elif name == "PHILOSOPHY":
        if t_local > 0.2:
            a = clamp((t_local - 0.2) / 0.5)
            parts.append(
                f'<g opacity="{a:.3f}">'
                f'{serif_pullquote("the address before", CX, 900, size=70, color=GT_CREAM)}'
                f'{serif_pullquote("the address arrives.", CX, 990, size=70, color=GT_GOLD_LIGHT)}'
                f'</g>'
            )

    elif name == "CTA":
        parts.append(serif_pullquote("for the early access brief:",
                                     CX, 460, size=40, color=GT_OLIVE_800))
        parts.append(kicker("COMMENT THE KEYWORD", y=540, color=GT_OLIVE_700))
        chip_y = 760
        pulse = 1.0 + 0.03 * (1 if int(t_local * 4) % 2 == 0 else -1)
        parts.append(
            f'<g transform="translate({CX},{chip_y}) rotate(-2) scale({pulse:.3f}) translate({-CX},{-chip_y})">'
            f'<rect x="{CX-440}" y="{chip_y-110}" width="880" height="220" '
            f'rx="22" fill="{GT_OLIVE_800}" stroke="{GT_OLIVE_900}" stroke-width="6"/>'
            f'{svg_text("‘COMMERCIAL’", CX, chip_y+45, 110, fill=GT_GOLD_LIGHT, font=FONT_DISPLAY, letter_spacing=-2)}'
            f'</g>'
        )
        parts.append(svg_text("WE DM THE EARLY", CX, 1000, 64,
                              fill=GT_OLIVE_800, font=FONT_DISPLAY, letter_spacing=-2))
        parts.append(svg_text("ACCESS BRIEF.", CX, 1078, 70,
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
            pan_y=-50 if name in ("PHILOSOPHY", "WHY_NOW") else -40,
            gradient_top=0.50 if name in ("REVEAL", "PHILOSOPHY", "WHY_NOW") else 0.40,
            gradient_bottom=0.92 if name in ("HOOK", "REVEAL", "WHY_NOW") else 0.85,
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
    print(f"[render] gt-syl-commercial-master — {total} frames @ {FPS}fps "
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
