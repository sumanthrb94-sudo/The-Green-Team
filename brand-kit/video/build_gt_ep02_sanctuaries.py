"""
GT-EP02 — "RANK THE 3" · The Countdown Episode (v2 — real assets)
─────────────────────────────────────────────────────────
Countdown · 120 BPM · 16.0s · 1080x1920 @ 60fps

Uses Green Team's design system + real product photography:
  Agartha aerial + villa, SYL biophilic interior, Dates County temple/forest.

CONTENT BRIEF:
  hook: "WE CURATED 3 SANCTUARIES NEAR HYDERABAD."
  stakes: "ONLY 1 HAS THE OUTLOOK ECO AWARD."
  method: "BY AQI · BY ACCESS · BY DEVELOPER PROOF"
  list:
    - {rank: 3, name: "DATES COUNTY",  sub: "KANDUKUR · 300 ACRES · 4,000-AC FOREST"}
    - {rank: 2, name: "MODCON SYL",     sub: "TUKKUGUDA · 4.5 ACRES BIOPHILIC"}
  winner: "MODCON AGARTHA  ·  OUTLOOK ECO AWARD 2024"
  cta: "COMMENT 'SANCTUARY' — we DM the full 3-way comparison doc."

provenance:
  - thegreenteam.in site copy
  - RERA Telangana P02400002648 / P02400003813 (Dates County)
  - Outlook Business 2024 Eco Award (Agartha, public record)
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
PHOTO_AGARTHA_HOUSE = REPO / "public" / "gallery" / "agartha" / "11.webp"
PHOTO_DATES_TEMPLE = REPO / "public" / "gallery" / "dates-county" / "temple.jpg"
PHOTO_DATES_FOREST = REPO / "public" / "gallery" / "dates-county" / "forest.jpg"
PHOTO_SYL_INTERIOR = REPO / "public" / "gallery" / "syl" / "1776279315359.webp"
PHOTO_SYL_WIDE = REPO / "public" / "gallery" / "syl" / "1776279320251.webp"

IMPACT_BEATS = [0, 4, 7, 10, 14, 18, 19, 20, 24, 28]


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


def photo_rank_card(photo, rank, name, sub, x, y, w, h, scale=1.0, rotate=-2.0):
    """Real-photo countdown card. Full-bleed photo + olive bottom band with rank/name/sub."""
    cid = f"rc{rank}{int(scale*1000)}"
    band_h = 160
    return (
        f'<g transform="translate({x + w/2},{y + h/2}) rotate({rotate}) '
        f'scale({scale:.3f}) translate({-(x + w/2)},{-(y + h/2)})">'
        f'<defs><clipPath id="{cid}"><rect x="{x}" y="{y}" width="{w}" height="{h}" rx="22"/></clipPath></defs>'
        f'<g clip-path="url(#{cid})">'
        f'{embed_image(photo, x, y, w, h)}'
        # Dark gradient at the bottom of the photo so band text always reads
        f'<rect x="{x}" y="{y + h - band_h - 60}" width="{w}" height="{band_h + 60}" fill="{GT_OLIVE_900}" opacity="0.0"/>'
        # The footer band itself
        f'<rect x="{x}" y="{y + h - band_h}" width="{w}" height="{band_h}" fill="{GT_OLIVE_800}"/>'
        f'</g>'
        # Outer stroke
        f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="22" fill="none" '
        f'stroke="{GT_OLIVE_900}" stroke-width="5"/>'
        # Big rank number on top-left over the photo
        f'<rect x="{x + 24}" y="{y + 24}" width="170" height="100" rx="14" '
        f'fill="{GT_SAGE}" stroke="{GT_OLIVE_900}" stroke-width="4"/>'
        f'{svg_text(f"#{rank}", x + 24 + 85, y + 24 + 76, 80, fill=GT_OLIVE_900, font=FONT_DISPLAY, letter_spacing=-3)}'
        # Name + sub in the footer band
        f'{svg_text(name, x + w/2, y + h - band_h + 70, 64, fill=GT_CREAM, font=FONT_DISPLAY, letter_spacing=-2)}'
        f'{svg_text(sub, x + w/2, y + h - band_h + 130, 24, fill=GT_SAGE, font=FONT_MONO, letter_spacing=4)}'
        f'</g>'
    )


def frame(t_norm, t):
    parts = []

    # ─────────────────────────────────────────────────────────────────────
    # HOOK (0.0s - 2.0s) — forest backdrop + claim
    # ─────────────────────────────────────────────────────────────────────
    if t < 2.0:
        parts.append(dark_photo_stage(PHOTO_HERO_FOREST, t_local=t, duration=2.0,
                                       bottom_alpha=0.92, top_alpha=0.55))

        parts.append(serif_pullquote("the green team — editorial real estate",
                                     CX, SAFE_TOP + 50, size=32, color=GT_SAGE))

        parts.append(svg_text("WE CURATED", CX, 540, 80,
                              fill=GT_CREAM, font=FONT_DISPLAY))

        chip_y = 760
        sc = ease_out_back(clamp(t / 0.3))
        parts.append(
            f'<g transform="translate({CX},{chip_y}) rotate(-4) scale({sc:.3f}) translate({-CX},{-chip_y})">'
            f'<rect x="{CX-180}" y="{chip_y-160}" width="360" height="290" '
            f'rx="20" fill="{GT_SAGE}" stroke="{GT_OLIVE_900}" stroke-width="6"/>'
            f'{svg_text("3", CX, chip_y+90, 240, fill=GT_OLIVE_900, font=FONT_DISPLAY, letter_spacing=-6)}'
            f'</g>'
        )

        parts.append(svg_text("SANCTUARIES NEAR", CX, 1100, 68,
                              fill=GT_CREAM, font=FONT_DISPLAY))
        parts.append(svg_text("HYDERABAD.", CX, 1190, 80,
                              fill=GT_GOLD_LIGHT, font=FONT_DISPLAY,
                              stroke=GT_OLIVE_900, stroke_w=3))

        if t > 0.6:
            a = clamp((t - 0.6) / 0.3)
            parts.append(
                f'<g opacity="{a:.3f}">'
                f'{hand_arrow(CX-460, 860, CX-260, 720, stroke_w=11, seed=33, color=GT_TERRACOTTA_LIGHT)}'
                f'</g>'
            )
        if t > 1.0:
            a = clamp((t - 1.0) / 0.3)
            parts.append(
                f'<g opacity="{a:.3f}">'
                f'{hand_circle(CX, chip_y-20, 210, 175, stroke_w=10, seed=5, color=GT_TERRACOTTA_LIGHT)}'
                f'</g>'
            )

    # ─────────────────────────────────────────────────────────────────────
    # STAKES (2.0s - 3.5s) — Agartha aerial + "only 1 has the award"
    # ─────────────────────────────────────────────────────────────────────
    elif t < 3.5:
        t_local = t - 2.0
        parts.append(dark_photo_stage(PHOTO_AGARTHA_AERIAL, t_local=t_local,
                                       duration=1.5, bottom_alpha=0.92, top_alpha=0.45))

        parts.append(serif_pullquote("but here's the math:", CX, 560, size=40, color=GT_SAGE))
        parts.append(svg_text("ONLY ONE", CX, 700, 84, fill=GT_CREAM, font=FONT_DISPLAY))

        chip_y = 920
        sc = ease_out_back(clamp(t_local / 0.35))
        parts.append(
            f'<g transform="translate({CX},{chip_y}) rotate(-3) scale({sc:.3f}) translate({-CX},{-chip_y})">'
            f'<rect x="{CX-420}" y="{chip_y-130}" width="840" height="240" '
            f'rx="22" fill="{GT_OLIVE_800}" stroke="{GT_OLIVE_900}" stroke-width="6"/>'
            f'{svg_text("HOLDS THE OUTLOOK", CX, chip_y-30, 38, fill=GT_SAGE, font=FONT_MONO, letter_spacing=6)}'
            f'{svg_text("ECO AWARD 2024", CX, chip_y+70, 78, fill=GT_GOLD_LIGHT, font=FONT_DISPLAY, letter_spacing=-2)}'
            f'</g>'
        )

    # ─────────────────────────────────────────────────────────────────────
    # METHOD (3.5s - 5.0s) — cream paper + rank criteria
    # ─────────────────────────────────────────────────────────────────────
    elif t < 5.0:
        parts.append(cream_stage())

        parts.append(serif_pullquote("how we rank.", CX, 460, size=52, color=GT_OLIVE_800))
        parts.append(kicker("PUBLIC RECORD ONLY · NO INFLATION", y=540, color=GT_OLIVE_700))

        items = [
            (3.6, "BY AQI",             GT_OLIVE_800, 760),
            (4.0, "BY ACCESS",          GT_TERRACOTTA, 920),
            (4.4, "BY DEVELOPER PROOF", GT_OLIVE_800, 1080),
        ]
        for start_t, text, col, y in items:
            if t < start_t:
                continue
            a = clamp((t - start_t) / 0.25)
            sc = ease_out_back(clamp((t - start_t) / 0.3))
            parts.append(
                f'<g opacity="{a:.3f}" transform="translate({CX},{y}) scale({sc:.3f}) translate({-CX},{-y})">'
                f'{svg_text(text, CX, y, 88 if y < 1000 else 70, fill=col, font=FONT_DISPLAY, letter_spacing=-2)}'
                f'</g>'
            )

    # ─────────────────────────────────────────────────────────────────────
    # RANK 3 — DATES COUNTY (5.0s - 7.0s) — real temple photo card
    # ─────────────────────────────────────────────────────────────────────
    elif t < 7.0:
        parts.append(cream_stage())
        parts.append(serif_pullquote("the slate", CX, 320, size=36, color=GT_OLIVE_700))

        slam = clamp((t - 5.0) / 0.4)
        sc = ease_out_back(slam)
        slide = clamp((t - 6.6) / 0.4) * -1400
        parts.append(
            f'<g transform="translate(0,{slide:.1f})">'
            f'{photo_rank_card(PHOTO_DATES_TEMPLE, rank=3, name="DATES COUNTY", sub="KANDUKUR · 300 ACRES · 4,000-AC FOREST", x=80, y=420, w=920, h=900, scale=sc, rotate=-2)}'
            f'</g>'
        )
        if t > 5.6 and t < 6.5:
            a = clamp((t - 5.6) / 0.3)
            parts.append(
                f'<g opacity="{a:.3f}">'
                f'{svg_text("RERA P02400002648 + 003813", CX, 1430, 30, fill=GT_OLIVE_700, font=FONT_MONO, letter_spacing=4)}'
                f'</g>'
            )

    # ─────────────────────────────────────────────────────────────────────
    # RANK 2 — MODCON SYL (7.0s - 9.0s) — real biophilic interior card
    # ─────────────────────────────────────────────────────────────────────
    elif t < 9.0:
        parts.append(cream_stage())
        parts.append(serif_pullquote("the slate", CX, 320, size=36, color=GT_OLIVE_700))

        slam = clamp((t - 7.0) / 0.35)
        sc = ease_out_back(slam)
        slide = clamp((t - 8.6) / 0.4) * -1400
        parts.append(
            f'<g transform="translate(0,{slide:.1f})">'
            f'{photo_rank_card(PHOTO_SYL_INTERIOR, rank=2, name="MODCON SYL", sub="TUKKUGUDA · 4.5 ACRES BIOPHILIC", x=80, y=420, w=920, h=900, scale=sc, rotate=3)}'
            f'</g>'
        )
        if t > 7.6 and t < 8.5:
            a = clamp((t - 7.6) / 0.3)
            parts.append(
                f'<g opacity="{a:.3f}">'
                f'{svg_text("ORR EXIT-14 · ₹4,499/SFT · 10 MIN AIRPORT", CX, 1430, 26, fill=GT_OLIVE_700, font=FONT_MONO, letter_spacing=3)}'
                f'</g>'
            )

    # ─────────────────────────────────────────────────────────────────────
    # WINNER REVEAL (9.0s - 12.0s) — Agartha villa hero + name
    # ─────────────────────────────────────────────────────────────────────
    elif t < 12.0:
        t_local = t - 9.0
        parts.append(dark_photo_stage(PHOTO_AGARTHA_VILLA, t_local=t_local,
                                       duration=3.0, bottom_alpha=0.92, top_alpha=0.55))

        parts.append(serif_pullquote("the 1 that wins:", CX, 540, size=42, color=GT_GOLD_LIGHT))

        sc = ease_out_back(clamp(t_local / 0.5))
        parts.append(
            f'<g transform="translate({CX},900) scale({sc:.3f}) translate({-CX},{-900})">'
            f'{svg_text("MODCON", CX, 800, 110, fill=GT_CREAM, font=FONT_DISPLAY, stroke=GT_OLIVE_900, stroke_w=5)}'
            f'{svg_text("AGARTHA", CX, 970, 150, fill=GT_SAGE, font=FONT_DISPLAY, stroke=GT_OLIVE_900, stroke_w=6, letter_spacing=-2)}'
            f'</g>'
        )

        if t > 10.0:
            a = clamp((t - 10.0) / 0.4)
            parts.append(
                f'<g opacity="{a:.3f}">'
                f'{hand_circle(CX, 970, 470, 95, stroke_w=10, seed=51, color=GT_GOLD_LIGHT)}'
                f'</g>'
            )

        if t > 10.4:
            a = clamp((t - 10.4) / 0.4)
            parts.append(
                f'<g opacity="{a:.3f}">'
                f'{serif_pullquote("roots of earth", CX, 1140, size=40, color=GT_GOLD_LIGHT)}'
                f'{svg_text("OUTLOOK ECO AWARD 2024", CX, 1260, 32, fill=GT_CREAM, font=FONT_MONO, letter_spacing=6)}'
                f'{svg_text("NARSAPUR · 25 ACRES · 36 PLOTS", CX, 1316, 28, fill=GT_SAGE, font=FONT_MONO, letter_spacing=6)}'
                f'</g>'
            )

    # ─────────────────────────────────────────────────────────────────────
    # CTA (12.0s - 16.0s) — cream paper, keyword 'SANCTUARY'
    # ─────────────────────────────────────────────────────────────────────
    else:
        parts.append(cream_stage())

        parts.append(serif_pullquote("ask us for the comparison.",
                                     CX, 460, size=44, color=GT_OLIVE_800))
        parts.append(kicker("COMMENT THE KEYWORD", y=540, color=GT_OLIVE_700))

        chip_y = 760
        pulse = 1.0 + 0.03 * (1 if int((t - 12.0) * 4) % 2 == 0 else -1)
        parts.append(
            f'<g transform="translate({CX},{chip_y}) rotate(-2) scale({pulse:.3f}) translate({-CX},{-chip_y})">'
            f'<rect x="{CX-440}" y="{chip_y-110}" width="880" height="220" '
            f'rx="22" fill="{GT_OLIVE_800}" stroke="{GT_OLIVE_900}" stroke-width="6"/>'
            f'{svg_text("‘SANCTUARY’", CX, chip_y+45, 130, fill=GT_GOLD_LIGHT, font=FONT_DISPLAY, letter_spacing=-2)}'
            f'</g>'
        )

        parts.append(svg_text("WE DM THE FULL 3-WAY", CX, 1010, 42,
                              fill=GT_OLIVE_800, font=FONT_DISPLAY))
        parts.append(svg_text("COMPARISON DOC.", CX, 1064, 42,
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


def main(bpm=120, length_s=16.0):
    spec = RenderSpec(slug="gt-ep02-sanctuaries", bpm=bpm, length_s=length_s,
                      out_root=REPO / "out")
    spec.out_root.mkdir(parents=True, exist_ok=True)
    render_video(spec, frame, impact_beats=IMPACT_BEATS)


if __name__ == "__main__":
    import argparse
    p = argparse.ArgumentParser()
    p.add_argument("--bpm", type=int, default=120)
    p.add_argument("--length", type=float, default=16.0)
    args = p.parse_args()
    main(bpm=args.bpm, length_s=args.length)
