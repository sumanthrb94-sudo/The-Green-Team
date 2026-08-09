"""HTTP surface for the voice agent — runs on Cloud Run.

Web (ships first — no telecom licence, no DLT, never touches a telecom network):

    GET  /                 dev page for talking to the agent
    GET  /web/widget.js    embeddable widget for thegreenteam site
    POST /web/offer        WebRTC signalling; starts one browser session

Phone (needs DLT registration before any outbound dial):

    POST /calls/outbound   trigger a call to one lead (n8n / Cloud Scheduler)
    POST /plivo/answer     Plivo fetches this when a call connects; returns XML
    WS   /plivo/stream     Plivo streams call audio here, bidirectionally

Credentials: Firestore uses Application Default Credentials. On Cloud Run that
means attaching a service account to the service — there is no key file to
leak. Never mount a service-account JSON here.
"""

from __future__ import annotations

import asyncio
import os
from datetime import datetime, timezone
from pathlib import Path

from fastapi import FastAPI, HTTPException, Request, WebSocket
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse, JSONResponse, Response
from loguru import logger
from pydantic import BaseModel

from agent.compliance import CallWindow, is_suppressed, suppress

app = FastAPI(title="Green Team voice agent")

# The widget is embedded on thegreenteam site, which is a different origin
# from Cloud Run. Keep this list explicit — a wildcard here would let any
# site mount your agent and spend your Sarvam credits.
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        o.strip()
        for o in os.getenv(
            "ALLOWED_ORIGINS",
            "http://localhost:3000,http://localhost:8080",
        ).split(",")
        if o.strip()
    ],
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

STATIC = Path(__file__).parent / "web"

PUBLIC_HOST = os.getenv("PUBLIC_HOST", "")           # e.g. agent-xyz.run.app
PLIVO_FROM = os.getenv("PLIVO_FROM_NUMBER", "")
CALL_WINDOW = CallWindow.from_env()


# --- Firestore --------------------------------------------------------------

def _db():
    """Lazily build a Firestore client from ADC."""
    from google.cloud import firestore

    return firestore.Client(project=os.getenv("GOOGLE_CLOUD_PROJECT"))


# --- Web (WebRTC) -----------------------------------------------------------
# This path carries no telecom exposure: it never touches a telecom network,
# so no DLT registration, 140-series number or DND scrub applies. The AI
# disclosure and DPDP obligations do still apply, and both are handled — the
# disclosure is in the agent's opening line, consent is captured by the widget
# before the microphone is opened.

_sessions: dict[str, object] = {}


class WebOffer(BaseModel):
    sdp: str
    type: str
    pc_id: str | None = None
    project: str | None = None


@app.post("/web/offer")
async def web_offer(offer: WebOffer):
    """WebRTC signalling. One POST per browser session."""
    from pipecat.transports.smallwebrtc.connection import SmallWebRTCConnection

    from agent.bot import WEB_SAMPLE_RATE, build_web_transport, run_bot

    if offer.pc_id and offer.pc_id in _sessions:
        # Renegotiation of an existing session (network change, ICE restart).
        connection = _sessions[offer.pc_id]
        await connection.renegotiate(sdp=offer.sdp, type=offer.type)
        return connection.get_answer()

    if len(_sessions) >= int(os.getenv("MAX_WEB_SESSIONS", "20")):
        raise HTTPException(status_code=503, detail="all agents are busy")

    connection = SmallWebRTCConnection()
    await connection.initialize(sdp=offer.sdp, type=offer.type)

    @connection.event_handler("closed")
    async def _on_closed(conn):
        _sessions.pop(conn.pc_id, None)

    answer = connection.get_answer()
    _sessions[answer["pc_id"]] = connection

    transport = build_web_transport(connection)
    lead = {"source": "website"}

    async def _run():
        try:
            state = await run_bot(
                transport,
                sample_rate=WEB_SAMPLE_RATE,
                lead=lead,
                channel="web",
                # Page the visitor is on; falls back to the whole portfolio.
                project=offer.project or None,
            )
            await _record_web_session(state)
        except Exception:
            logger.exception("web session failed")
        finally:
            _sessions.pop(answer["pc_id"], None)

    asyncio.create_task(_run())
    return answer


async def _record_web_session(state) -> None:
    """Log the outcome. No phone number involved, so nothing to suppress."""
    _db().collection("web_sessions").add({
        "created_at": datetime.now(timezone.utc),
        "turns": state.turns,
        "booked": state.booked,
        "transfer_requested": state.transfer_requested,
        "p50_latency_ms": state.p50_latency_ms,
        "truncations": state.truncations,
    })


@app.get("/web/widget.js")
async def widget_js():
    return Response(
        content=(STATIC / "widget.js").read_text(),
        media_type="application/javascript",
        headers={"Cache-Control": "public, max-age=300"},
    )


@app.get("/", response_class=HTMLResponse)
async def dev_page():
    return (STATIC / "index.html").read_text()


# --- Outbound trigger -------------------------------------------------------

class OutboundRequest(BaseModel):
    lead_id: str
    phone: str
    name: str | None = None
    source: str | None = None
    project: str = "agartha"


@app.post("/calls/outbound")
async def start_outbound(req: OutboundRequest):
    """Place one call. Refuses outside the legal window or to suppressed numbers.

    Both checks live here rather than in the caller, so no scheduler bug or
    manual curl can dial a number that has opted out.
    """
    if not CALL_WINDOW.is_open():
        raise HTTPException(
            status_code=409,
            detail=f"outside the permitted calling window {CALL_WINDOW}",
        )

    if is_suppressed(_db(), req.phone):
        logger.warning(f"refused call to suppressed number ending {req.phone[-4:]}")
        raise HTTPException(status_code=403, detail="number is on the suppression list")

    import plivo

    client = plivo.RestClient(
        os.environ["PLIVO_AUTH_ID"], os.environ["PLIVO_AUTH_TOKEN"]
    )
    response = client.calls.create(
        from_=PLIVO_FROM,
        to_=req.phone,
        answer_url=f"https://{PUBLIC_HOST}/plivo/answer?lead_id={req.lead_id}",
        answer_method="POST",
    )

    _db().collection("calls").document(response["request_uuid"]).set({
        "lead_id": req.lead_id,
        "phone": req.phone,
        "project": req.project,
        "direction": "outbound",
        "status": "dialing",
        "created_at": datetime.now(timezone.utc),
    })

    return JSONResponse({"call_uuid": response["request_uuid"]})


# --- Plivo callbacks --------------------------------------------------------

@app.post("/plivo/answer")
async def plivo_answer(request: Request):
    """Tell Plivo to open a bidirectional audio stream to our WebSocket."""
    lead_id = request.query_params.get("lead_id", "")
    stream_url = f"wss://{PUBLIC_HOST}/plivo/stream?lead_id={lead_id}"

    xml = f"""<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Stream bidirectional="true"
            streamTimeout="600"
            keepCallAlive="true"
            contentType="audio/x-mulaw;rate=8000">{stream_url}</Stream>
</Response>"""
    return Response(content=xml, media_type="application/xml")


@app.websocket("/plivo/stream")
async def plivo_stream(websocket: WebSocket):
    """Run one call's pipeline over the Plivo audio stream."""
    await websocket.accept()
    lead_id = websocket.query_params.get("lead_id")

    import json

    from pipecat.serializers.plivo import PlivoFrameSerializer
    from pipecat.transports.websocket.fastapi import (
        FastAPIWebsocketParams,
        FastAPIWebsocketTransport,
    )
    from pipecat.audio.vad.silero import SileroVADAnalyzer

    from agent.bot import TELEPHONY_SAMPLE_RATE, run_bot

    # Plivo's first frame carries the stream and call ids. The serializer
    # needs both — the call id so it can hang up the leg when we're done.
    start = json.loads(await websocket.receive_text())
    stream_id = start.get("start", {}).get("streamId") or start.get("streamId")
    call_id = start.get("start", {}).get("callId") or start.get("callId")
    if not stream_id:
        logger.error(f"no streamId in Plivo start frame: {start}")
        await websocket.close(code=1002)
        return

    lead = {}
    if lead_id:
        snap = _db().collection("leads").document(lead_id).get()
        if snap.exists:
            lead = {"id": lead_id, **snap.to_dict()}

    transport = FastAPIWebsocketTransport(
        websocket=websocket,
        params=FastAPIWebsocketParams(
            audio_in_enabled=True,
            audio_out_enabled=True,
            add_wav_header=False,
            vad_analyzer=SileroVADAnalyzer(),
            serializer=PlivoFrameSerializer(
                stream_id=stream_id,
                call_id=call_id,
                auth_id=os.getenv("PLIVO_AUTH_ID"),
                auth_token=os.getenv("PLIVO_AUTH_TOKEN"),
            ),
        ),
    )

    state = await run_bot(
        transport, sample_rate=TELEPHONY_SAMPLE_RATE, lead=lead, channel="phone"
    )
    await _write_outcome(lead_id, state)


async def _write_outcome(lead_id: str | None, state) -> None:
    """Persist what happened, and honour a do-not-call immediately."""
    db = _db()

    if state.do_not_call and lead_id:
        snap = db.collection("leads").document(lead_id).get()
        phone = (snap.to_dict() or {}).get("phone") if snap.exists else None
        if phone:
            suppress(db, phone, reason="caller requested do-not-call")
            logger.info("number suppressed on caller request")

    if not lead_id:
        return

    db.collection("leads").document(lead_id).set(
        {
            "last_call_at": datetime.now(timezone.utc),
            "last_call_outcome": (
                "dnc" if state.do_not_call
                else "transfer" if state.transfer_requested
                else "booked" if state.booked
                else "completed"
            ),
            "last_call_turns": state.turns,
            "last_call_p50_latency_ms": state.p50_latency_ms,
        },
        merge=True,
    )


@app.get("/healthz")
async def healthz():
    return {"ok": True, "window_open": CALL_WINDOW.is_open()}
