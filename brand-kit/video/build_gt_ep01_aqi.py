"""
GT-EP01 — "FOREST MATH" · The AQI Proof Episode (v2 — real assets)
─────────────────────────────────────────────────────────
Spotlight · 120 BPM · 15.5s · 1080x1920 @ 60fps

Uses the Green Team's actual design system:
  - Fonts: Inter Display (display, ≈ site's Manrope), Inter (body),
           Caladea italic (editorial pull quotes, ≈ site's Cormorant Garamond)
  - Colors: olive #2d3a1d primary, cream #faf9f6 paper, sage #a3b18a accent,
            gold #b8860b premium, terracotta #8a3d36 warm annotation
  - Photos: public/hero-backdrop.jpg, public/agartha-render.jpg,
            public/agartha-official-render.png, public/gallery/agartha/*

CONTENT BRIEF (Section 7 of master brief):

episode:
  slug: "gt-ep01-aqi"
  bpm: 120
  length_s: 15.5
  format: spotlight

content:
  hook: "ONLY 1 IN 100 PROJECTS NEAR HYDERABAD HAS AQI UNDER 25."
  stakes: "CITY AIR 100–180.  OUR STANDARD <25.  AGARTHA: 12."
  method: "VERIFIED · CURATED · INDEPENDENT"
  spotlight:
    name: "MODCON AGARTHA"
    proof: "OUTLOOK ECO AWARD 2024 · NARSAPUR FOREST"
    stats: ["AQI 12", "18 dB", "25 ACRES"]

cta:
  keyword: "GREEN"
  deliverable: "full AQI + noise verification doc"
  vertical: "FOREST REAL ESTATE"

provenance:
  sources:
    - "Outlook Business 2024 Eco-Friendly Project Award (public record)"
    - "thegreenteam.in site copy"
    - "MODCON Agartha listing — 25 acres, 36 plots, 100+ tree varieties"
  notes: "Hero imagery: public/agartha-render.jpg (aerial),
          public/agartha-official-render.png (clubhouse render),
          public/gallery/agartha/11.webp (biophilic house exterior),
          public/hero-backdrop.jpg (forest backdrop)."
"""
from __future__ import annotations

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
REPO = ROOT.parent.parent  # /home/user/The-Green-Team
sys.path.insert(0, str(ROOT))

from _lib import (  # noqa: E402
    BEAST_BLACK, BEAST_GREEN, BEAST_RED, BEAST_WHITE, BEAST_YELLOW,
    CX, CY, FONT_BODY, FONT_DISPLAY, FONT_MONO, FONT_SERIF,
    GT_CASHEW, GT_CHARCOAL, GT_CREAM, GT_GOLD, GT_GOLD_LIGHT,
    GT_OLIVE_700, GT_OLIVE_800, GT_OLIVE_900, GT_SAGE,
    GT_TERRACOTTA, GT_TERRACOTTA_LIGHT,
    H, SAFE_TEXT_W, SAFE_TOP, W,
    RenderSpec, clamp, cinematic_bars, ease_in_cubic, ease_out_back,
    ease_out_cubic, embed_image, embed_logo, escape, fit_to_width,
    gradient_overlay, hand_arrow, hand_circle, hero_layer, kicker,
    render_video, serif_pullquote, stat_chip, svg_text,
)

# ─── Asset paths ─────────────────────────────────────────────────────────
LOGO = ROOT.parent / "logo" / "the-green-team-monogram.svg"

PHOTO_HERO_FOREST = REPO / "public" / "hero-backdrop.jpg"
PHOTO_AGARTHA_AERIAL = REPO / "public" / "agartha-render.jpg"
PHOTO_AGARTHA_HOUSE = REPO / "public" / "gallery" / "agartha" / "11.webp"
PHOTO_AGARTHA_VILLA = REPO / "public" / "gallery" / "agartha" / "22.webp"  # clean reveal hero
AGARTHA_LOGO = REPO / "public" / "gallery" / "agartha" / "0.webp"          # AGARTHA brand mark
PHOTO_SYL_INTERIOR = REPO / "public" / "gallery" / "syl" / "1776279315359.webp"
PHOTO_DATES_FOREST = REPO / "public" / "gallery" / "dates-county" / "forest.jpg"

IMPACT_BEATS = [0, 4, 7, 10, 16, 17, 18, 21, 27]


# ─── Helpers ─────────────────────────────────────────────────────────────
def dark_photo_stage(photo: Path, t_local: float, duration: float,
                     bottom_alpha: float = 0.85, top_alpha: float = 0.20) -> str:
    """Hero photo + dark olive gradient so cream text reads on top."""
    return (
        hero_layer(photo, t_local, duration, scale_from=1.02, scale_to=1.14,
                   pan_y=-50)
        + gradient_overlay([
            (0.0, GT_OLIVE_900, top_alpha),
            (0.45, GT_OLIVE_900, top_alpha + 0.10),
            (1.0, GT_OLIVE_900, bottom_alpha),
        ], grad_id=f"dg{int(t_local*1000) % 9999}")
    )


def cream_stage() -> str:
    """Just a cream background."""
    return f'<rect x="0" y="0" width="{W}" height="{H}" fill="{GT_CREAM}"/>'


# ─── Frame composer ─────────────────────────────────────────────────────
def frame(t_norm: float, t: float) -> str:
    parts: list[str] = []

    # ─────────────────────────────────────────────────────────────────────
    # HOOK (0.0s - 2.0s) — full-frame forest hero + the proof claim
    # ─────────────────────────────────────────────────────────────────────
    if t < 2.0:
        parts.append(dark_photo_stage(PHOTO_HERO_FOREST, t_local=t, duration=2.0,
                                       bottom_alpha=0.92, top_alpha=0.55))

        # Serif italic eyebrow
        parts.append(serif_pullquote("the green team — editorial real estate",
                                     CX, SAFE_TOP + 50, size=34, color=GT_SAGE,
                                     italic=True))

        # Frame-1 visible from t=0
        parts.append(svg_text("ONLY", CX, 600, 86,
                              fill=GT_CREAM, font=FONT_DISPLAY))

        # Sage block behind "1 IN 100"
        chip_y = 800
        sc = ease_out_back(clamp((t - 0.0) / 0.3))
        parts.append(
            f'<g transform="translate({CX},{chip_y}) rotate(-3.5) scale({sc:.3f}) translate({-CX},{-chip_y})">'
            f'<rect x="{CX-380}" y="{chip_y-110}" width="760" height="220" '
            f'rx="18" fill="{GT_SAGE}" stroke="{GT_OLIVE_900}" stroke-width="6"/>'
            f'{svg_text("1 IN 100", CX, chip_y+50, 150, fill=GT_OLIVE_900, font=FONT_DISPLAY, letter_spacing=-4)}'
            f'</g>'
        )

        parts.append(svg_text("PROJECTS NEAR HYDERABAD", CX, 1080, 50,
                              fill=GT_CREAM, font=FONT_DISPLAY))
        parts.append(svg_text("HAS AQI UNDER 25.", CX, 1170, 72,
                              fill=GT_GOLD_LIGHT, font=FONT_DISPLAY,
                              stroke=GT_OLIVE_900, stroke_w=3))

        # Hand-drawn terracotta arrow pointing at "AQI UNDER 25"
        if t > 0.5:
            a = clamp((t - 0.5) / 0.3)
            parts.append(
                f'<g opacity="{a:.3f}">'
                f'{hand_arrow(CX+460, 1290, CX+260, 1190, stroke_w=10, seed=41, color=GT_TERRACOTTA_LIGHT)}'
                f'</g>'
            )

        # Hand-drawn circle around "1 IN 100"
        if t > 0.9:
            a = clamp((t - 0.9) / 0.3)
            parts.append(
                f'<g opacity="{a:.3f}">'
                f'{hand_circle(CX, chip_y+10, 420, 130, stroke_w=9, seed=7, color=GT_TERRACOTTA_LIGHT)}'
                f'</g>'
            )

    # ─────────────────────────────────────────────────────────────────────
    # STAKES (2.0s - 3.5s) — cream paper, dual contrast chips
    # ─────────────────────────────────────────────────────────────────────
    elif t < 3.5:
        parts.append(cream_stage())

        parts.append(serif_pullquote("the math we run before we recommend.",
                                     CX, 380, size=44, color=GT_OLIVE_800))
        parts.append(kicker("CITY vs. CURATED · AQI CONTRAST", y=470, color=GT_OLIVE_700))

        # Left chip (city / bad) — terracotta
        sc_l = ease_out_back(clamp((t - 2.0) / 0.35))
        lx, cy = CX, 760
        parts.append(
            f'<g transform="translate({lx},{cy}) rotate(-3) scale({sc_l:.3f}) translate({-lx},{-cy})">'
            f'<rect x="{lx-420}" y="{cy-140}" width="840" height="240" '
            f'rx="20" fill="{GT_TERRACOTTA}" stroke="{GT_OLIVE_900}" stroke-width="6"/>'
            f'{svg_text("CITY HYDERABAD", lx, cy-40, 36, fill=GT_CREAM, font=FONT_MONO, letter_spacing=8)}'
            f'{svg_text("100 – 180", lx, cy+70, 110, fill=GT_CREAM, font=FONT_DISPLAY, letter_spacing=-4)}'
            f'</g>'
        )

        # Right chip (our standard / good) — olive + gold
        if t > 2.5:
            sc_r = ease_out_back(clamp((t - 2.5) / 0.35))
            ry = 1180
            parts.append(
                f'<g transform="translate({CX},{ry}) rotate(3) scale({sc_r:.3f}) translate({-CX},{-ry})">'
                f'<rect x="{CX-420}" y="{ry-140}" width="840" height="240" '
                f'rx="20" fill="{GT_OLIVE_800}" stroke="{GT_OLIVE_900}" stroke-width="6"/>'
                f'{svg_text("OUR MINIMUM STANDARD", CX, ry-40, 32, fill=GT_SAGE, font=FONT_MONO, letter_spacing=8)}'
                f'{svg_text("UNDER 25", CX, ry+70, 110, fill=GT_GOLD_LIGHT, font=FONT_DISPLAY, letter_spacing=-4)}'
                f'</g>'
            )

    # ─────────────────────────────────────────────────────────────────────
    # METHOD (3.5s - 5.0s) — three-photo strip + verified/curated/independent
    # ─────────────────────────────────────────────────────────────────────
    elif t < 5.0:
        parts.append(cream_stage())

        parts.append(serif_pullquote("we verify before we recommend.",
                                     CX, 420, size=48, color=GT_OLIVE_800))

        # Three-photo strip (sanctuaries we vetted)
        strip_y = 540
        strip_h = 380
        gap = 24
        card_w = (W - 60*2 - gap*2) / 3
        photos = [PHOTO_AGARTHA_HOUSE, PHOTO_SYL_INTERIOR, PHOTO_DATES_FOREST]
        labels = ["AGARTHA", "SYL", "DATES COUNTY"]
        for i, (ph, lbl) in enumerate(zip(photos, labels)):
            cx = 60 + i * (card_w + gap)
            # Clip the photo to a rounded rect via clip-path
            cid = f"c{i}"
            parts.append(
                f'<defs><clipPath id="{cid}"><rect x="{cx}" y="{strip_y}" width="{card_w}" height="{strip_h}" rx="14"/></clipPath></defs>'
                f'<g clip-path="url(#{cid})">'
                f'{embed_image(ph, cx, strip_y, card_w, strip_h)}'
                f'</g>'
                # Sage stroke
                f'<rect x="{cx}" y="{strip_y}" width="{card_w}" height="{strip_h}" '
                f'rx="14" fill="none" stroke="{GT_OLIVE_800}" stroke-width="3"/>'
                # Olive footer band with label
                f'<rect x="{cx}" y="{strip_y + strip_h - 56}" width="{card_w}" height="56" '
                f'fill="{GT_OLIVE_800}" clip-path="url(#{cid})"/>'
                f'{svg_text(lbl, cx + card_w/2, strip_y + strip_h - 18, 22, fill=GT_CREAM, font=FONT_MONO, letter_spacing=4)}'
            )

        # Three-word method line below the strip
        method = [
            (3.7, "VERIFIED",     GT_OLIVE_800),
            (4.05, "·",           GT_TERRACOTTA),
            (4.15, "CURATED",     GT_OLIVE_800),
            (4.45, "·",           GT_TERRACOTTA),
            (4.55, "INDEPENDENT", GT_OLIVE_800),
        ]
        # Position words inline at y=1080
        # We'll just do three separate lines vertically for clarity
        ys = [1070, 1170, 1270]
        words = ["VERIFIED", "CURATED", "INDEPENDENT"]
        word_t = [3.7, 4.15, 4.55]
        for w, y, wt in zip(words, ys, word_t):
            a = clamp((t - wt) / 0.25)
            parts.append(
                f'<g opacity="{a:.3f}">'
                f'{svg_text(w, CX, y, 80, fill=GT_OLIVE_800, font=FONT_DISPLAY, letter_spacing=-2)}'
                f'</g>'
            )

    # ─────────────────────────────────────────────────────────────────────
    # AWARD (5.0s - 8.0s) — Agartha aerial hero + olive award block
    # ─────────────────────────────────────────────────────────────────────
    elif t < 8.0:
        t_local = t - 5.0
        parts.append(dark_photo_stage(PHOTO_AGARTHA_AERIAL, t_local=t_local,
                                       duration=3.0, bottom_alpha=0.92, top_alpha=0.35))

        parts.append(serif_pullquote("public record · outlook business",
                                     CX, SAFE_TOP + 40, size=30, color=GT_SAGE))
        parts.append(kicker("THE PROOF", y=SAFE_TOP + 100, color=GT_CREAM))

        # Olive award block (anchored lower so the hero photo carries the top)
        ay = 1000
        sc = ease_out_back(clamp(t_local / 0.4))
        block_w, block_h = 940, 440
        bx = CX - block_w / 2
        by = ay
        parts.append(
            f'<g transform="translate({CX},{by + block_h/2}) rotate(-2) scale({sc:.3f}) translate({-CX},{-(by + block_h/2)})">'
            f'<rect x="{bx}" y="{by}" width="{block_w}" height="{block_h}" '
            f'rx="22" fill="{GT_OLIVE_800}" stroke="{GT_OLIVE_900}" stroke-width="6"/>'
            f'{svg_text("WINNER", CX, by + 80, 36, fill=GT_SAGE, font=FONT_MONO, letter_spacing=14)}'
            f'{svg_text("OUTLOOK ECO", CX, by + 200, 76, fill=GT_CREAM, font=FONT_DISPLAY)}'
            f'{svg_text("AWARD  2024", CX, by + 340, 96, fill=GT_GOLD_LIGHT, font=FONT_DISPLAY, letter_spacing=-2)}'
            f'</g>'
        )

        if t > 5.9:
            ca = clamp((t - 5.9) / 0.4)
            parts.append(
                f'<g opacity="{ca:.3f}">'
                f'{hand_circle(CX, by + 340, 340, 75, stroke_w=10, seed=99, color=GT_GOLD_LIGHT)}'
                f'</g>'
            )

        if t > 6.6:
            sa = clamp((t - 6.6) / 0.4)
            parts.append(
                f'<g opacity="{sa:.3f}">'
                f'{serif_pullquote("best sustainable project — india", CX, 1530, size=36, color=GT_CREAM)}'
                f'</g>'
            )

    # ─────────────────────────────────────────────────────────────────────
    # STATS (8.0s - 10.5s) — Agartha clubhouse hero + 3 numbers
    # ─────────────────────────────────────────────────────────────────────
    elif t < 10.5:
        t_local = t - 8.0
        # Use a different angle of Agartha as the backdrop
        parts.append(dark_photo_stage(PHOTO_AGARTHA_HOUSE, t_local=t_local,
                                       duration=2.5, bottom_alpha=0.85, top_alpha=0.55))

        parts.append(kicker("VERIFIED AT THE SITE", y=SAFE_TOP + 60, color=GT_CREAM))
        parts.append(serif_pullquote("the numbers we publish are the numbers we measured.",
                                     CX, SAFE_TOP + 140, size=32, color=GT_SAGE))

        chips = [
            (8.0,  "AQI 12",     GT_SAGE,        GT_OLIVE_900, 740,  -4),
            (8.4,  "18 dB",      GT_GOLD_LIGHT,  GT_OLIVE_900, 1030,  3),
            (8.85, "25 ACRES",   GT_CREAM,       GT_OLIVE_900, 1320, -3),
        ]
        for start, label, fill, ink, y, rot in chips:
            if t < start:
                continue
            sc = ease_out_back(clamp((t - start) / 0.35))
            parts.append(
                f'<g transform="translate({CX},{y}) rotate({rot}) scale({sc:.3f}) translate({-CX},{-y})">'
                f'<rect x="{CX-400}" y="{y-110}" width="800" height="220" '
                f'rx="20" fill="{fill}" stroke="{GT_OLIVE_900}" stroke-width="6"/>'
                f'{svg_text(label, CX, y+35, 120, fill=ink, font=FONT_DISPLAY, letter_spacing=-3)}'
                f'</g>'
            )

    # ─────────────────────────────────────────────────────────────────────
    # REVEAL (10.5s - 13.5s) — villa hero + Modcon Agartha name + brand mark
    # ─────────────────────────────────────────────────────────────────────
    elif t < 13.5:
        t_local = t - 10.5
        parts.append(dark_photo_stage(PHOTO_AGARTHA_VILLA, t_local=t_local,
                                       duration=3.0, bottom_alpha=0.92, top_alpha=0.55))

        parts.append(serif_pullquote("the 1 in 100", CX, 540, size=46, color=GT_GOLD_LIGHT))

        # The MODCON × AGARTHA name lockup, with stroke for legibility on photo
        sc = ease_out_back(clamp(t_local / 0.5))
        name_pt = fit_to_width("MODCON AGARTHA", SAFE_TEXT_W - 60, start_pt=160, floor_pt=80)
        parts.append(
            f'<g transform="translate({CX},900) scale({sc:.3f}) translate({-CX},{-900})">'
            f'{svg_text("MODCON", CX, 800, 110, fill=GT_CREAM, font=FONT_DISPLAY, stroke=GT_OLIVE_900, stroke_w=5)}'
            f'{svg_text("AGARTHA", CX, 970, 150, fill=GT_SAGE, font=FONT_DISPLAY, stroke=GT_OLIVE_900, stroke_w=6, letter_spacing=-2)}'
            f'</g>'
        )

        # Hand-drawn gold circle annotates just AGARTHA (tighter ellipse).
        if t > 11.2:
            a = clamp((t - 11.2) / 0.4)
            parts.append(
                f'<g opacity="{a:.3f}">'
                f'{hand_circle(CX, 970, 470, 95, stroke_w=10, seed=44, color=GT_GOLD_LIGHT)}'
                f'</g>'
            )

        # AGARTHA project tagline + The Green Team location info, below the circle.
        if t > 11.5:
            a = clamp((t - 11.5) / 0.4)
            parts.append(
                f'<g opacity="{a:.3f}">'
                f'{serif_pullquote("roots of earth", CX, 1140, size=40, color=GT_GOLD_LIGHT)}'
                f'</g>'
            )
        if t > 11.9:
            a = clamp((t - 11.9) / 0.4)
            parts.append(
                f'<g opacity="{a:.3f}">'
                f'{svg_text("NARSAPUR FOREST · 25 ACRES", CX, 1260, 36, fill=GT_CREAM, font=FONT_MONO, letter_spacing=8)}'
                f'{svg_text("36 PLOTS · 100+ TREE VARIETIES", CX, 1316, 28, fill=GT_SAGE, font=FONT_MONO, letter_spacing=6)}'
                f'</g>'
            )

    # ─────────────────────────────────────────────────────────────────────
    # CTA (13.5s - 15.5s) — cream paper, brand monogram, keyword pill
    # ─────────────────────────────────────────────────────────────────────
    else:
        parts.append(cream_stage())

        parts.append(serif_pullquote("ask us for the proof.",
                                     CX, 460, size=46, color=GT_OLIVE_800))
        parts.append(kicker("COMMENT THE KEYWORD", y=540, color=GT_OLIVE_700))

        # Olive chip with keyword (more editorial than yellow)
        chip_y = 760
        pulse = 1.0 + 0.03 * (1 if int((t - 13.5) * 4) % 2 == 0 else -1)
        parts.append(
            f'<g transform="translate({CX},{chip_y}) rotate(-2) scale({pulse:.3f}) translate({-CX},{-chip_y})">'
            f'<rect x="{CX-340}" y="{chip_y-110}" width="680" height="220" '
            f'rx="22" fill="{GT_OLIVE_800}" stroke="{GT_OLIVE_900}" stroke-width="6"/>'
            f'{svg_text("‘GREEN’", CX, chip_y+45, 150, fill=GT_GOLD_LIGHT, font=FONT_DISPLAY, letter_spacing=-2)}'
            f'</g>'
        )

        parts.append(svg_text("WE DM THE FULL AQI", CX, 1010, 42,
                              fill=GT_OLIVE_800, font=FONT_DISPLAY))
        parts.append(svg_text("+ NOISE VERIFICATION DOC.", CX, 1064, 42,
                              fill=GT_OLIVE_800, font=FONT_DISPLAY))

        # Brand row at the bottom — monogram + wordmark + URL.
        # Wordmark left-anchored, monogram right; stays inside SAFE_BOTTOM=480.
        logo_size = 160
        logo_y = 1280
        logo_x = W - 60 - logo_size
        parts.append(embed_logo(LOGO, logo_x, logo_y, logo_size))

        parts.append(svg_text("THE GREEN TEAM", 80, logo_y + 60, 38,
                              fill=GT_OLIVE_800, font=FONT_DISPLAY,
                              anchor="start", letter_spacing=-1))
        # Pull-quote tag — anchor LEFT (not centered), keep above safe bottom
        parts.append(
            f'<text x="80" y="{logo_y + 105}" text-anchor="start" '
            f'font-family="{FONT_SERIF}" font-style="italic" font-weight="400" '
            f'font-size="26" fill="{GT_OLIVE_700}" letter-spacing="-0.3">'
            f'editorial real estate · hyderabad</text>'
        )
        parts.append(svg_text("THEGREENTEAM.IN", 80, logo_y + 150, 22,
                              fill=GT_OLIVE_800, font=FONT_MONO,
                              anchor="start", letter_spacing=6))

    return "".join(parts)


# ─── Entry point ─────────────────────────────────────────────────────────
def main(bpm: int = 120, length_s: float = 15.5) -> None:
    spec = RenderSpec(
        slug="gt-ep01-aqi",
        bpm=bpm,
        length_s=length_s,
        out_root=REPO / "out",
    )
    spec.out_root.mkdir(parents=True, exist_ok=True)
    render_video(spec, frame, impact_beats=IMPACT_BEATS)


if __name__ == "__main__":
    import argparse
    p = argparse.ArgumentParser()
    p.add_argument("--bpm", type=int, default=120)
    p.add_argument("--length", type=float, default=15.5)
    args = p.parse_args()
    main(bpm=args.bpm, length_s=args.length)
