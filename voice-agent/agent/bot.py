"""The Telugu voice agent pipeline.

    caller audio ──► Sarvam Saaras v3 STT (streaming, VAD + barge-in)
                 ──► Sarvam-30B
                 ──► TeluguSpeechFilter (cap turn, strip controls, normalise)
                 ──► Sarvam Bulbul v3 TTS (cloned voice)
                 ──► caller

Run it two ways:

    python -m agent.bot --transport webrtc    # week 1: browser mic, no telephony
    python -m agent.bot --transport plivo     # week 2+: real phone call

The transport is the only thing that changes between them. Everything that
decides whether the agent sounds human — the prompt, the turn cap, the
normalizer, the endpointing — is identical, so what you tune in the browser
carries over to the phone unchanged.
"""

from __future__ import annotations

import argparse
import asyncio
import os
import time

from loguru import logger

from agent.processors import CallState, build_text_filter
from agent.prompt import build_system_prompt

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


async def run_bot(transport, *, sample_rate: int, lead: dict | None = None) -> CallState:
    from pipecat.pipeline.pipeline import Pipeline
    from pipecat.pipeline.runner import PipelineRunner
    from pipecat.pipeline.task import PipelineParams, PipelineTask
    from pipecat.processors.aggregators.openai_llm_context import OpenAILLMContext

    lead = lead or {}
    state = CallState(lead_id=lead.get("id"))

    stt, llm, tts = build_services(sample_rate)

    context = OpenAILLMContext([
        {
            "role": "system",
            "content": build_system_prompt(
                project=os.getenv("AGENT_PROJECT", "agartha"),
                lead_name=lead.get("name"),
                lead_source=lead.get("source"),
            ),
        },
        # Nudge the first turn. Without this the agent waits for the caller,
        # and on an outbound call the caller is waiting for the agent.
        {"role": "user", "content": "[call connected — greet them]"},
    ])
    aggregator = llm.create_context_aggregator(context)

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


async def _main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--transport", choices=("webrtc", "plivo"), default="webrtc")
    args = parser.parse_args()

    if args.transport == "webrtc":
        from pipecat.transports.smallwebrtc.transport import SmallWebRTCTransport
        from pipecat.transports.base_transport import TransportParams
        from pipecat.audio.vad.silero import SileroVADAnalyzer

        transport = SmallWebRTCTransport(
            params=TransportParams(
                audio_in_enabled=True,
                audio_out_enabled=True,
                vad_analyzer=SileroVADAnalyzer(),
            )
        )
        logger.info("browser transport ready — open the local client and talk")
        state = await run_bot(transport, sample_rate=WEB_SAMPLE_RATE)
    else:
        raise SystemExit(
            "Plivo calls are driven by server.py, not this entrypoint. "
            "Run: uvicorn agent.server:app --port 8080"
        )

    logger.info(
        f"call ended — turns={state.turns} truncated={state.truncations} "
        f"p50_latency={state.p50_latency_ms} dnc={state.do_not_call} "
        f"booked={state.booked}"
    )


if __name__ == "__main__":
    asyncio.run(_main())
