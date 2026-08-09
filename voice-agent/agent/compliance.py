"""TRAI / DPDP guardrails, enforced in code rather than in a runbook.

TRAI disconnected 47,000+ numbers in Q1 2026 and its detection models look for
synthetic-voice signatures and abnormal call patterns. Penalties reach ₹10
lakh. So the two rules that are easy to get wrong under time pressure — the
calling window and the suppression list — are enforced at the point of dial,
where no scheduler bug or manual curl can route around them.
"""

from __future__ import annotations

import hashlib
import os
import re
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone

IST = timezone(timedelta(hours=5, minutes=30))

SUPPRESSION_COLLECTION = "call_suppression"


def normalise_phone(phone: str) -> str:
    """+91 98765 43210, 09876543210, 9876543210 all collapse to 919876543210.

    Suppression that only matches the exact string a caller was dialled with
    is not suppression.
    """
    digits = re.sub(r"\D", "", phone)
    digits = digits.lstrip("0")
    if len(digits) == 10:
        digits = "91" + digits
    return digits


def _doc_id(phone: str) -> str:
    """Hash the number for the document id.

    The suppression list is the one collection that exists purely to stop us
    contacting someone; storing it hashed means a leak of it cannot be used as
    a marketing list.
    """
    return hashlib.sha256(normalise_phone(phone).encode()).hexdigest()[:32]


@dataclass(frozen=True)
class CallWindow:
    """The hours during which outbound commercial calls are permitted."""

    start_hour: int = 9
    end_hour: int = 21

    @classmethod
    def from_env(cls) -> "CallWindow":
        return cls(
            start_hour=int(os.getenv("CALL_WINDOW_START", "9")),
            end_hour=int(os.getenv("CALL_WINDOW_END", "21")),
        )

    def is_open(self, now: datetime | None = None) -> bool:
        now = (now or datetime.now(IST)).astimezone(IST)
        return self.start_hour <= now.hour < self.end_hour

    def __str__(self) -> str:
        return f"{self.start_hour:02d}:00–{self.end_hour:02d}:00 IST"


def is_suppressed(db, phone: str) -> bool:
    return db.collection(SUPPRESSION_COLLECTION).document(_doc_id(phone)).get().exists


def suppress(db, phone: str, *, reason: str) -> None:
    """Add a number to the permanent do-not-call list.

    Called the moment the agent emits [[DNC]]. There is no un-suppress path in
    code on purpose — reinstating a number should require a deliberate human
    action against a consent record.
    """
    db.collection(SUPPRESSION_COLLECTION).document(_doc_id(phone)).set({
        "suppressed_at": datetime.now(timezone.utc),
        "reason": reason,
        # Last four only, so an operator can confirm a match without the
        # collection becoming a phone book.
        "hint": normalise_phone(phone)[-4:],
    })
