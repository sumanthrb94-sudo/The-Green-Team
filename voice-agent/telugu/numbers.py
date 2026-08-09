"""Telugu cardinal numbers on the Indian numbering system.

TTS engines mangle digits in Indic scripts — this is the single most common
cause of a voice agent sounding fake. Everything numeric must reach the TTS as
Telugu words, never as digits.

Scale forms follow standard Telugu usage: a scale word takes its *oblique*
form when something follows it, and its plural form when it terminates the
number.

    2,024      -> రెండు వేల ఇరవై నాలుగు      (వేల, because 24 follows)
    36,000     -> ముప్పై ఆరు వేలు             (వేలు, terminal)
    68,70,000  -> అరవై ఎనిమిది లక్షల డెబ్బై వేలు
"""

from __future__ import annotations

# 0–20 are irregular and must be listed.
_ONES = {
    0: "సున్నా",
    1: "ఒకటి",
    2: "రెండు",
    3: "మూడు",
    4: "నాలుగు",
    5: "ఐదు",
    6: "ఆరు",
    7: "ఏడు",
    8: "ఎనిమిది",
    9: "తొమ్మిది",
    10: "పది",
    11: "పదకొండు",
    12: "పన్నెండు",
    13: "పదమూడు",
    14: "పద్నాలుగు",
    15: "పదిహేను",
    16: "పదహారు",
    17: "పదిహేడు",
    18: "పద్దెనిమిది",
    19: "పంతొమ్మిది",
    20: "ఇరవై",
}

_TENS = {
    20: "ఇరవై",
    30: "ముప్పై",
    40: "నలభై",
    50: "యాభై",
    60: "అరవై",
    70: "డెబ్బై",
    80: "ఎనభై",
    90: "తొంభై",
}

# (divisor, singular, oblique — something follows, plural — terminal)
_SCALES = [
    (10_000_000, "కోటి", "కోట్ల", "కోట్లు"),
    (100_000, "లక్ష", "లక్షల", "లక్షలు"),
    (1_000, "వెయ్యి", "వేల", "వేలు"),
    (100, "వంద", "వందల", "వందలు"),
]


def _under_hundred(n: int) -> str:
    if n <= 20:
        return _ONES[n]
    tens, ones = divmod(n, 10)
    head = _TENS[tens * 10]
    return head if ones == 0 else f"{head} {_ONES[ones]}"


def to_words(n: int, *, terminal: bool = True) -> str:
    """Render ``n`` as Telugu words.

    ``terminal=False`` forces the oblique form on the final scale word, which
    is what you want when the number is followed by a noun — "ముప్పై ఆరు వేల
    చదరపు అడుగులు" (36,000 square feet), not "వేలు చదరపు అడుగులు".
    """
    if n < 0:
        return f"మైనస్ {to_words(-n, terminal=terminal)}"
    if n < 100:
        return _under_hundred(n)

    for divisor, singular, oblique, plural in _SCALES:
        if n < divisor:
            continue
        count, remainder = divmod(n, divisor)

        if count == 1:
            head = singular
        else:
            # The scale word bends if a remainder follows it, or if the caller
            # says a noun follows.
            form = oblique if (remainder or not terminal) else plural
            head = f"{to_words(count, terminal=True)} {form}"

        if remainder == 0:
            return head
        return f"{head} {to_words(remainder, terminal=terminal)}"

    raise AssertionError("unreachable")  # pragma: no cover


def currency_to_words(amount: float, *, terminal: bool = True) -> str:
    """Rupee amounts. Paise are dropped — nobody says them on a sales call."""
    rupees = int(round(amount))
    return f"{to_words(rupees, terminal=False)} రూపాయలు" if terminal else to_words(
        rupees, terminal=False
    )


def digit_string_to_words(digits: str) -> str:
    """Read a digit run one digit at a time — phone numbers, plot numbers.

    "9876" -> "తొమ్మిది ఎనిమిది ఏడు ఆరు", never "తొమ్మిది వేల ..."
    """
    return " ".join(_ONES[int(d)] for d in digits if d.isdigit())
