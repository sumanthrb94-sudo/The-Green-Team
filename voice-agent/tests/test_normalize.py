"""Tests for the Telugu normalizer.

Expected strings are taken from scripts/voice/modcon-telugu-cold-call.md,
which is the hand-written reference read by a native speaker. If the
normalizer disagrees with the script, the normalizer is wrong.
"""

import pytest

from telugu.normalize import normalize
from telugu.numbers import currency_to_words, digit_string_to_words, to_words


class TestNumbers:
    @pytest.mark.parametrize("n,expected", [
        (0, "సున్నా"),
        (5, "ఐదు"),
        (12, "పన్నెండు"),
        (14, "పద్నాలుగు"),
        (19, "పంతొమ్మిది"),
        (20, "ఇరవై"),
        (25, "ఇరవై ఐదు"),
        (36, "ముప్పై ఆరు"),
        (40, "నలభై"),
        (99, "తొంభై తొమ్మిది"),
    ])
    def test_under_hundred(self, n, expected):
        assert to_words(n) == expected

    @pytest.mark.parametrize("n,expected", [
        (100, "వంద"),
        (180, "వంద ఎనభై"),
        (499, "నాలుగు వందల తొంభై తొమ్మిది"),
        (808, "ఎనిమిది వందల ఎనిమిది"),
        (4499, "నాలుగు వేల నాలుగు వందల తొంభై తొమ్మిది"),
        (2024, "రెండు వేల ఇరవై నాలుగు"),
        (2500, "రెండు వేల ఐదు వందలు"),
        (8500, "ఎనిమిది వేల ఐదు వందలు"),
    ])
    def test_hundreds_and_thousands(self, n, expected):
        assert to_words(n) == expected

    def test_terminal_scale_word_bends_before_a_noun(self):
        # "36,000 sq ft" is ముప్పై ఆరు వేల చదరపు అడుగులు — వేల, not వేలు.
        assert to_words(36_000, terminal=True) == "ముప్పై ఆరు వేలు"
        assert to_words(36_000, terminal=False) == "ముప్పై ఆరు వేల"

    def test_lakhs_and_crores(self):
        assert to_words(100_000) == "లక్ష"
        assert to_words(6_870_000) == "అరవై ఎనిమిది లక్షల డెబ్బై వేలు"
        assert to_words(10_000_000) == "కోటి"
        assert to_words(12_000_000) == "కోటి ఇరవై లక్షలు"

    def test_currency(self):
        assert currency_to_words(6_870_000) == (
            "అరవై ఎనిమిది లక్షల డెబ్బై వేల రూపాయలు"
        )
        assert currency_to_words(4499) == (
            "నాలుగు వేల నాలుగు వందల తొంభై తొమ్మిది రూపాయలు"
        )

    def test_phone_digits_are_read_one_by_one(self):
        assert digit_string_to_words("9876") == "తొమ్మిది ఎనిమిది ఏడు ఆరు"


class TestCurrencyInText:
    @pytest.mark.parametrize("raw", ["₹68.7 L", "₹68.7L", "Rs 68.7 lakh", "68.7 lakh"])
    def test_lakh_suffixes(self, raw):
        assert "అరవై ఎనిమిది లక్షల డెబ్బై వేల రూపాయలు" in normalize(raw)

    def test_crore(self):
        assert normalize("₹1.2 Cr") == "కోటి ఇరవై లక్షల రూపాయలు"

    def test_comma_grouped(self):
        assert normalize("₹4,499") == (
            "నాలుగు వేల నాలుగు వందల తొంభై తొమ్మిది రూపాయలు"
        )

    def test_price_inside_a_sentence(self):
        out = normalize("ధర ₹68.7 L నుంచి మొదలు సర్")
        assert out == "ధర అరవై ఎనిమిది లక్షల డెబ్బై వేల రూపాయలు నుంచి మొదలు సర్"
        assert not any(c.isdigit() for c in out)


class TestInitialisms:
    def test_aqi(self):
        assert normalize("AQI 12") == "ఏ. క్యూ. ఐ. పన్నెండు"

    def test_rrr_and_orr(self):
        assert normalize("RRR") == "ఆర్. ఆర్. ఆర్."
        assert normalize("ORR") == "ఓ. ఆర్. ఆర్."

    def test_approval_bodies(self):
        assert normalize("HMDA") == "హెచ్. ఎం. డీ. ఏ."

    def test_brand_names_are_not_spelled_out(self):
        assert "MODCON" in normalize("MODCON Agartha")

    def test_syl_is_spelled_out(self):
        assert normalize("SYL") == "ఎస్. వై. ఎల్."


class TestUnits:
    def test_square_yards(self):
        assert normalize("808 sq yds") == "ఎనిమిది వందల ఎనిమిది చదరపు గజాలు"

    def test_square_feet_uses_oblique_scale(self):
        assert normalize("36,000 sq ft") == "ముప్పై ఆరు వేల చదరపు అడుగులు"

    def test_sft_abbreviation(self):
        assert normalize("4,500 SFT") == (
            "నాలుగు వేల ఐదు వందల చదరపు అడుగులు"
        )

    def test_acres(self):
        assert normalize("25 acres") == "ఇరవై ఐదు ఎకరాలు"

    def test_minutes(self):
        assert normalize("40 mins") == "నలభై నిమిషాలు"

    def test_percent(self):
        assert normalize("45%") == "నలభై ఐదు శాతం"


class TestClock:
    def test_morning(self):
        assert normalize("11 AM") == "ఉదయం పదకొండు గంటలకు"

    def test_evening(self):
        assert normalize("6 PM") == "సాయంత్రం ఆరు గంటలకు"


class TestPipeline:
    def test_no_digits_survive_a_realistic_turn(self):
        raw = (
            "Air quality అక్కడ AQI 12 మాత్రమే సర్ — సిటీలో 100 నుంచి 180 ఉంటుంది. "
            "Plots 808 sq yds నుంచి, ధర ₹68.7 L నుంచి మొదలు."
        )
        out = normalize(raw)
        assert not any(c.isdigit() for c in out), out
        assert "ఏ. క్యూ. ఐ. పన్నెండు" in out
        assert "ఎనిమిది వందల ఎనిమిది చదరపు గజాలు" in out

    def test_idempotent(self):
        raw = "ధర ₹68.7 L, AQI 12, 36,000 sq ft"
        once = normalize(raw)
        assert normalize(once) == once

    def test_plain_telugu_is_untouched(self):
        raw = "నమస్కారం సర్, మీకు ఒక్క నిమిషం టైం ఉందా?"
        assert normalize(raw) == raw
