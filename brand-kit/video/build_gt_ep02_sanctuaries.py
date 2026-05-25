"""
GT-EP02 — "RANK THE 3" · The Countdown Episode
─────────────────────────────────────────────────────────
Countdown format · 120 BPM · 16.0s · 1080x1920 @ 60fps

CONTENT BRIEF:

episode:
  slug: "gt-ep02-sanctuaries"
  bpm: 120
  length_s: 16.0
  format: countdown

content:
  hook: "WE CURATED 3 SANCTUARIES NEAR HYDERABAD."
  stakes: "ONLY 1 HAS THE OUTLOOK ECO AWARD."
  method: "BY AQI · BY ACCESS · BY DEVELOPER PROOF"
  list:
    - {rank: 3, name: "DATES COUNTY", sub: "KANDUKUR · 300 ACRES · 4,000-ACRE FOREST"}
    - {rank: 2, name: "MODCON SYL", sub: "TUKKUGUDA · 4.5 ACRES BIOPHILIC"}
  winner:
    name: "MODCON AGARTHA"
    proof: "NARSAPUR · OUTLOOK 2024 · AQI 12"

cta:
  keyword: "SANCTUARY"
  deliverable: "full 3-way comparison doc"
  vertical: "FOREST REAL ESTATE"

provenance:
  sources:
    - "The Green Team site copy (thegreenteam.in)"
    - "RERA Telangana P02400002648, P02400003813 (Dates County)"
    - "Outlook Business 2024 Eco Award (Agartha)"
  notes: "All locations + acreage + RERA cross-checked against site copy."
"""
from __future__ import annotations

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
sys.path.insert(0, str(ROOT))

from _lib import (  # noqa: E402
    BEAST_BLACK, BEAST_GREEN, BEAST_RED, BEAST_WHITE, BEAST_YELLOW,
    CX, CY, FONT_DISPLAY, FONT_MONO, H, SAFE_TEXT_W, SAFE_TOP, W,
    RenderSpec, builder_card, clamp, ease_in_cubic, ease_out_back,
    ease_out_cubic, embed_logo, escape, fit_to_width, hand_arrow,
    hand_circle, kicker, render_video, stat_chip, svg_text,
)

# 16s @ 120 BPM = 32 beats. Card velocities accelerate toward winner.
#
#  beats 0-3   (0.0-2.0s)  HOOK     — "WE CURATED 3 SANCTUARIES NEAR HYDERABAD"
#  beats 4-6   (2.0-3.5s)  STAKES   — "ONLY 1 HAS THE OUTLOOK AWARD"
#  beats 7-9   (3.5-5.0s)  METHOD   — "BY AQI · BY ACCESS · BY DEVELOPER PROOF"
#  beats 10-13 (5.0-7.0s)  RANK 3   — DATES COUNTY card
#  beats 14-17 (7.0-9.0s)  RANK 2   — MODCON SYL card
#  beats 18-23 (9.0-12.0s) WINNER   — MODCON AGARTHA on green stage
#  beats 24-27 (12.0-14.0s) PROOF   — Agartha's stat triplet
#  beats 28-31 (14.0-16.0s) CTA     — keyword SANCTUARY

IMPACT_BEATS = [0, 4, 7, 10, 14, 18, 19, 20, 24, 28]
LOGO = ROOT.parent / "logo" / "the-green-team-monogram.svg"


def frame(t_norm: float, t: float) -> str:
    parts: list[str] = []

    # ── Persistent eyebrow ─────────────────────────────────────────────
    on_green_stage = 9.0 <= t < 14.0
    eyebrow_color = BEAST_YELLOW if on_green_stage else BEAST_BLACK
    eyebrow_alpha = clamp(t / 0.4)
    parts.append(
        f'<g opacity="{eyebrow_alpha:.3f}">'
        f'{kicker("THE GREEN TEAM · EDITORIAL REAL ESTATE", y=SAFE_TOP + 10, color=eyebrow_color)}'
        f'</g>'
    )

    # ─────────────────────────────────────────────────────────────────────
    # HOOK (0.0s - 2.0s)
    # ─────────────────────────────────────────────────────────────────────
    if t < 2.0:
        parts.append(svg_text("WE CURATED", CX, 460, 86,
                              fill=BEAST_BLACK, font=FONT_DISPLAY))

        # Yellow chip behind "3"
        chip_y = 700
        slam = clamp((t - 0.0) / 0.3)
        sc = ease_out_back(slam)
        parts.append(
            f'<g transform="translate({CX},{chip_y}) rotate(-4) scale({sc:.3f}) translate({-CX},{-chip_y})">'
            f'<rect x="{CX-180}" y="{chip_y-160}" width="360" height="280" '
            f'rx="28" fill="{BEAST_YELLOW}" stroke="{BEAST_BLACK}" stroke-width="10"/>'
            f'{svg_text("3", CX, chip_y+70, 220, fill=BEAST_BLACK, font=FONT_DISPLAY, letter_spacing=-4)}'
            f'</g>'
        )

        parts.append(svg_text("SANCTUARIES NEAR", CX, 1010, 72,
                              fill=BEAST_BLACK, font=FONT_DISPLAY))
        parts.append(svg_text("HYDERABAD.", CX, 1100, 86,
                              fill=BEAST_RED, font=FONT_DISPLAY,
                              stroke=BEAST_BLACK, stroke_w=4))

        if t > 0.6:
            arrow_alpha = clamp((t - 0.6) / 0.3)
            parts.append(
                f'<g opacity="{arrow_alpha:.3f}">'
                f'{hand_arrow(CX-450, 850, CX-250, 720, stroke_w=12, seed=33)}'
                f'</g>'
            )

        if t > 1.0:
            circle_alpha = clamp((t - 1.0) / 0.3)
            parts.append(
                f'<g opacity="{circle_alpha:.3f}">'
                f'{hand_circle(CX, chip_y-20, 200, 170, stroke_w=10, seed=5, color=BEAST_RED)}'
                f'</g>'
            )

    # ─────────────────────────────────────────────────────────────────────
    # STAKES (2.0s - 3.5s)
    # ─────────────────────────────────────────────────────────────────────
    elif t < 3.5:
        parts.append(svg_text("BUT ONLY", CX, 620, 70,
                              fill=BEAST_BLACK, font=FONT_DISPLAY))

        slam = clamp((t - 2.0) / 0.35)
        sc = ease_out_back(slam)
        chip_y = 880
        parts.append(
            f'<g transform="translate({CX},{chip_y}) rotate(-4) scale({sc:.3f}) translate({-CX},{-chip_y})">'
            f'<rect x="{CX-160}" y="{chip_y-150}" width="320" height="260" '
            f'rx="26" fill="{BEAST_GREEN}" stroke="{BEAST_BLACK}" stroke-width="10"/>'
            f'{svg_text("1", CX, chip_y+50, 200, fill=BEAST_WHITE, font=FONT_DISPLAY, letter_spacing=-4)}'
            f'</g>'
        )

        if t > 2.5:
            a = clamp((t - 2.5) / 0.35)
            parts.append(
                f'<g opacity="{a:.3f}">'
                f'{svg_text("HAS THE", CX, 1180, 56, fill=BEAST_BLACK, font=FONT_DISPLAY)}'
                f'{svg_text("OUTLOOK ECO AWARD.", CX, 1260, 60, fill=BEAST_GREEN, font=FONT_DISPLAY, stroke=BEAST_BLACK, stroke_w=4)}'
                f'</g>'
            )

    # ─────────────────────────────────────────────────────────────────────
    # METHOD (3.5s - 5.0s)
    # ─────────────────────────────────────────────────────────────────────
    elif t < 5.0:
        parts.append(svg_text("HOW WE RANK THEM:", CX, 700, 50,
                              fill=BEAST_BLACK, font=FONT_MONO, letter_spacing=8))

        items = [
            (3.6, "BY AQI",            BEAST_GREEN, 880),
            (4.0, "BY ACCESS",         BEAST_RED,   1020),
            (4.4, "BY DEVELOPER PROOF", BEAST_BLACK, 1160),
        ]
        for start_t, text, col, y in items:
            if t < start_t:
                continue
            a = clamp((t - start_t) / 0.25)
            parts.append(
                f'<g opacity="{a:.3f}">'
                f'{svg_text(text, CX, y, 70, fill=col, font=FONT_DISPLAY)}'
                f'</g>'
            )

    # ─────────────────────────────────────────────────────────────────────
    # RANK 3 — DATES COUNTY (5.0s - 7.0s)
    # ─────────────────────────────────────────────────────────────────────
    elif t < 7.0:
        u = (t - 5.0) / 2.0
        slam = clamp((t - 5.0) / 0.4)
        sc = ease_out_back(slam)
        # Slide off to top after 6.5s
        slide = clamp((t - 6.6) / 0.4) * -1200
        rot = -3
        parts.append(
            f'<g transform="translate(0,{slide:.1f})">'
            f'{builder_card(CX, 950, rank=3, name="DATES COUNTY", sub="KANDUKUR · 300 ACRES · 4,000-AC FOREST", scale=sc, rotate_deg=rot)}'
            f'</g>'
        )
        if t > 5.5 and t < 6.5:
            a = clamp((t - 5.5) / 0.3)
            parts.append(
                f'<g opacity="{a:.3f}">'
                f'{svg_text("RERA P02400002648 + 003813", CX, 1280, 32, fill=BEAST_BLACK, font=FONT_MONO, letter_spacing=4)}'
                f'</g>'
            )

    # ─────────────────────────────────────────────────────────────────────
    # RANK 2 — MODCON SYL (7.0s - 9.0s)
    # ─────────────────────────────────────────────────────────────────────
    elif t < 9.0:
        slam = clamp((t - 7.0) / 0.35)
        sc = ease_out_back(slam)
        slide = clamp((t - 8.5) / 0.4) * -1200
        rot = 3
        parts.append(
            f'<g transform="translate(0,{slide:.1f})">'
            f'{builder_card(CX, 950, rank=2, name="MODCON SYL", sub="TUKKUGUDA · 4.5 ACRES BIOPHILIC", scale=sc, rotate_deg=rot)}'
            f'</g>'
        )
        if t > 7.5 and t < 8.5:
            a = clamp((t - 7.5) / 0.3)
            parts.append(
                f'<g opacity="{a:.3f}">'
                f'{svg_text("ORR EXIT-14 · ₹4,499/SFT", CX, 1280, 32, fill=BEAST_BLACK, font=FONT_MONO, letter_spacing=4)}'
                f'</g>'
            )

    # ─────────────────────────────────────────────────────────────────────
    # WINNER (9.0s - 12.0s)
    # ─────────────────────────────────────────────────────────────────────
    elif t < 12.0:
        parts.insert(0, f'<rect x="0" y="0" width="{W}" height="{H}" fill="{BEAST_GREEN}"/>')

        parts.append(svg_text("#1 — THE WINNER", CX, 540, 50,
                              fill=BEAST_YELLOW, font=FONT_MONO, letter_spacing=12))

        slam = clamp((t - 9.0) / 0.5)
        sc = ease_out_back(slam)
        name_pt = fit_to_width("MODCON AGARTHA", SAFE_TEXT_W - 60, start_pt=160, floor_pt=70)
        parts.append(
            f'<g transform="translate({CX},900) scale({sc:.3f}) translate({-CX},{-900})">'
            f'{svg_text("MODCON", CX, 830, name_pt, fill=BEAST_WHITE, font=FONT_DISPLAY, stroke=BEAST_BLACK, stroke_w=8)}'
            f'{svg_text("AGARTHA", CX, 1000, name_pt, fill=BEAST_YELLOW, font=FONT_DISPLAY, stroke=BEAST_BLACK, stroke_w=8)}'
            f'</g>'
        )

        if t > 10.0:
            a = clamp((t - 10.0) / 0.4)
            parts.append(
                f'<g opacity="{a:.3f}">'
                f'{svg_text("NARSAPUR FOREST", CX, 1180, 46, fill=BEAST_WHITE, font=FONT_MONO, letter_spacing=10)}'
                f'{svg_text("OUTLOOK ECO AWARD 2024", CX, 1240, 38, fill=BEAST_YELLOW, font=FONT_MONO, letter_spacing=8)}'
                f'</g>'
            )
        if t > 10.5:
            a = clamp((t - 10.5) / 0.4)
            parts.append(
                f'<g opacity="{a:.3f}">'
                f'{hand_circle(CX, 1000, 520, 105, stroke_w=12, seed=51, color=BEAST_YELLOW)}'
                f'</g>'
            )

    # ─────────────────────────────────────────────────────────────────────
    # PROOF — Agartha stat triplet (12.0s - 14.0s)
    # ─────────────────────────────────────────────────────────────────────
    elif t < 14.0:
        parts.append(svg_text("THE NUMBERS:", CX, 500, 46,
                              fill=BEAST_BLACK, font=FONT_MONO, letter_spacing=10))

        chips = [
            (12.0, "AQI 12",     BEAST_YELLOW, 730, -4),
            (12.35, "18 dB",     BEAST_RED,   1010, 3),
            (12.7, "25 ACRES",   BEAST_GREEN, 1290, -3),
        ]
        for start, label, col, y, rot in chips:
            if t < start:
                continue
            sc = ease_out_back(clamp((t - start) / 0.35))
            inverse = col in (BEAST_GREEN, BEAST_RED)
            parts.append(
                f'<g transform="translate({CX},{y}) rotate({rot}) scale({sc:.3f}) translate({-CX},{-y})">'
                f'<rect x="{CX-380}" y="{y-110}" width="760" height="220" '
                f'rx="26" fill="{col}" stroke="{BEAST_BLACK}" stroke-width="9"/>'
                f'{svg_text(label, CX, y+30, 110, fill=(BEAST_WHITE if inverse else BEAST_BLACK), font=FONT_DISPLAY, letter_spacing=-2)}'
                f'</g>'
            )

    # ─────────────────────────────────────────────────────────────────────
    # CTA (14.0s - 16.0s)
    # ─────────────────────────────────────────────────────────────────────
    else:
        parts.append(svg_text("COMMENT", CX, 540, 54,
                              fill=BEAST_BLACK, font=FONT_MONO, letter_spacing=12))

        chip_y = 740
        pulse = 1.0 + 0.04 * (1 if int((t - 14.0) * 4) % 2 == 0 else -1)
        parts.append(
            f'<g transform="translate({CX},{chip_y}) rotate(-3) scale({pulse:.3f}) translate({-CX},{-chip_y})">'
            f'<rect x="{CX-430}" y="{chip_y-110}" width="860" height="220" '
            f'rx="28" fill="{BEAST_YELLOW}" stroke="{BEAST_BLACK}" stroke-width="10"/>'
            f'{svg_text("‘SANCTUARY’", CX, chip_y+40, 130, fill=BEAST_BLACK, font=FONT_DISPLAY, letter_spacing=-2)}'
            f'</g>'
        )

        parts.append(svg_text("— WE DM THE 3-WAY", CX, 990, 46,
                              fill=BEAST_BLACK, font=FONT_DISPLAY))
        parts.append(svg_text("COMPARISON DOC.", CX, 1050, 46,
                              fill=BEAST_BLACK, font=FONT_DISPLAY))

        logo_size = 180
        logo_y = 1220
        logo_x = W - 60 - logo_size
        parts.append(embed_logo(LOGO, logo_x, logo_y, logo_size))
        parts.append(svg_text("THE GREEN TEAM", 80, logo_y + 70, 38,
                              fill=BEAST_BLACK, font=FONT_DISPLAY,
                              anchor="start", letter_spacing=-1))
        parts.append(svg_text("THEGREENTEAM.IN", 80, logo_y + 120, 24,
                              fill=BEAST_BLACK, font=FONT_MONO,
                              anchor="start", letter_spacing=8))
        parts.append(svg_text("FOLLOW @THE.GREEN.TEAM__", 80, logo_y + 165, 22,
                              fill=BEAST_GREEN, font=FONT_MONO,
                              anchor="start", letter_spacing=6))

    return "".join(parts)


def main(bpm: int = 120, length_s: float = 16.0) -> None:
    spec = RenderSpec(
        slug="gt-ep02-sanctuaries",
        bpm=bpm,
        length_s=length_s,
        out_root=ROOT.parent.parent / "out",
    )
    spec.out_root.mkdir(parents=True, exist_ok=True)
    render_video(spec, frame, impact_beats=IMPACT_BEATS)


if __name__ == "__main__":
    import argparse
    p = argparse.ArgumentParser()
    p.add_argument("--bpm", type=int, default=120)
    p.add_argument("--length", type=float, default=16.0)
    args = p.parse_args()
    main(bpm=args.bpm, length_s=args.length)
