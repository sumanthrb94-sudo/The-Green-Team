"""Tests for the unit economics model.

These pin the shape of the model, not the vendor rates — rates move, and when
they do these tests should be updated deliberately rather than silently.
"""

import pytest

from tools.costs import CARD, CallShape, Tier


class TestCogs:
    def test_total_is_the_sum_of_parts(self):
        rows = CallShape().cogs()
        assert rows["TOTAL"] == pytest.approx(
            sum(v for k, v in rows.items() if k != "TOTAL")
        )

    def test_tts_is_the_largest_variable_line(self):
        rows = CallShape().cogs(minutes_per_month=10_000)
        variable = {k: v for k, v in rows.items()
                    if k not in ("TOTAL", "Compute (Cloud Run)")}
        assert max(variable, key=variable.get) == "TTS (Bulbul v3)"

    def test_shorter_turns_cut_the_bill(self):
        """The 35-word turn cap is a cost lever, not just a realism one."""
        verbose = CallShape(tts_chars_per_min=600).cogs()["TOTAL"]
        terse = CallShape(tts_chars_per_min=450).cogs()["TOTAL"]
        assert verbose - terse == pytest.approx(0.45, abs=0.01)

    def test_compute_amortises_away_with_volume(self):
        low = CallShape().cogs(minutes_per_month=500)["Compute (Cloud Run)"]
        high = CallShape().cogs(minutes_per_month=20_000)["Compute (Cloud Run)"]
        assert low > high * 10

    def test_sarvam_llm_is_cheaper_than_gemini(self):
        shape = CallShape()
        assert shape.llm("sarvam") < shape.llm("gemini")

    def test_zero_volume_does_not_divide_by_zero(self):
        assert CallShape().cogs(minutes_per_month=0)["Compute (Cloud Run)"] == 0.0


class TestPricingCard:
    @pytest.mark.parametrize("tier", CARD, ids=lambda t: t.name)
    def test_every_tier_is_profitable_on_included_minutes(self, tier):
        cogs = CallShape().cogs(minutes_per_month=tier.included_minutes)["TOTAL"]
        assert tier.margin(cogs)["margin_pct"] > 40

    @pytest.mark.parametrize("tier", CARD, ids=lambda t: t.name)
    def test_overage_never_sells_below_cost(self, tier):
        cogs = CallShape().cogs(minutes_per_month=tier.included_minutes)["TOTAL"]
        assert tier.overage_per_min > cogs, (
            f"{tier.name} overage ₹{tier.overage_per_min} is below "
            f"₹{cogs:.2f} COGS — every extra minute loses money"
        )

    def test_a_loss_making_tier_is_caught(self):
        bad = Tier("Bad", 0, 1_000, 1_000, 2)
        assert bad.margin(3.42)["margin_pct"] < 0
