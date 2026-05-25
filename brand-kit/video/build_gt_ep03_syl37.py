"""
GT-EP03 — "THE +37% NUMBER" · Pre-Investor Episode (v2 — real assets)
─────────────────────────────────────────────────────────
Spotlight · 120 BPM · 15.5s · 1080x1920 @ 60fps

Uses Green Team's design system + real SYL Residences photography.

CONTENT BRIEF:
  hook: "AGARTHA INVESTORS GAINED +37% IN 18 MONTHS."
  stakes: "PRE-INVESTOR PHASE = 20–30% BELOW EVENTUAL MARKET RATE."
  method: "SCOUT · VERIFY · GATE TO INSIDERS"
  spotlight: "MODCON SYL RESIDENCES"
  stats: ["₹4,499 /SFT", "4.5 ACRES", "10 MIN TO AIRPORT"]
  cta: "COMMENT 'SYL' — we DM the next-18-months pre-investor brief."

provenance:
  - thegreenteam.in site copy
  - SYL Residences listing (Tukkuguda ORR Exit-14, biophilic, ₹4,499/SFT)
  - +37% number sourced from site copy (flag in meta.txt)
"""
from __future__ import annotations

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
REPO = ROOT.parent.parent
sys.path.insert(0, str(ROOT))

from _lib import (  # noqa: E402
    CX, FONT_BODY, FONT_DISPLAY, FONT_MONO, FONT_SERIF,
    GT_CASHEW, GT_CHARCOAL, GT_CREAM, GT_GOLD, GT_GOLD_LIGHT,
    GT_OLIVE_700, GT_OLIVE_800, GT_OLIVE_900, GT_SAGE,
    GT_TERRACOTTA, GT_TERRACOTTA_LIGHT,
    H, SAFE_TEXT_W, SAFE_TOP, W,
    RenderSpec, clamp, ease_in_cubic, ease_out_back, ease_out_cubic,
    embed_image, embed_logo, escape, fit_to_width, gradient_overlay,
    hand_arrow, hand_circle, hero_layer, kicker, render_video,
    serif_pullquote, svg_text,
)

LOGO = ROOT.parent / "logo" / "the-green-team-monogram.svg"

PHOTO_HERO_FOREST = REPO / "public" / "hero-backdrop.jpg"
PHOTO_AGARTHA_AERIAL = REPO / "public" / "agartha-render.jpg"
PHOTO_AGARTHA_VILLA = REPO / "public" / "gallery" / "agartha" / "22.webp"
PHOTO_SYL_INTERIOR = REPO / "public" / "gallery" / "syl" / "1776279315359.webp"
PHOTO_SYL_WIDE = REPO / "public" / "gallery" / "syl" / "1776279320251.webp"

IMPACT_BEATS = [0, 4, 7, 10, 16, 17, 18, 21, 27]


def dark_photo_stage(photo, t_local, duration,
                     bottom_alpha=0.85, top_alpha=0.30, scale_to=1.14):
    return (
        hero_layer(photo, t_local, duration, scale_from=1.02, scale_to=scale_to, pan_y=-40)
        + gradient_overlay([
            (0.0, GT_OLIVE_900, top_alpha),
            (0.5, GT_OLIVE_900, top_alpha + 0.1),
            (1.0, GT_OLIVE_900, bottom_alpha),
        ], grad_id=f"d{int(t_local*1000) % 9999}")
    )


def cream_stage():
    return f'<rect x="0" y="0" width="{W}" height="{H}" fill="{GT_CREAM}"/>'


def frame(t_norm, t):
    parts = []

    # ─────────────────────────────────────────────────────────────────────
    # HOOK (0.0s - 2.0s) — Agartha aerial backdrop + the +37% chip
    # ─────────────────────────────────────────────────────────────────────
    if t < 2.0:
        parts.append(dark_photo_stage(PHOTO_AGARTHA_AERIAL, t_local=t, duration=2.0,
                                       bottom_alpha=0.93, top_alpha=0.55))

        parts.append(serif_pullquote("the green team — investor brief",
                                     CX, SAFE_TOP + 50, size=32, color=GT_SAGE))

        parts.append(svg_text("AGARTHA INVESTORS:", CX, 560, 54,
                              fill=GT_CREAM, font=FONT_DISPLAY))

        chip_y = 800
        sc = ease_out_back(clamp(t / 0.3))
        parts.append(
            f'<g transform="translate({CX},{chip_y}) rotate(-3.5) scale({sc:.3f}) translate({-CX},{-chip_y})">'
            f'<rect x="{CX-440}" y="{chip_y-170}" width="880" height="340" '
            f'rx="24" fill="{GT_SAGE}" stroke="{GT_OLIVE_900}" stroke-width="6"/>'
            f'{svg_text("+37%", CX, chip_y+90, 250, fill=GT_OLIVE_900, font=FONT_DISPLAY, letter_spacing=-8)}'
            f'</g>'
        )

        parts.append(svg_text("IN 18 MONTHS.", CX, 1180, 78,
                              fill=GT_GOLD_LIGHT, font=FONT_DISPLAY,
                              stroke=GT_OLIVE_900, stroke_w=4))

        if t > 0.5:
            a = clamp((t - 0.5) / 0.3)
            parts.append(
                f'<g opacity="{a:.3f}">'
                f'{hand_arrow(CX+540, 1040, CX+300, 820, stroke_w=11, seed=29, color=GT_TERRACOTTA_LIGHT)}'
                f'</g>'
            )
        if t > 1.0:
            a = clamp((t - 1.0) / 0.3)
            parts.append(
                f'<g opacity="{a:.3f}">'
                f'{hand_circle(CX, chip_y, 400, 140, stroke_w=10, seed=12, color=GT_TERRACOTTA_LIGHT)}'
                f'</g>'
            )

    # ─────────────────────────────────────────────────────────────────────
    # STAKES (2.0s - 3.5s) — cream + pre-investor rule
    # ─────────────────────────────────────────────────────────────────────
    elif t < 3.5:
        parts.append(cream_stage())

        parts.append(serif_pullquote("the pre-investor rule.",
                                     CX, 460, size=50, color=GT_OLIVE_800))
        parts.append(kicker("WHY EARLY ACCESS COMPOUNDS", y=540, color=GT_OLIVE_700))

        chip_y = 800
        sc = ease_out_back(clamp((t - 2.0) / 0.35))
        parts.append(
            f'<g transform="translate({CX},{chip_y}) rotate(-3) scale({sc:.3f}) translate({-CX},{-chip_y})">'
            f'<rect x="{CX-460}" y="{chip_y-150}" width="920" height="290" '
            f'rx="22" fill="{GT_OLIVE_800}" stroke="{GT_OLIVE_900}" stroke-width="6"/>'
            f'{svg_text("20 – 30%", CX, chip_y+10, 130, fill=GT_GOLD_LIGHT, font=FONT_DISPLAY, letter_spacing=-4)}'
            f'{svg_text("BELOW EVENTUAL MARKET RATE", CX, chip_y+90, 30, fill=GT_SAGE, font=FONT_MONO, letter_spacing=6)}'
            f'</g>'
        )

        if t > 2.6:
            a = clamp((t - 2.6) / 0.35)
            quote = serif_pullquote("when you buy before RERA.", CX, 1240,
                                    size=42, color=GT_OLIVE_700)
            parts.append(f'<g opacity="{a:.3f}">{quote}</g>')

    # ─────────────────────────────────────────────────────────────────────
    # METHOD (3.5s - 5.0s) — cream + SCOUT · VERIFY · GATE
    # ─────────────────────────────────────────────────────────────────────
    elif t < 5.0:
        parts.append(cream_stage())

        parts.append(serif_pullquote("our process.",
                                     CX, 540, size=52, color=GT_OLIVE_800))

        steps = [
            (3.6, "SCOUT",            GT_OLIVE_800, 740),
            (4.0, "VERIFY",           GT_TERRACOTTA, 920),
            (4.4, "GATE TO INSIDERS", GT_OLIVE_800, 1100),
        ]
        for start_t, text, col, y in steps:
            if t < start_t:
                continue
            a = clamp((t - start_t) / 0.25)
            sc = ease_out_back(clamp((t - start_t) / 0.3))
            size = 90 if y < 1050 else 72
            parts.append(
                f'<g opacity="{a:.3f}" transform="translate({CX},{y}) scale({sc:.3f}) translate({-CX},{-y})">'
                f'{svg_text(text, CX, y, size, fill=col, font=FONT_DISPLAY, letter_spacing=-2)}'
                f'</g>'
            )

    # ─────────────────────────────────────────────────────────────────────
    # THE NEXT (5.0s - 8.0s) — SYL interior + project introduction
    # ─────────────────────────────────────────────────────────────────────
    elif t < 8.0:
        t_local = t - 5.0
        parts.append(dark_photo_stage(PHOTO_SYL_WIDE, t_local=t_local, duration=3.0,
                                       bottom_alpha=0.93, top_alpha=0.55))

        parts.append(serif_pullquote("the next opportunity:",
                                     CX, 560, size=44, color=GT_GOLD_LIGHT))

        sc = ease_out_back(clamp(t_local / 0.4))
        parts.append(
            f'<g transform="translate({CX},900) scale({sc:.3f}) translate({-CX},{-900})">'
            f'{svg_text("MODCON SYL", CX, 820, 110, fill=GT_CREAM, font=FONT_DISPLAY, stroke=GT_OLIVE_900, stroke_w=5)}'
            f'{svg_text("RESIDENCES", CX, 990, 130, fill=GT_SAGE, font=FONT_DISPLAY, stroke=GT_OLIVE_900, stroke_w=5, letter_spacing=-2)}'
            f'</g>'
        )

        if t > 6.4:
            a = clamp((t - 6.4) / 0.4)
            parts.append(
                f'<g opacity="{a:.3f}">'
                f'{svg_text("TUKKUGUDA · ORR EXIT-14", CX, 1170, 38, fill=GT_CREAM, font=FONT_MONO, letter_spacing=8)}'
                f'{svg_text("4.5 ACRES BIOPHILIC", CX, 1226, 34, fill=GT_GOLD_LIGHT, font=FONT_MONO, letter_spacing=8)}'
                f'</g>'
            )

    # ─────────────────────────────────────────────────────────────────────
    # STATS (8.0s - 10.5s) — SYL interior backdrop + 3 numbers
    # ─────────────────────────────────────────────────────────────────────
    elif t < 10.5:
        t_local = t - 8.0
        parts.append(dark_photo_stage(PHOTO_SYL_INTERIOR, t_local=t_local, duration=2.5,
                                       bottom_alpha=0.88, top_alpha=0.55))

        parts.append(kicker("VERIFIED AT THE SITE", y=SAFE_TOP + 60, color=GT_CREAM))
        parts.append(serif_pullquote("the numbers that hold up.",
                                     CX, SAFE_TOP + 140, size=34, color=GT_SAGE))

        chips = [
            (8.0,  "₹4,499 / SFT",       GT_SAGE,       GT_OLIVE_900, 740,  -4),
            (8.4,  "4.5 ACRES",          GT_GOLD_LIGHT, GT_OLIVE_900, 1030,  3),
            (8.85, "10 MIN → AIRPORT",   GT_CREAM,      GT_OLIVE_900, 1320, -3),
        ]
        for start, label, fill, ink, y, rot in chips:
            if t < start:
                continue
            sc = ease_out_back(clamp((t - start) / 0.35))
            # Auto-fit large text labels
            pt = fit_to_width(label, 720, start_pt=100, floor_pt=60)
            parts.append(
                f'<g transform="translate({CX},{y}) rotate({rot}) scale({sc:.3f}) translate({-CX},{-y})">'
                f'<rect x="{CX-400}" y="{y-110}" width="800" height="220" '
                f'rx="20" fill="{fill}" stroke="{GT_OLIVE_900}" stroke-width="6"/>'
                f'{svg_text(label, CX, y+30, pt, fill=ink, font=FONT_DISPLAY, letter_spacing=-3)}'
                f'</g>'
            )

    # ─────────────────────────────────────────────────────────────────────
    # WINDOW (10.5s - 13.5s) — second SYL angle + pre-investor message
    # ─────────────────────────────────────────────────────────────────────
    elif t < 13.5:
        t_local = t - 10.5
        parts.append(dark_photo_stage(PHOTO_SYL_WIDE, t_local=t_local, duration=3.0,
                                       bottom_alpha=0.92, top_alpha=0.55, scale_to=1.18))

        parts.append(serif_pullquote("you're still in the window.",
                                     CX, 560, size=46, color=GT_GOLD_LIGHT))

        sc = ease_out_back(clamp(t_local / 0.5))
        parts.append(
            f'<g transform="translate({CX},900) scale({sc:.3f}) translate({-CX},{-900})">'
            f'{svg_text("PRE-INVESTOR", CX, 820, 110, fill=GT_CREAM, font=FONT_DISPLAY, stroke=GT_OLIVE_900, stroke_w=5)}'
            f'{svg_text("PHASE  ·  LIVE NOW", CX, 970, 80, fill=GT_SAGE, font=FONT_DISPLAY, stroke=GT_OLIVE_900, stroke_w=4, letter_spacing=-1)}'
            f'</g>'
        )

        if t > 11.4:
            a = clamp((t - 11.4) / 0.4)
            parts.append(
                f'<g opacity="{a:.3f}">'
                f'{hand_circle(CX, 970, 480, 90, stroke_w=10, seed=66, color=GT_GOLD_LIGHT)}'
                f'</g>'
            )

        if t > 11.8:
            a = clamp((t - 11.8) / 0.4)
            parts.append(
                f'<g opacity="{a:.3f}">'
                f'{svg_text("RESERVED FOR NEWSLETTER MEMBERS", CX, 1180, 30, fill=GT_CREAM, font=FONT_MONO, letter_spacing=6)}'
                f'</g>'
            )

    # ─────────────────────────────────────────────────────────────────────
    # CTA (13.5s - 15.5s) — cream paper, keyword 'SYL'
    # ─────────────────────────────────────────────────────────────────────
    else:
        parts.append(cream_stage())

        parts.append(serif_pullquote("ask us for the brief.",
                                     CX, 460, size=44, color=GT_OLIVE_800))
        parts.append(kicker("COMMENT THE KEYWORD", y=540, color=GT_OLIVE_700))

        chip_y = 760
        pulse = 1.0 + 0.03 * (1 if int((t - 13.5) * 4) % 2 == 0 else -1)
        parts.append(
            f'<g transform="translate({CX},{chip_y}) rotate(-2) scale({pulse:.3f}) translate({-CX},{-chip_y})">'
            f'<rect x="{CX-300}" y="{chip_y-110}" width="600" height="220" '
            f'rx="22" fill="{GT_OLIVE_800}" stroke="{GT_OLIVE_900}" stroke-width="6"/>'
            f'{svg_text("‘SYL’", CX, chip_y+45, 160, fill=GT_GOLD_LIGHT, font=FONT_DISPLAY, letter_spacing=-2)}'
            f'</g>'
        )

        parts.append(svg_text("WE DM THE NEXT", CX, 1010, 42,
                              fill=GT_OLIVE_800, font=FONT_DISPLAY))
        parts.append(svg_text("18-MONTHS BRIEF.", CX, 1064, 42,
                              fill=GT_OLIVE_800, font=FONT_DISPLAY))

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


def main(bpm=120, length_s=15.5):
    spec = RenderSpec(slug="gt-ep03-syl37", bpm=bpm, length_s=length_s,
                      out_root=REPO / "out")
    spec.out_root.mkdir(parents=True, exist_ok=True)
    render_video(spec, frame, impact_beats=IMPACT_BEATS)


if __name__ == "__main__":
    import argparse
    p = argparse.ArgumentParser()
    p.add_argument("--bpm", type=int, default=120)
    p.add_argument("--length", type=float, default=15.5)
    args = p.parse_args()
    main(bpm=args.bpm, length_s=args.length)
