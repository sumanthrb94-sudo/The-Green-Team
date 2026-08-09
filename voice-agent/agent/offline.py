"""Stub STT / LLM / TTS so the pipeline can be exercised without vendor APIs.

Enabled with AGENT_OFFLINE=1. Used by tests/test_e2e_web.py to prove the parts
we own — WebRTC signalling, transport, pipeline wiring, the Telugu text filter,
control-token handling and audio egress — independently of whether Sarvam is
reachable or the key is valid.

This is not a demo mode. The voice is a sine tone. It answers exactly one
question: does everything except the vendor work?
"""

from __future__ import annotations

import math
import struct
from collections.abc import AsyncGenerator

from pipecat.frames.frames import (
    Frame,
    LLMFullResponseEndFrame,
    LLMFullResponseStartFrame,
    LLMTextFrame,
    TTSAudioRawFrame,
    TTSStartedFrame,
    TTSStoppedFrame,
    TranscriptionFrame,
)
from pipecat.processors.frame_processor import FrameDirection, FrameProcessor
from pipecat.services.stt_service import STTService
from pipecat.services.tts_service import TTSService
from pipecat.utils.time import time_now_iso8601
from loguru import logger


class EchoSTT(STTService):
    """Turns any audio into a fixed Telugu utterance.

    Real STT needs enough speech to endpoint; this fires on the first buffer
    so the test doesn't depend on synthesising realistic Telugu audio.
    """

    def __init__(self, *, utterance: str = "ధర ఎంత సర్?", **kwargs):
        # pipecat validates that every settings field is initialised; stubs
        # support none of them, so declare them explicitly as None.
        kwargs.setdefault("model", None)
        kwargs.setdefault("language", None)
        super().__init__(**kwargs)
        self._utterance = utterance
        self._fired = False

    async def run_stt(self, audio: bytes) -> AsyncGenerator[Frame | None, None]:
        if self._fired or len(audio) < 640:
            yield None
            return
        self._fired = True
        yield TranscriptionFrame(
            self._utterance, "", time_now_iso8601(), None
        )


class ScriptedLLM(FrameProcessor):
    """Replies with a fixed line containing digits and a control token.

    Both are deliberate: the digits prove the normalizer is in the path, and
    the token proves control extraction runs before anything reaches the TTS.
    """

    REPLY = "ధర ₹68.7 L నుంచి సర్. సైట్ విజిట్ book చేయనా? [[BOOKED]]"

    def __init__(self, reply: str | None = None):
        super().__init__()
        self._reply = reply or self.REPLY

    async def process_frame(self, frame: Frame, direction: FrameDirection):
        await super().process_frame(frame, direction)

        if isinstance(frame, TranscriptionFrame):
            await self.push_frame(LLMFullResponseStartFrame(), direction)
            await self.push_frame(LLMTextFrame(self._reply), direction)
            await self.push_frame(LLMFullResponseEndFrame(), direction)
            return

        await self.push_frame(frame, direction)


class ToneTTS(TTSService):
    """Emits a 440 Hz tone, one 20 ms frame per 2 characters of text.

    Length tracks the text so a test can assert the *normalised* string —
    not the raw one — is what reached the TTS.
    """

    def __init__(self, *, sample_rate: int = 16000, **kwargs):
        kwargs.setdefault("model", None)
        kwargs.setdefault("voice_id", None)
        kwargs.setdefault("language", None)
        super().__init__(sample_rate=sample_rate, **kwargs)
        self.spoken: list[str] = []

    def can_generate_metrics(self) -> bool:
        return False

    async def run_tts(self, text: str, context_id: str) -> AsyncGenerator[Frame | None, None]:
        self.spoken.append(text)
        # Shows the normalised string — digits and initialisms already turned
        # into Telugu words — which is what a real TTS would receive.
        logger.info(f"[offline tts] {text}")
        await self.start_ttfb_metrics()
        yield TTSStartedFrame()

        rate = self.sample_rate
        samples_per_frame = rate // 50          # 20 ms
        frames = max(1, len(text) // 2)
        phase = 0

        for _ in range(frames):
            buf = bytearray()
            for _ in range(samples_per_frame):
                value = int(8000 * math.sin(2 * math.pi * 440 * phase / rate))
                buf += struct.pack("<h", value)
                phase += 1
            yield TTSAudioRawFrame(bytes(buf), rate, 1)

        yield TTSStoppedFrame()


def build_offline_services(sample_rate: int):
    """Drop-in replacement for bot.build_services."""
    return (
        EchoSTT(sample_rate=sample_rate),
        ScriptedLLM(),
        ToneTTS(sample_rate=sample_rate),
    )
