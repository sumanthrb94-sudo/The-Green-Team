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

SENTENCE_END = re.compile(r"(.*?[.!?।])(\s+|$)", re.S)


class StreamingTurn:
    """Assembles streaming LLM tokens into speakable sentences.

    An LLM emits its answer a fragment at a time — "ధర ", "₹68", ".7 L", " నుంచి".
    Normalising each fragment on its own cannot work: the currency is split
    across three of them, so nothing matches and digits reach the TTS raw.
    Capping the turn per fragment is meaningless for the same reason.

    So buffer until a sentence completes, then normalise and release that whole
    sentence. This is also what keeps latency low — the first sentence goes to
    the TTS while the LLM is still writing the second, rather than waiting for
    the full response.
    """

    def __init__(self, *, max_words: int = MAX_WORDS,
                 max_sentences: int = MAX_SENTENCES):
        self._max_words = max_words
        self._max_sentences = max_sentences
        self.reset()

    def reset(self) -> None:
        self._buffer = ""
        self._words = 0
        self._sentences = 0
        self.controls: list[str] = []
        self.truncated = False
        self.spoken: list[str] = []

    @property
    def _full(self) -> bool:
        return (self._sentences >= self._max_sentences
                or self._words >= self._max_words)

    def add(self, text: str) -> list[str]:
        """Feed one token. Returns whatever complete sentences are now ready."""
        self._buffer += text
        return self._drain()

    def flush(self) -> list[str]:
        """End of response — release whatever is left, sentence or not."""
        ready = self._drain()
        remainder = self._buffer.strip()
        self._buffer = ""
        if remainder:
            out = self._emit(remainder)
            if out:
                ready.append(out)
        return ready

    def _drain(self) -> list[str]:
        ready: list[str] = []
        while True:
            match = SENTENCE_END.match(self._buffer)
            if not match:
                return ready
            self._buffer = self._buffer[match.end():]
            out = self._emit(match.group(1).strip())
            if out:
                ready.append(out)

    def _emit(self, sentence: str) -> str | None:
        sentence, controls = extract_controls(sentence)
        for token in controls:
            if token not in self.controls:
                self.controls.append(token)

        sentence = sentence.strip()
        if not sentence:
            return None

        # The cap is applied across the response, not per fragment. Once it is
        # reached everything further is dropped — models drift past the
        # instruction, and a monologue is the clearest tell of a bot.
        if self._full:
            self.truncated = True
            return None

        self._sentences += 1
        self._words += len(sentence.split())

        spoken = normalize(sentence)
        self.spoken.append(spoken)
        return spoken


def build_text_filter(state: CallState):
    """Return a Pipecat FrameProcessor applying the transform above.

    Sits between the LLM service and the TTS service in the pipeline. It emits
    TextFrame, not TTSSpeakFrame — TTSSpeakFrame is a one-shot "say this now"
    and issuing one per token produced fragmented speech. TextFrame lets the
    TTS service stream normally.
    """
    from loguru import logger
    from pipecat.frames.frames import (
        Frame,
        LLMFullResponseEndFrame,
        LLMFullResponseStartFrame,
        LLMTextFrame,
        TextFrame,
        TranscriptionFrame,
    )
    from pipecat.processors.frame_processor import FrameDirection, FrameProcessor

    class TeluguSpeechFilter(FrameProcessor):
        def __init__(self):
            super().__init__()
            self._turn = StreamingTurn()

        async def _say(self, sentences, direction):
            for sentence in sentences:
                logger.info(f"AGENT  » {sentence}")
                await self.push_frame(TextFrame(sentence), direction)

        async def process_frame(self, frame: Frame, direction: FrameDirection):
            await super().process_frame(frame, direction)

            # Both sides of the conversation on one line each. Without this,
            # "it isn't behaving like a real agent" is impossible to act on —
            # you cannot tell mishearing from bad wording.
            if isinstance(frame, TranscriptionFrame) and frame.text.strip():
                logger.info(f"CALLER » {frame.text.strip()}")

            elif isinstance(frame, LLMFullResponseStartFrame):
                self._turn.reset()

            elif isinstance(frame, LLMTextFrame):
                await self._say(self._turn.add(frame.text), direction)
                return          # the raw token must not reach the TTS

            elif isinstance(frame, LLMFullResponseEndFrame):
                await self._say(self._turn.flush(), direction)
                state.apply(self._turn.controls)
                state.turns += 1
                if self._turn.truncated:
                    state.truncations += 1
                    logger.info("       [turn truncated at the word cap]")
                if self._turn.controls:
                    logger.info(f"       {self._turn.controls}")

            await self.push_frame(frame, direction)

    return TeluguSpeechFilter()
