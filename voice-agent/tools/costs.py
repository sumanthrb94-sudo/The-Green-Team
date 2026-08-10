"""Unit economics and pricing for the Telugu voice agent.

Two jobs:

    python -m tools.costs cogs           what a call-minute costs to serve
    python -m tools.costs card           margin under the Pilot/Growth/Scale card

Rates are list prices researched August 2026 and they move. The point of this
file is not the numbers — it is that after 50 real calls you replace the
assumptions with measured ones and find out whether the pricing card survives.
"""

from __future__ import annotations

import argparse
from dataclasses import dataclass

USD_INR = 88.0

# --- Vendor rates -----------------------------------------------------------
SARVAM_TTS_PER_10K_CHARS = 30.0     # Bulbul v3; v2 is ₹15
SARVAM_STT_PER_HOUR = 30.0          # Saaras v3 streaming
# sarvam-105b. sarvam-30b is deprecated. Sarvam quotes $0.80
# per 1M blended tokens; split here on a conventional 1:4 in/out ratio.
SARVAM_LLM_IN_PER_1M = 0.40 * USD_INR
SARVAM_LLM_CACHED_IN_PER_1M = 0.10 * USD_INR
SARVAM_LLM_OUT_PER_1M = 1.60 * USD_INR
GEMINI_FLASH_IN_PER_1M = 1.0 * USD_INR
GEMINI_FLASH_OUT_PER_1M = 6.0 * USD_INR
PLIVO_OUTBOUND_PER_MIN = 0.75
CLOUD_RUN_PER_MONTH = 700.0         # min-instances=1, asia-south1


@dataclass
class CallShape:
    """What one minute of conversation actually looks like.

    Defaults come from the cold-call script: the agent speaks ~35 s of a
    60 s minute, at roughly 600 characters.
    """

    tts_chars_per_min: float = 600
    stt_seconds_per_min: float = 60
    turns_per_min: float = 5
    llm_in_tokens_per_turn: float = 1500     # system prompt dominates
    llm_out_tokens_per_turn: float = 150
    cached_input_ratio: float = 0.8          # system prompt is cached

    def tts(self) -> float:
        return self.tts_chars_per_min / 10_000 * SARVAM_TTS_PER_10K_CHARS

    def stt(self) -> float:
        return self.stt_seconds_per_min / 3600 * SARVAM_STT_PER_HOUR

    def llm(self, provider: str = "sarvam") -> float:
        tin = self.llm_in_tokens_per_turn * self.turns_per_min
        tout = self.llm_out_tokens_per_turn * self.turns_per_min
        cached, fresh = tin * self.cached_input_ratio, tin * (1 - self.cached_input_ratio)

        if provider == "gemini":
            # Upper bound: this does NOT model Gemini's context caching, which
            # would cut the input side substantially. Treat the Sarvam/Gemini
            # gap as directional until week 1 measures both on real calls.
            return (tin * GEMINI_FLASH_IN_PER_1M + tout * GEMINI_FLASH_OUT_PER_1M) / 1e6
        return (
            cached * SARVAM_LLM_CACHED_IN_PER_1M
            + fresh * SARVAM_LLM_IN_PER_1M
            + tout * SARVAM_LLM_OUT_PER_1M
        ) / 1e6

    def compute(self, minutes_per_month: float) -> float:
        if minutes_per_month <= 0:
            return 0.0
        return CLOUD_RUN_PER_MONTH / minutes_per_month

    def cogs(self, *, provider: str = "sarvam",
             minutes_per_month: float = 2000) -> dict[str, float]:
        rows = {
            "TTS (Bulbul v3)": self.tts(),
            "STT (Saaras v3)": self.stt(),
            f"LLM ({provider})": self.llm(provider),
            "Telephony (Plivo)": PLIVO_OUTBOUND_PER_MIN,
            "Compute (Cloud Run)": self.compute(minutes_per_month),
        }
        rows["TOTAL"] = sum(rows.values())
        return rows


@dataclass
class Tier:
    name: str
    setup: float
    monthly: float
    included_minutes: float
    overage_per_min: float

    def margin(self, cogs_per_min: float) -> dict[str, float]:
        cost = self.included_minutes * cogs_per_min
        gross = self.monthly - cost
        return {
            "cogs_on_included": cost,
            "gross_per_month": gross,
            "margin_pct": 100 * gross / self.monthly if self.monthly else 0.0,
            "overage_margin_pct": (
                100 * (self.overage_per_min - cogs_per_min) / self.overage_per_min
            ),
            "first_year": self.setup + 12 * gross,
        }


CARD = [
    Tier("Pilot", 25_000, 7_500, 500, 9),
    Tier("Growth", 45_000, 18_000, 2_500, 7),
    Tier("Scale", 75_000, 35_000, 6_000, 5),
]


def _rupees(x: float) -> str:
    return f"₹{x:,.2f}"


def print_cogs(shape: CallShape, provider: str, minutes: float) -> None:
    rows = shape.cogs(provider=provider, minutes_per_month=minutes)
    width = max(len(k) for k in rows)
    print(f"\nCOGS per connected call-minute  ({provider} LLM, "
          f"{minutes:,.0f} min/month)\n")
    for name, value in rows.items():
        rule = "  " + "-" * (width + 12) if name == "TOTAL" else ""
        if rule:
            print(rule)
        print(f"  {name:<{width}}  {_rupees(value):>10}")
    print()


def print_card(shape: CallShape, provider: str) -> None:
    print("\nPricing card\n")
    header = f"  {'Tier':<8}{'Setup':>10}{'Monthly':>10}{'Incl min':>10}" \
             f"{'COGS':>10}{'Gross/mo':>11}{'Margin':>9}{'Yr 1':>12}"
    print(header)
    print("  " + "-" * (len(header) - 2))
    for tier in CARD:
        # Compute is amortised over that tier's own volume, so a Pilot client
        # carries more of the fixed cost per minute than a Scale client.
        cogs = shape.cogs(provider=provider,
                          minutes_per_month=tier.included_minutes)["TOTAL"]
        m = tier.margin(cogs)
        print(f"  {tier.name:<8}{tier.setup:>10,.0f}{tier.monthly:>10,.0f}"
              f"{tier.included_minutes:>10,.0f}{m['cogs_on_included']:>10,.0f}"
              f"{m['gross_per_month']:>11,.0f}{m['margin_pct']:>8.0f}%"
              f"{m['first_year']:>12,.0f}")
        print(f"  {'':<8}overage {tier.overage_per_min:.0f}/min "
              f"at {m['overage_margin_pct']:.0f}% margin")
    print("\n  Note: one human telecaller costs ₹25,000–35,000/month for ~8h/day.")
    print("  Price against that, not against other AI vendors.\n")


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("mode", choices=("cogs", "card"), nargs="?", default="cogs")
    parser.add_argument("--provider", choices=("sarvam", "gemini"), default="sarvam")
    parser.add_argument("--minutes", type=float, default=2000,
                        help="monthly connected minutes, for amortising compute")
    parser.add_argument("--chars", type=float, default=600,
                        help="TTS characters per call-minute — measure this, "
                             "it is the biggest single lever")
    args = parser.parse_args()

    shape = CallShape(tts_chars_per_min=args.chars)
    if args.mode == "cogs":
        print_cogs(shape, args.provider, args.minutes)
    else:
        print_card(shape, args.provider)


if __name__ == "__main__":
    main()
