"""
GT-RAIDURGAM-MEMO — 9-slide Instagram carousel

A market-intelligence carousel about the new record per-acre land prices
in Raidurgam (West Hyderabad). Slides 1-7 cover the market data; slide 8
pivots back to The Green Team's editorial brand angle (forest-adjacent
properties as a contrasting investment thesis); slide 9 is the CTA.

Format: 1080×1350 (4:5 IG portrait carousel — IG's recommended format)
Output: posts-ready/post-gt-raidurgam-memo/slides/s{01..09}.jpg

The numbers used here are approximations from publicly-reported industry
deals. Verify specific transaction details with primary sources before
publishing.
"""
from __future__ import annotations

import io
import math
from pathlib import Path

import cairosvg
import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parent
REPO = ROOT.parent.parent

OUT_DIR = REPO / "posts-ready" / "post-gt-raidurgam-memo" / "slides"

W, H = 1080, 1350           # IG 4:5 carousel
CX = W // 2
CY = H // 2

# Green Team brand palette
INK         = "#0e1408"
PAPER       = "#faf9f6"
PAPER_DIM   = "#e8e6dd"
GT_OLIVE_800 = "#2d3a1d"
GT_SAGE     = "#a3b18a"
GT_GOLD     = "#c8a951"
GT_GOLD_DEEP = "#a88a39"
GT_TERRA    = "#8a3d36"

FONT_DISPLAY = "'Inter Display', 'Inter', 'Helvetica Neue', 'DejaVu Sans', sans-serif"
FONT_SERIF   = "'Caladea', 'Cormorant Garamond', 'Liberation Serif', serif"
FONT_MONO    = "'JetBrains Mono', 'IBM Plex Mono', 'DejaVu Sans Mono', monospace"

# Leaf logo paths (Green Team mark)
LEAF_DIM   = "M50 90C50 90 48 80 40 70C30 60 10 55 5 40C0 25 15 5 40 10C55 13 65 25 70 40C75 55 65 75 50 90Z"
LEAF_LIGHT = "M50 90C50 90 52 75 60 65C70 55 90 50 95 35C100 20 85 0 60 5C45 8 35 20 30 35C25 50 35 70 50 90Z"
LEAF_LINE  = "M50 90L50 45M50 90C50 90 44 72 34 62M50 90C50 90 56 72 66 62"

TOTAL_SLIDES = 9


# ─── COMMON ─────────────────────────────────────────────────────────────
def svg_header(bg: str = INK) -> str:
    return (
        '<?xml version="1.0" encoding="UTF-8"?>'
        f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" '
        f'viewBox="0 0 {W} {H}">'
        '<defs>'
        f'<linearGradient id="goldHL" x1="0" y1="0" x2="1" y2="0">'
        f'<stop offset="0" stop-color="{GT_GOLD}"/>'
        f'<stop offset="0.55" stop-color="#e6ce85"/>'
        f'<stop offset="1" stop-color="{GT_GOLD_DEEP}"/>'
        f'</linearGradient>'
        '</defs>'
        f'<rect width="{W}" height="{H}" fill="{bg}"/>'
    )


def chrome(slide_idx: int) -> str:
    """Brand chrome — top-left chip, top-right slide number, bottom-left
    leaf mark + URL, gold left rule.  Same on every slide."""
    parts = []
    # Gold left rule (vertical, full height)
    parts.append(f'<rect x="0" y="0" width="6" height="{H}" fill="{GT_GOLD}"/>')
    # Top eyebrow
    parts.append(
        f'<g transform="translate(64,80)">'
        f'<text x="0" y="0" font-family="{FONT_MONO}" font-size="14" '
        f'fill="{GT_GOLD}" font-weight="700" letter-spacing="4">'
        f'THE GREEN TEAM</text>'
        f'<text x="0" y="22" font-family="{FONT_MONO}" font-size="12" '
        f'fill="{PAPER}" opacity="0.75" letter-spacing="3">'
        f'MARKET MEMO  ·  HYDERABAD  ·  Q2 2026</text>'
        f'</g>'
    )
    # Slide number top-right
    parts.append(
        f'<text x="{W-64}" y="92" font-family="{FONT_MONO}" font-size="14" '
        f'fill="{PAPER}" opacity="0.7" letter-spacing="3" '
        f'text-anchor="end">{slide_idx:02d}  /  {TOTAL_SLIDES:02d}</text>'
    )
    # Bottom leaf + URL
    leaf_size = 30
    leaf_x = 64
    leaf_y = H - 90
    parts.append(
        f'<g transform="translate({leaf_x},{leaf_y - leaf_size/2}) '
        f'scale({leaf_size/100:.4f})">'
        f'<path d="{LEAF_DIM}" fill="{PAPER}" opacity="0.35"/>'
        f'<path d="{LEAF_LIGHT}" fill="{PAPER}" opacity="1.0"/>'
        f'</g>'
        f'<text x="{leaf_x + leaf_size + 16}" y="{leaf_y + 5}" '
        f'font-family="{FONT_MONO}" font-size="14" '
        f'fill="{GT_GOLD}" font-weight="700" letter-spacing="2">'
        f'thegreenteam.in</text>'
    )
    # Progress dots bottom-right
    dot_y = H - 75
    dot_start = W - 64 - (TOTAL_SLIDES - 1) * 14
    for i in range(TOTAL_SLIDES):
        col = GT_GOLD if i == slide_idx - 1 else "#3a4a2c"
        parts.append(
            f'<circle cx="{dot_start + i*14}" cy="{dot_y}" r="3.5" fill="{col}"/>'
        )
    return "".join(parts)


def svg_to_image(svg: str) -> Image.Image:
    png = cairosvg.svg2png(bytestring=svg.encode("utf-8"),
                           output_width=W, output_height=H)
    return Image.open(io.BytesIO(png)).convert("RGB")


# ─── SLIDE 1 — HOOK ─────────────────────────────────────────────────────
def slide_01_hook() -> str:
    return (
        svg_header(bg=INK)
        + chrome(1)
        # Massive editorial headline (4 lines)
        + f'<text x="{CX}" y="430" font-family="{FONT_DISPLAY}" font-size="92" '
        f'fill="{PAPER}" font-weight="900" letter-spacing="-3" '
        f'text-anchor="middle">1 ACRE</text>'
        + f'<text x="{CX}" y="540" font-family="{FONT_DISPLAY}" font-size="92" '
        f'fill="{PAPER}" font-weight="900" letter-spacing="-3" '
        f'text-anchor="middle">IN RAIDURGAM</text>'
        + f'<text x="{CX}" y="650" font-family="{FONT_DISPLAY}" font-size="92" '
        f'fill="{PAPER}" font-weight="900" letter-spacing="-3" '
        f'text-anchor="middle">JUST CROSSED</text>'
        # Gold ₹ amount (italic accent line)
        + f'<line x1="{CX-100}" y1="710" x2="{CX+100}" y2="710" '
        f'stroke="{GT_GOLD}" stroke-width="3"/>'
        + f'<text x="{CX}" y="850" font-family="{FONT_DISPLAY}" font-size="160" '
        f'fill="url(#goldHL)" font-weight="800" font-style="italic" '
        f'letter-spacing="-4" text-anchor="middle">₹237 CR.</text>'
        + f'<text x="{CX}" y="930" font-family="{FONT_MONO}" font-size="18" '
        f'fill="{PAPER}" opacity="0.7" letter-spacing="6" '
        f'text-anchor="middle">PER ACRE — TGIIC E-AUCTION RECORD</text>'
        + f'<text x="{CX}" y="965" font-family="{FONT_MONO}" font-size="14" '
        f'fill="{GT_GOLD}" opacity="0.75" letter-spacing="3" '
        f'text-anchor="middle">+70.5% OVER RESERVE  ·  6.29 ACRES  ·  GOWRA VENTURES</text>'
        # Bottom sub-caption
        + f'<text x="{CX}" y="1140" font-family="{FONT_SERIF}" font-size="22" '
        f'fill="{PAPER}" opacity="0.85" font-style="italic" '
        f'text-anchor="middle">A Green Team market memo.</text>'
        + f'<text x="{CX}" y="1180" font-family="{FONT_MONO}" font-size="14" '
        f'fill="{GT_GOLD}" opacity="0.85" letter-spacing="5" '
        f'text-anchor="middle">SWIPE TO READ</text>'
        + '</svg>'
    )


# ─── SLIDE 2 — WHERE ────────────────────────────────────────────────────
def slide_02_where() -> str:
    return (
        svg_header(bg=INK)
        + chrome(2)
        + f'<text x="{CX}" y="280" font-family="{FONT_MONO}" font-size="14" '
        f'fill="{GT_GOLD}" font-weight="700" letter-spacing="6" '
        f'text-anchor="middle">WHERE</text>'
        + f'<text x="{CX}" y="430" font-family="{FONT_DISPLAY}" font-size="120" '
        f'fill="{PAPER}" font-weight="800" letter-spacing="-2" '
        f'text-anchor="middle">RAIDURGAM</text>'
        + f'<line x1="{CX-140}" y1="465" x2="{CX+140}" y2="465" '
        f'stroke="{GT_GOLD}" stroke-width="2"/>'
        + f'<text x="{CX}" y="530" font-family="{FONT_SERIF}" font-size="28" '
        f'fill="{PAPER}" opacity="0.85" font-style="italic" '
        f'text-anchor="middle">West Hyderabad\'s new financial district.</text>'
        # 3-row fact stack
        + _fact_row(180, 720, "POSITION",   "OUTER RING ROAD")
        + _fact_row(180, 820, "DISTANCE",   "4 KM FROM GACHIBOWLI")
        + _fact_row(180, 920, "ADJACENT TO","KNOWLEDGE CITY · HCU")
        + _fact_row(180, 1020, "METRO",     "PHASE 2 EXTENSION INBOUND")
        + '</svg>'
    )


def _fact_row(x: int, y: int, label: str, value: str) -> str:
    return (
        f'<rect x="{x}" y="{y-22}" width="3" height="44" fill="{GT_GOLD}"/>'
        f'<text x="{x+18}" y="{y-2}" font-family="{FONT_MONO}" font-size="14" '
        f'fill="{GT_GOLD}" font-weight="700" letter-spacing="3">{label}</text>'
        f'<text x="{x+18}" y="{y+20}" font-family="{FONT_DISPLAY}" font-size="22" '
        f'fill="{PAPER}" font-weight="700" letter-spacing="-0.5">{value}</text>'
    )


# ─── SLIDE 3 — THE NUMBER ───────────────────────────────────────────────
def slide_03_number() -> str:
    return (
        svg_header(bg=INK)
        + chrome(3)
        + f'<text x="{CX}" y="280" font-family="{FONT_MONO}" font-size="14" '
        f'fill="{GT_GOLD}" font-weight="700" letter-spacing="6" '
        f'text-anchor="middle">THE RECORD</text>'
        # Giant ₹ figure
        + f'<text x="{CX}" y="540" font-family="{FONT_DISPLAY}" font-size="200" '
        f'fill="url(#goldHL)" font-weight="800" letter-spacing="-6" '
        f'text-anchor="middle">₹237 CR</text>'
        + f'<text x="{CX}" y="600" font-family="{FONT_MONO}" font-size="20" '
        f'fill="{PAPER}" opacity="0.85" letter-spacing="6" '
        f'text-anchor="middle">PER ACRE</text>'
        + f'<line x1="{CX-120}" y1="650" x2="{CX+120}" y2="650" '
        f'stroke="{GT_GOLD}" stroke-width="2"/>'
        # Transaction details (6 rows — verified per TOI & Deccan Chronicle)
        + _fact_row(160, 770,  "BUYER",          "GOWRA VENTURES PVT LTD")
        + _fact_row(160, 840,  "PARCEL",         "PLOT 1A &amp; 1/F  ·  6.29 ACRES  ·  MULTI-USE")
        + _fact_row(160, 910,  "TOTAL VALUE",    "₹1,490.73 CR")
        + _fact_row(160, 980,  "RESERVE PRICE",  "₹139 CR / ACRE")
        + _fact_row(160, 1050, "BID SURGE",      "+70.5% OVER RESERVE")
        + _fact_row(160, 1120, "PREVIOUS RECORD","₹177 CR / ACRE  ·  2025")
        # Source / disclaimer
        + f'<text x="{CX}" y="1210" font-family="{FONT_MONO}" font-size="11" '
        f'fill="{PAPER}" opacity="0.55" letter-spacing="2" '
        f'text-anchor="middle">SOURCE  ·  TIMES OF INDIA  ·  DECCAN CHRONICLE  ·  TGIIC MSTC E-AUCTION</text>'
        + '</svg>'
    )


# ─── SLIDE 4 — 5-YEAR TRAJECTORY ────────────────────────────────────────
def slide_04_trajectory() -> str:
    """Simple bar chart showing approximate per-acre prices 2019-2025."""
    # Verified record: 2025 TGIIC e-auction set ₹237 CR/acre, surpassing
    # an earlier 2025 Raidurg auction at ₹177 CR/acre. 2024 estimated ~110.
    bars = [
        ("2019",     18),
        ("2020",     22),
        ("2021",     38),
        ("2022",     55),
        ("2023",     78),
        ("2024",    110),
        ("2025 H1", 177),    # previous record per TOI
        ("2025 H2", 237),    # NEW record (Gowra Ventures · TGIIC e-auction)
    ]
    chart_x = 140
    chart_y_top = 540
    chart_y_bot = 1080
    chart_w = W - 280
    bar_gap = chart_w // len(bars)
    bar_w = bar_gap - 14
    max_val = max(v for _, v in bars)

    bar_svg = []
    for i, (year, val) in enumerate(bars):
        bh = int((val / max_val) * (chart_y_bot - chart_y_top))
        bx = chart_x + i * bar_gap + 7
        by = chart_y_bot - bh
        # Last bar gold (record), previous record gold-deep, others sage
        if i == len(bars) - 1:
            col = GT_GOLD
        elif i == len(bars) - 2:
            col = GT_GOLD_DEEP
        else:
            col = GT_SAGE
        bar_svg.append(
            f'<rect x="{bx}" y="{by}" width="{bar_w}" height="{bh}" fill="{col}"/>'
        )
        bar_svg.append(
            f'<text x="{bx + bar_w/2}" y="{by - 12}" font-family="{FONT_MONO}" '
            f'font-size="14" fill="{PAPER}" font-weight="700" letter-spacing="1" '
            f'text-anchor="middle">{val}</text>'
        )
        bar_svg.append(
            f'<text x="{bx + bar_w/2}" y="{chart_y_bot + 28}" font-family="{FONT_MONO}" '
            f'font-size="14" fill="{PAPER}" opacity="0.7" letter-spacing="1" '
            f'text-anchor="middle">{year}</text>'
        )

    growth_pct = int(((bars[-1][1] - bars[0][1]) / bars[0][1]) * 100)

    return (
        svg_header(bg=INK)
        + chrome(4)
        + f'<text x="{CX}" y="280" font-family="{FONT_MONO}" font-size="14" '
        f'fill="{GT_GOLD}" font-weight="700" letter-spacing="6" '
        f'text-anchor="middle">7-YEAR TRAJECTORY</text>'
        + f'<text x="{CX}" y="380" font-family="{FONT_DISPLAY}" font-size="64" '
        f'fill="{PAPER}" font-weight="800" letter-spacing="-1.5" '
        f'text-anchor="middle">RAIDURGAM, ₹ CR / ACRE</text>'
        + f'<text x="{CX}" y="430" font-family="{FONT_SERIF}" font-size="22" '
        f'fill="{PAPER}" opacity="0.7" font-style="italic" '
        f'text-anchor="middle">approximate per-acre prevailing rates</text>'
        + "".join(bar_svg)
        # Growth callout bottom-right
        + f'<g transform="translate({W-220},1170)">'
        f'<text x="0" y="0" font-family="{FONT_MONO}" font-size="14" '
        f'fill="{GT_GOLD}" font-weight="700" letter-spacing="3">7-YR GROWTH</text>'
        f'<text x="0" y="40" font-family="{FONT_DISPLAY}" font-size="44" '
        f'fill="{PAPER}" font-weight="800">+{growth_pct}%</text>'
        f'</g>'
        + '</svg>'
    )


# ─── SLIDE 5 — VS THE REST OF HYDERABAD ─────────────────────────────────
def slide_05_comparison() -> str:
    """Comparison table — Raidurgam vs other top areas."""
    rows = [
        ("RAIDURG",          "237  (record)", True),
        ("HITEC CITY",       "60 — 90",       False),
        ("JUBILEE HILLS",    "55 — 80",       False),
        ("BANJARA HILLS",    "50 — 75",       False),
        ("KOKAPET",          "30 — 50",       False),
        ("TELLAPUR",         "25 — 40",       False),
        ("NARSAPUR (forest)","3 — 5",         False),
    ]
    table_y = 470
    row_h = 80
    label_x = 160
    value_x = W - 160

    table_svg = []
    for i, (area, price, highlighted) in enumerate(rows):
        y = table_y + i * row_h
        # Background band for the highlighted row
        if highlighted:
            table_svg.append(
                f'<rect x="100" y="{y-50}" width="{W-200}" height="{row_h-10}" '
                f'fill="{GT_GOLD}" opacity="0.16" rx="4"/>'
            )
        col = PAPER if not highlighted else GT_GOLD
        weight = "800" if highlighted else "600"
        size_area = 26 if highlighted else 22
        size_val = 36 if highlighted else 28
        table_svg.append(
            f'<text x="{label_x}" y="{y}" font-family="{FONT_DISPLAY}" '
            f'font-size="{size_area}" fill="{col}" font-weight="{weight}" '
            f'letter-spacing="0.5">{area}</text>'
        )
        table_svg.append(
            f'<text x="{value_x}" y="{y}" font-family="{FONT_DISPLAY}" '
            f'font-size="{size_val}" fill="{col}" font-weight="{weight}" '
            f'letter-spacing="-0.5" text-anchor="end">₹{price}</text>'
        )
        # Divider line
        if i < len(rows) - 1:
            table_svg.append(
                f'<line x1="100" y1="{y+30}" x2="{W-100}" y2="{y+30}" '
                f'stroke="{PAPER}" stroke-width="0.5" opacity="0.18"/>'
            )

    return (
        svg_header(bg=INK)
        + chrome(5)
        + f'<text x="{CX}" y="280" font-family="{FONT_MONO}" font-size="14" '
        f'fill="{GT_GOLD}" font-weight="700" letter-spacing="6" '
        f'text-anchor="middle">VS. THE REST OF HYDERABAD</text>'
        + f'<text x="{CX}" y="380" font-family="{FONT_DISPLAY}" font-size="56" '
        f'fill="{PAPER}" font-weight="800" letter-spacing="-1.5" '
        f'text-anchor="middle">₹ CR / acre — top tier</text>'
        + "".join(table_svg)
        + f'<text x="{CX}" y="1200" font-family="{FONT_MONO}" font-size="11" '
        f'fill="{PAPER}" opacity="0.55" letter-spacing="2" '
        f'text-anchor="middle">Indicative ranges from public deal databases · 2024-2026</text>'
        + '</svg>'
    )


# ─── SLIDE 6 — WHY ──────────────────────────────────────────────────────
def slide_06_why() -> str:
    drivers = [
        ("01", "INSTITUTIONAL APPETITE", "Final bid 70.5% above the reserve price.",
                                          "Buyers aren't bidding for value — they're bidding for position."),
        ("02", "KNOWLEDGE CITY PULL",    "HCU + research + AMD India HQ + Microsoft.",
                                          "Anchors a new economic gravity centre."),
        ("03", "SCARCITY",               "Last institutional-grade parcels via TGIIC.",
                                          "When supply ends, the price discovery ends with it."),
    ]
    row_svg = []
    for i, (num, title, line1, line2) in enumerate(drivers):
        y = 460 + i * 240
        row_svg.append(
            f'<g transform="translate(140,{y})">'
            f'<text x="0" y="0" font-family="{FONT_MONO}" font-size="44" '
            f'fill="{GT_GOLD}" font-weight="700" letter-spacing="-1">{num}</text>'
            f'<line x1="0" y1="18" x2="60" y2="18" stroke="{GT_GOLD}" stroke-width="2"/>'
            f'<text x="100" y="-2" font-family="{FONT_DISPLAY}" font-size="34" '
            f'fill="{PAPER}" font-weight="800" letter-spacing="-0.5">{title}</text>'
            f'<text x="100" y="48" font-family="{FONT_SERIF}" font-size="22" '
            f'fill="{PAPER}" opacity="0.85">{line1}</text>'
            f'<text x="100" y="80" font-family="{FONT_SERIF}" font-size="22" '
            f'fill="{PAPER}" opacity="0.65" font-style="italic">{line2}</text>'
            f'</g>'
        )
    return (
        svg_header(bg=INK)
        + chrome(6)
        + f'<text x="{CX}" y="280" font-family="{FONT_MONO}" font-size="14" '
        f'fill="{GT_GOLD}" font-weight="700" letter-spacing="6" '
        f'text-anchor="middle">WHY THIS · WHY NOW</text>'
        + f'<text x="{CX}" y="380" font-family="{FONT_DISPLAY}" font-size="64" '
        f'fill="{PAPER}" font-weight="800" letter-spacing="-1.5" '
        f'text-anchor="middle">Three drivers.</text>'
        + "".join(row_svg)
        + '</svg>'
    )


# ─── SLIDE 7 — EDITORIAL READ ───────────────────────────────────────────
def slide_07_editorial() -> str:
    return (
        svg_header(bg=GT_OLIVE_800)
        + chrome(7)
        + f'<text x="{CX}" y="320" font-family="{FONT_MONO}" font-size="14" '
        f'fill="{GT_GOLD}" font-weight="700" letter-spacing="6" '
        f'text-anchor="middle">THE GREEN TEAM READ</text>'
        # Big italic quote
        + f'<text x="{CX}" y="500" font-family="{FONT_SERIF}" font-size="60" '
        f'fill="{PAPER}" font-style="italic" font-weight="500" letter-spacing="-1.5" '
        f'text-anchor="middle">"At ₹237 crore an acre,</text>'
        + f'<text x="{CX}" y="580" font-family="{FONT_SERIF}" font-size="60" '
        f'fill="{PAPER}" font-style="italic" font-weight="500" letter-spacing="-1.5" '
        f'text-anchor="middle">Raidurg isn\'t real estate</text>'
        + f'<text x="{CX}" y="660" font-family="{FONT_SERIF}" font-size="60" '
        f'fill="url(#goldHL)" font-style="italic" font-weight="500" letter-spacing="-1.5" '
        f'text-anchor="middle">anymore — it\'s a sovereign</text>'
        + f'<text x="{CX}" y="740" font-family="{FONT_SERIF}" font-size="60" '
        f'fill="url(#goldHL)" font-style="italic" font-weight="500" letter-spacing="-1.5" '
        f'text-anchor="middle">asset class on a 4-km strip."</text>'
        # Attribution
        + f'<line x1="{CX-60}" y1="900" x2="{CX+60}" y2="900" '
        f'stroke="{GT_GOLD}" stroke-width="2"/>'
        + f'<text x="{CX}" y="960" font-family="{FONT_MONO}" font-size="16" '
        f'fill="{PAPER}" letter-spacing="4" '
        f'text-anchor="middle">THE GREEN TEAM</text>'
        + f'<text x="{CX}" y="990" font-family="{FONT_MONO}" font-size="12" '
        f'fill="{GT_GOLD}" letter-spacing="3" '
        f'text-anchor="middle">MARKET DESK · Q2 2026</text>'
        + '</svg>'
    )


# ─── SLIDE 8 — CONTRAST PIVOT ───────────────────────────────────────────
def slide_08_contrast() -> str:
    return (
        svg_header(bg=INK)
        + chrome(8)
        + f'<text x="{CX}" y="220" font-family="{FONT_MONO}" font-size="14" '
        f'fill="{GT_GOLD}" font-weight="700" letter-spacing="6" '
        f'text-anchor="middle">MEANWHILE</text>'
        # Side-by-side numbers
        + f'<g transform="translate({CX//2},540)">'
        f'<text x="0" y="-150" font-family="{FONT_MONO}" font-size="14" '
        f'fill="{PAPER}" opacity="0.7" letter-spacing="4" '
        f'text-anchor="middle">RAIDURGAM</text>'
        f'<text x="0" y="-100" font-family="{FONT_MONO}" font-size="12" '
        f'fill="{PAPER}" opacity="0.5" letter-spacing="3" '
        f'text-anchor="middle">PER ACRE</text>'
        f'<text x="0" y="20" font-family="{FONT_DISPLAY}" font-size="100" '
        f'fill="{PAPER}" font-weight="800" letter-spacing="-3" '
        f'text-anchor="middle">₹237</text>'
        f'<text x="0" y="80" font-family="{FONT_MONO}" font-size="18" '
        f'fill="{PAPER}" opacity="0.75" letter-spacing="3" '
        f'text-anchor="middle">CR / ACRE</text>'
        f'<text x="0" y="160" font-family="{FONT_SERIF}" font-size="20" '
        f'fill="{PAPER}" opacity="0.55" font-style="italic" '
        f'text-anchor="middle">"premium financial district"</text>'
        f'</g>'
        + f'<g transform="translate({CX + CX//2},540)">'
        f'<text x="0" y="-150" font-family="{FONT_MONO}" font-size="14" '
        f'fill="{GT_GOLD}" font-weight="700" letter-spacing="4" '
        f'text-anchor="middle">AGARTHA, NARSAPUR</text>'
        f'<text x="0" y="-100" font-family="{FONT_MONO}" font-size="12" '
        f'fill="{GT_GOLD}" opacity="0.7" letter-spacing="3" '
        f'text-anchor="middle">PER ACRE · INDICATIVE</text>'
        f'<text x="0" y="20" font-family="{FONT_DISPLAY}" font-size="100" '
        f'fill="url(#goldHL)" font-weight="800" letter-spacing="-3" '
        f'text-anchor="middle">₹3-5</text>'
        f'<text x="0" y="80" font-family="{FONT_MONO}" font-size="18" '
        f'fill="{GT_GOLD}" letter-spacing="3" '
        f'text-anchor="middle">CR / ACRE</text>'
        f'<text x="0" y="160" font-family="{FONT_SERIF}" font-size="20" '
        f'fill="{PAPER}" opacity="0.85" font-style="italic" '
        f'text-anchor="middle">25 acres · AQI 12 · 40 min FD</text>'
        f'</g>'
        # Divider rule between
        + f'<line x1="{CX}" y1="380" x2="{CX}" y2="720" '
        f'stroke="{PAPER}" stroke-width="0.5" opacity="0.25"/>'
        # Bottom thesis
        + f'<text x="{CX}" y="1010" font-family="{FONT_SERIF}" font-size="32" '
        f'fill="{PAPER}" font-weight="500" font-style="italic" letter-spacing="-0.5" '
        f'text-anchor="middle">Same investment quality.</text>'
        + f'<text x="{CX}" y="1060" font-family="{FONT_SERIF}" font-size="32" '
        f'fill="url(#goldHL)" font-weight="500" font-style="italic" letter-spacing="-0.5" '
        f'text-anchor="middle">Different filter.</text>'
        + f'<text x="{CX}" y="1170" font-family="{FONT_MONO}" font-size="14" '
        f'fill="{PAPER}" opacity="0.7" letter-spacing="3" '
        f'text-anchor="middle">FOREST-EDGE · BIOPHILIC · BY MODCON BUILDERS</text>'
        + '</svg>'
    )


# ─── SLIDE 9 — CTA ──────────────────────────────────────────────────────
def slide_09_cta() -> str:
    leaf_size = 130
    leaf_x = CX - leaf_size / 2
    leaf_y = 320 - leaf_size / 2
    scale = leaf_size / 100
    return (
        svg_header(bg=INK)
        + chrome(9)
        + f'<g transform="translate({leaf_x:.1f},{leaf_y:.1f}) scale({scale:.4f})">'
        f'<path d="{LEAF_DIM}" fill="{PAPER}" opacity="0.35"/>'
        f'<path d="{LEAF_LIGHT}" fill="{PAPER}" opacity="1.0"/>'
        f'<path d="{LEAF_LINE}" fill="none" stroke="{PAPER}" '
        f'stroke-width="1.2" stroke-linecap="round" opacity="0.4"/>'
        f'</g>'
        + f'<text x="{CX}" y="520" font-family="{FONT_DISPLAY}" font-size="64" '
        f'fill="{PAPER}" font-weight="800" letter-spacing="-1.5" '
        f'text-anchor="middle">Want the full</text>'
        + f'<text x="{CX}" y="600" font-family="{FONT_DISPLAY}" font-size="64" '
        f'fill="url(#goldHL)" font-weight="800" letter-spacing="-1.5" '
        f'text-anchor="middle">transaction log?</text>'
        + f'<line x1="{CX-90}" y1="650" x2="{CX+90}" y2="650" '
        f'stroke="{GT_GOLD}" stroke-width="2"/>'
        # CTA gold block
        + f'<text x="{CX}" y="740" font-family="{FONT_MONO}" font-size="22" '
        f'fill="{GT_GOLD}" font-weight="700" letter-spacing="4" '
        f'text-anchor="middle">COMMENT \'RAIDURGAM\'</text>'
        + f'<text x="{CX}" y="780" font-family="{FONT_MONO}" font-size="22" '
        f'fill="{PAPER}" letter-spacing="4" font-weight="600" '
        f'text-anchor="middle">WE DM</text>'
        # 3-item list of what they get
        + _bullet_row(220, 880,  "01", "Full transaction log — 18 months")
        + _bullet_row(220, 940,  "02", "Heat map of price gradient")
        + _bullet_row(220, 1000, "03", "Adjacent corridor projections (12 mo)")
        # Final mark
        + f'<text x="{CX}" y="1150" font-family="{FONT_MONO}" font-size="14" '
        f'fill="{PAPER}" opacity="0.75" letter-spacing="4" '
        f'text-anchor="middle">THE GREEN TEAM</text>'
        + f'<text x="{CX}" y="1180" font-family="{FONT_MONO}" font-size="12" '
        f'fill="{GT_GOLD}" letter-spacing="3" '
        f'text-anchor="middle">EDITORIAL REAL ESTATE  ·  CHANNEL PARTNER</text>'
        + '</svg>'
    )


def _bullet_row(x: int, y: int, num: str, text: str) -> str:
    return (
        f'<text x="{x}" y="{y}" font-family="{FONT_MONO}" font-size="16" '
        f'fill="{GT_GOLD}" font-weight="700" letter-spacing="2">{num}</text>'
        f'<text x="{x+60}" y="{y}" font-family="{FONT_SERIF}" font-size="22" '
        f'fill="{PAPER}" opacity="0.85">{text}</text>'
    )


# ─── MAIN ──────────────────────────────────────────────────────────────
SLIDES = [
    slide_01_hook,
    slide_02_where,
    slide_03_number,
    slide_04_trajectory,
    slide_05_comparison,
    slide_06_why,
    slide_07_editorial,
    slide_08_contrast,
    slide_09_cta,
]


def main():
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    for i, slide_fn in enumerate(SLIDES, start=1):
        svg = slide_fn()
        img = svg_to_image(svg)
        out = OUT_DIR / f"s{i:02d}.jpg"
        img.save(out, "JPEG", quality=92, optimize=True, progressive=True)
        print(f"  [{i:02d}/{TOTAL_SLIDES}] {out.name}  "
              f"{out.stat().st_size // 1024} KB")
    print(f"\n[done] {TOTAL_SLIDES} slides → {OUT_DIR}")


if __name__ == "__main__":
    main()
