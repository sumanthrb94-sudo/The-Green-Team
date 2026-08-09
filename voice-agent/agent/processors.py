"""Pipeline processors that sit between the LLM and the TTS.

Three jobs, in order:

1. Strip control tokens ([[DNC]], [[TRANSFER]], [[BOOKED]]) and raise them as
   call events, so the caller never hears them.
2. Enforce the turn-length cap. The prompt asks for 2 sentences; models drift,
   and a 20-second monologue is the clearest tell that a caller is talking to
   a bot. So we truncate rather than trust.
3. Normalise digits, currency and initialisms into Telugu words.

These are framework-agnostic — pure functions plus thin Pipecat wrappers — so
they stay unit-testable without standing up a pipeline.
"""

from __future__ import annotations

import re
from dataclasses import dataclass, field

from agent.prompt import extract_controls
from telugu.normalize import normalize

MAX_WORDS = 35
MAX_SENTENCES = 2

_SENTENCE_END = re.compile(r"(?<=[.!?।])\s+")


def cap_turn(text: str, *, max_words: int = MAX_WORDS,
             max_sentences: int = MAX_SENTENCES) -> tuple[str, bool]:
    """Trim an over-long turn at a sentence boundary.

    Returns (text, was_truncated). Truncating mid-sentence would sound like a
    dropped call, so we keep whole sentences and accept going slightly over
    the word cap on the last one.
    """
    sentences = [s for s in _SENTENCE_END.split(text.strip()) if s]
    if not sentences:
        return text.strip(), False

    kept: list[str] = []
    words = 0
    for sentence in sentences[:max_sentences]:
        n = len(sentence.split())
        if kept and words + n > max_words:
            break
        kept.append(sentence)
        words += n

    out = " ".join(kept)
    return out, out != text.strip()


def prepare_for_speech(text: str) -> tuple[str, list[str], bool]:
    """Full LLM-output → TTS-input transform.

    Returns (speakable_text, control_tokens, was_truncated).
    """
    text, controls = extract_controls(text)
    text, truncated = cap_turn(text)
    return normalize(text), controls, truncated


@dataclass
class CallState:
    """What the pipeline needs to remember about one call."""

    lead_id: str | None = None
    do_not_call: bool = False
    transfer_requested: bool = False
    booked: bool = False
    truncations: int = 0
    turns: int = 0
    latencies_ms: list[float] = field(default_factory=list)
    # Set only in offline mode, so a test can inspect what reached the TTS.
    tts: object | None = None

    def apply(self, controls: list[str]) -> None:
        if "[[DNC]]" in controls:
            self.do_not_call = True
        if "[[TRANSFER]]" in controls:
            self.transfer_requested = True
        if "[[BOOKED]]" in controls:
            self.booked = True

    @property
    def should_hang_up(self) -> bool:
        return self.do_not_call

    @property
    def p50_latency_ms(self) -> float | None:
        if not self.latencies_ms:
            return None
        ordered = sorted(self.latencies_ms)
        return ordered[len(ordered) // 2]


# --- Pipecat wrapper --------------------------------------------------------
# Imported lazily so the pure functions above stay testable without pipecat
# installed.

def build_text_filter(state: CallState):
    """Return a Pipecat FrameProcessor applying the transform above.

    Sits between the LLM service and the TTS service in the pipeline.
    """
    from pipecat.frames.frames import Frame, TTSSpeakFrame, LLMTextFrame
    from pipecat.processors.frame_processor import FrameDirection, FrameProcessor

    class TeluguSpeechFilter(FrameProcessor):
        async def process_frame(self, frame: Frame, direction: FrameDirection):
            await super().process_frame(frame, direction)

            if isinstance(frame, LLMTextFrame) and frame.text.strip():
                speakable, controls, truncated = prepare_for_speech(frame.text)
                state.apply(controls)
                state.turns += 1
                if truncated:
                    state.truncations += 1
                if speakable:
                    await self.push_frame(TTSSpeakFrame(speakable), direction)
                return

            await self.push_frame(frame, direction)

    return TeluguSpeechFilter()
