"""Normalise agent text into something a Telugu TTS can actually say.

Runs between the LLM and the TTS. Every engine tested — Bulbul, Chirp 3,
ElevenLabs — mangles digits, currency and initialisms inside Telugu text, and
one mangled number is enough to break the illusion on a sales call. So we
never send digits.

    >>> normalize("ధర ₹68.7 L నుంచి")
    'ధర అరవై ఎనిమిది లక్షల డెబ్బై వేల రూపాయలు నుంచి'
    >>> normalize("AQI 12 మాత్రమే")
    'ఏ. క్యూ. ఐ. పన్నెండు మాత్రమే'

Order of the rules matters: currency before bare numbers, units before bare
numbers, initialisms last so they don't eat unit abbreviations.
"""

from __future__ import annotations

import re

from .numbers import currency_to_words, digit_string_to_words, to_words

# --- English letter names in Telugu, for initialisms ------------------------
_LETTERS = {
    "A": "ఏ", "B": "బీ", "C": "సీ", "D": "డీ", "E": "ఈ", "F": "ఎఫ్",
    "G": "జీ", "H": "హెచ్", "I": "ఐ", "J": "జే", "K": "కే", "L": "ఎల్",
    "M": "ఎం", "N": "ఎన్", "O": "ఓ", "P": "పీ", "Q": "క్యూ", "R": "ఆర్",
    "S": "ఎస్", "T": "టీ", "U": "యూ", "V": "వీ", "W": "డబ్ల్యూ",
    "X": "ఎక్స్", "Y": "వై", "Z": "జెడ్",
}

# Uppercase tokens that are words, not initialisms. Anything here is left
# alone by the initialism rule (and transliterated only if asked).
_NOT_INITIALISMS = {"MODCON", "SYL", "OK", "AM", "PM", "EMI", "NRI"}

# Spoken as words even though they look like initialisms.
_ACRONYM_WORDS = {
    "SYL": "ఎస్. వై. ఎల్.",
    "EMI": "ఈ. ఎం. ఐ.",
    "NRI": "ఎన్. ఆర్. ఐ.",
}

# --- Units: (regex alternatives, Telugu noun, singular/plural is ignored) ---
_UNITS = [
    (r"sq\.?\s*yds?|sq\.?\s*yards?|square\s+yards?", "చదరపు గజాలు"),
    (r"sq\.?\s*ft|sq\.?\s*feet|SFT|sft|square\s+feet", "చదరపు అడుగులు"),
    (r"acres?", "ఎకరాలు"),
    (r"kms?|kilometers?|kilometres?", "కిలోమీటర్లు"),
    (r"mins?|minutes?", "నిమిషాలు"),
    (r"hrs?|hours?", "గంటలు"),
    (r"days?", "రోజులు"),
    (r"BHK", "బీ. హెచ్. కే."),
]

_LAKH = r"L|l|lakhs?|Lakhs?|lac|Lac"
_CRORE = r"Cr|cr|crores?|Crores?"
_RUPEE = r"(?:₹|Rs\.?|INR)\s*"
_NUM = r"\d[\d,]*(?:\.\d+)?"


def _parse_num(raw: str) -> float:
    return float(raw.replace(",", ""))


def _sub(pattern: str, repl, text: str, flags=0) -> str:
    return re.sub(pattern, repl, text, flags=flags)


def _currency_scaled(text: str) -> str:
    """₹68.7 L, Rs 1.2 Cr, ₹4,499 — including the scale suffixes."""

    def lakh(m):
        return currency_to_words(_parse_num(m.group(1)) * 100_000)

    def crore(m):
        return currency_to_words(_parse_num(m.group(1)) * 10_000_000)

    def plain(m):
        return currency_to_words(_parse_num(m.group(1)))

    text = _sub(rf"{_RUPEE}({_NUM})\s*(?:{_CRORE})\b", crore, text)
    text = _sub(rf"{_RUPEE}({_NUM})\s*(?:{_LAKH})\b", lakh, text)
    text = _sub(rf"{_RUPEE}({_NUM})", plain, text)
    # Bare "68.7 lakh" with no rupee sign still means money in this domain.
    text = _sub(rf"\b({_NUM})\s*(?:{_CRORE})\b", crore, text)
    text = _sub(rf"\b({_NUM})\s*(?:{_LAKH})\b", lakh, text)
    return text


def _units(text: str) -> str:
    for pattern, telugu in _UNITS:
        def repl(m, telugu=telugu):
            return f"{to_words(int(_parse_num(m.group(1))), terminal=False)} {telugu}"

        text = _sub(rf"\b({_NUM})\s*(?:{pattern})\b", repl, text)
    return text


def _percent(text: str) -> str:
    # No \b after % — it isn't a word character, so the boundary never matches.
    return _sub(
        rf"\b({_NUM})\s*(?:%|percent\b)",
        lambda m: f"{to_words(int(_parse_num(m.group(1))), terminal=False)} శాతం",
        text,
    )


def _clock(text: str) -> str:
    """11 AM -> ఉదయం పదకొండు గంటలకు."""

    def repl(m):
        hour = int(m.group(1))
        minute = int(m.group(2) or 0)
        # group(3) is a single letter — "A" or "P", not "AM"/"PM".
        part = "ఉదయం" if m.group(3).upper() == "A" else (
            "మధ్యాహ్నం" if hour < 4 else "సాయంత్రం"
        )
        out = f"{part} {to_words(hour)}"
        if minute:
            out += f" {to_words(minute)}"
        return f"{out} గంటలకు"

    return _sub(r"\b(\d{1,2})(?::(\d{2}))?\s*([AaPp])\.?[Mm]\.?\b",
                lambda m: repl(m), text)


def _phone_numbers(text: str) -> str:
    """10-digit runs are phone numbers — read digit by digit."""
    return _sub(r"\b(\d{10})\b", lambda m: digit_string_to_words(m.group(1)), text)


def _initialisms(text: str) -> str:
    """AQI -> ఏ. క్యూ. ఐ.  Runs of 2-5 capitals that aren't known words."""

    def repl(m):
        token = m.group(0)
        if token in _ACRONYM_WORDS:
            return _ACRONYM_WORDS[token]
        if token in _NOT_INITIALISMS:
            return token
        return " ".join(f"{_LETTERS[c]}." for c in token)

    return _sub(r"\b[A-Z]{2,5}\b", repl, text)


def _bare_numbers(text: str) -> str:
    """Whatever digits are left over."""
    return _sub(rf"\b({_NUM})\b",
                lambda m: to_words(int(_parse_num(m.group(1)))), text)


_PIPELINE = (
    _currency_scaled,
    _clock,
    _percent,
    _units,
    _phone_numbers,
    _bare_numbers,
    _initialisms,
)


def normalize(text: str) -> str:
    """Full pipeline. Idempotent — running it twice changes nothing."""
    for step in _PIPELINE:
        text = step(text)
    return re.sub(r"\s{2,}", " ", text).strip()
