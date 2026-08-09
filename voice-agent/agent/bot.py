"""The Telugu voice agent pipeline.

    caller audio ──► Sarvam Saaras v3 STT (streaming, VAD + barge-in)
                 ──► Sarvam-30B
                 ──► TeluguSpeechFilter (cap turn, strip controls, normalise)
                 ──► Sarvam Bulbul v3 TTS (cloned voice)
                 ──► caller

Two transports, one pipeline:

    web    — WebRTC from the browser. Ships first: no telecom licence, no DLT,
             no DND scrubbing, because it never touches a telecom network.
    plivo  — real phone call. Needs DLT registration before any outbound dial.

The transport is the only thing that differs. Everything that decides whether
the agent sounds human — the prompt, the turn cap, the normalizer, the
endpointing — is identical, so what you tune on the website carries over to
the phone unchanged when DLT clears.

Both are served by agent/server.py:

    uvicorn agent.server:app --port 8080     # then open http://localhost:8080/
"""

from __future__ import annotations

import argparse
import os
import time

from loguru import logger

from agent.processors import CallState, build_text_filter
from agent.prompt import PORTFOLIO, build_system_prompt

# Telephony is 8 kHz μ-law. Matching it end to end avoids a resample and,
# usefully, hides TTS artifacts that are audible at 48 kHz.
TELEPHONY_SAMPLE_RATE = 8000
WEB_SAMPLE_RATE = 16000


def _require(name: str) -> str:
    value = os.getenv(name)
    if not value:
        raise SystemExit(f"{name} is not set — copy .env.example to .env")
    return value


def build_services(sample_rate: int):
    """Construct the three Sarvam services.

    Kept separate from the pipeline so the week-1 bench can swap the LLM for
    Gemini with one substitution and measure the difference.
    """
    from pipecat.services.sarvam.stt import SarvamSTTService
    from pipecat.services.sarvam.tts import SarvamTTSService
    from pipecat.transcriptions.language import Language

    api_key = _require("SARVAM_API_KEY")

    stt = SarvamSTTService(
        api_key=api_key,
        # Leave unset to take Sarvam's current default rather than pinning a
        # model name that moves.
        model=os.getenv("SARVAM_STT_MODEL") or None,
        # codemix is the whole point for this caller base — "sir, price entha"
        # must survive transcription with the English words intact.
        mode=os.getenv("SARVAM_STT_MODE", "codemix"),
        sample_rate=sample_rate,
        params=SarvamSTTService.InputParams(
            language=Language.TE_IN,
            # Sarvam's own VAD signals drive barge-in; START_SPEECH is the cue
            # to stop playback mid-sentence.
            vad_signals=True,
            high_vad_sensitivity=True,
        ),
    )

    tts = SarvamTTSService(
        api_key=api_key,
        model=os.getenv("SARVAM_TTS_MODEL", "bulbul:v3"),
        # The cloned voice id from Sarvam's console. Falls back to a stock
        # speaker so the pipeline runs before the voice actor is recorded.
        voice_id=os.getenv("SARVAM_VOICE_ID", "anushka"),
        sample_rate=sample_rate,
        params=SarvamTTSService.InputParams(
            language=Language.TE_IN,
            # We do our own normalisation — Sarvam's preprocessing would
            # second-guess text that is already Telugu words.
            enable_preprocessing=False,
            pace=float(os.getenv("TTS_PACE", "1.0")),
            # Small buffer keeps time-to-first-audio down; the tradeoff is
            # slightly choppier prosody on long sentences.
            min_buffer_size=int(os.getenv("TTS_MIN_BUFFER", "50")),
        ),
    )

    llm = _build_llm()
    return stt, llm, tts


def _build_llm():
    """Sarvam-30B by default; Gemini behind an env flag for the week-1 bench."""
    provider = os.getenv("LLM_PROVIDER", "sarvam").lower()

    if provider == "gemini":
        from pipecat.services.google.llm import GoogleLLMService

        return GoogleLLMService(
            api_key=_require("GOOGLE_API_KEY"),
            model=os.getenv("GEMINI_MODEL", "gemini-3.5-flash"),
        )

    # Sarvam exposes an OpenAI-compatible chat completions endpoint.
    from pipecat.services.openai.llm import OpenAILLMService

    return OpenAILLMService(
        api_key=_require("SARVAM_API_KEY"),
        base_url=os.getenv("SARVAM_LLM_BASE_URL", "https://api.sarvam.ai/v1"),
        model=os.getenv("SARVAM_LLM_MODEL", "sarvam-30b"),
    )


async def run_bot(
    transport,
    *,
    sample_rate: int,
    lead: dict | None = None,
    channel: str = "phone",
    project: str | None = None,
) -> CallState:
    lead = lead or {}
    state = CallState(lead_id=lead.get("id"))

    if os.getenv("AGENT_OFFLINE") == "1":
        return await _run_offline(transport, sample_rate=sample_rate, state=state)

    from pipecat.pipeline.pipeline import Pipeline
    from pipecat.pipeline.runner import PipelineRunner
    from pipecat.pipeline.task import PipelineParams, PipelineTask
    from pipecat.processors.aggregators.llm_context import LLMContext
    from pipecat.processors.aggregators.llm_response_universal import (
        LLMContextAggregatorPair,
    )

    stt, llm, tts = build_services(sample_rate)

    context = LLMContext([
        {
            "role": "system",
            "content": build_system_prompt(
                # Per-session, never from mutated global env — concurrent
                # visitors can be looking at different projects.
                project=project or os.getenv("AGENT_PROJECT", PORTFOLIO),
                lead_name=lead.get("name"),
                lead_source=lead.get("source"),
                channel=channel,
                # Empty until TG-RERA agent registration comes through. The
                # prompt then tells the agent to defer rather than invent one.
                rera_reg_no=os.getenv("RERA_AGENT_REG_NO") or None,
            ),
        },
        # Nudge the first turn. Without this both sides wait for each other.
        {"role": "user", "content": "[connected — greet them]"},
    ])
    aggregator = LLMContextAggregatorPair(context)

    pipeline = Pipeline([
        transport.input(),
        stt,
        aggregator.user(),
        llm,
        build_text_filter(state),
        tts,
        transport.output(),
        aggregator.assistant(),
    ])

    task = PipelineTask(
        pipeline,
        params=PipelineParams(
            audio_in_sample_rate=sample_rate,
            audio_out_sample_rate=sample_rate,
            allow_interruptions=True,   # barge-in
            enable_metrics=True,        # per-stage latency, see §Verification
        ),
    )

    _wire_latency_logging(task, state)
    await PipelineRunner().run(task)
    return state


async def _run_offline(transport, *, sample_rate: int, state: CallState) -> CallState:
    """Same pipeline shape with stub services — see agent/offline.py.

    No LLM context aggregator here: the scripted stand-in is a plain processor
    with no conversation history to accumulate.
    """
    from pipecat.pipeline.pipeline import Pipeline
    from pipecat.pipeline.runner import PipelineRunner
    from pipecat.pipeline.task import PipelineParams, PipelineTask

    from agent.offline import build_offline_services

    stt, llm, tts = build_offline_services(sample_rate)
    logger.warning("AGENT_OFFLINE=1 — stub services, the voice is a sine tone")

    task = PipelineTask(
        Pipeline([
            transport.input(),
            stt,
            llm,
            build_text_filter(state),
            tts,
            transport.output(),
        ]),
        params=PipelineParams(
            audio_in_sample_rate=sample_rate,
            audio_out_sample_rate=sample_rate,
            allow_interruptions=True,
        ),
    )
    _wire_latency_logging(task, state)
    state.tts = tts          # so the test can assert what reached the TTS
    await PipelineRunner().run(task)
    return state


def _wire_latency_logging(task, state: CallState) -> None:
    """Record time-to-first-audio per turn.

    The budget is sub-800 ms end to end. Logging it per turn is the only way
    to find which stage is eating it — guessing wastes days.
    """
    started: dict[str, float] = {}

    @task.event_handler("on_user_stopped_speaking")
    async def _on_user_stopped(_task):
        started["t"] = time.perf_counter()

    @task.event_handler("on_bot_started_speaking")
    async def _on_bot_started(_task):
        if "t" in started:
            ms = (time.perf_counter() - started.pop("t")) * 1000
            state.latencies_ms.append(ms)
            level = "warning" if ms > 800 else "info"
            logger.log(level.upper(), f"time-to-first-audio {ms:.0f} ms")


def build_web_transport(webrtc_connection):
    """Browser transport. Silero handles VAD here — there is no telephony
    VAD signal to lean on as there is on the Plivo leg."""
    from pipecat.audio.vad.silero import SileroVADAnalyzer
    from pipecat.transports.base_transport import TransportParams
    from pipecat.transports.smallwebrtc.transport import SmallWebRTCTransport

    return SmallWebRTCTransport(
        webrtc_connection=webrtc_connection,
        params=TransportParams(
            audio_in_enabled=True,
            audio_out_enabled=True,
            vad_analyzer=SileroVADAnalyzer(),
        ),
    )


def _main() -> None:
    argparse.ArgumentParser(description=__doc__).parse_args()
    raise SystemExit(
        "Both transports are served by the app. Run:\n"
        "    uvicorn agent.server:app --port 8080\n"
        "then open http://localhost:8080/ to talk to it in the browser."
    )


if __name__ == "__main__":
    _main()
