"""HTTP surface for the voice agent — runs on Cloud Run.

Three endpoints:

    POST /calls/outbound   trigger a call to one lead (called by n8n/Scheduler)
    POST /plivo/answer     Plivo fetches this when a call connects; returns XML
    WS   /plivo/stream     Plivo streams call audio here, bidirectionally

Credentials: Firestore uses Application Default Credentials. On Cloud Run that
means attaching a service account to the service — there is no key file to
leak. Never mount a service-account JSON here.
"""

from __future__ import annotations

import os
from datetime import datetime, timezone

from fastapi import FastAPI, HTTPException, Request, WebSocket
from fastapi.responses import JSONResponse, Response
from loguru import logger
from pydantic import BaseModel

from agent.compliance import CallWindow, is_suppressed, suppress

app = FastAPI(title="Green Team voice agent")

PUBLIC_HOST = os.getenv("PUBLIC_HOST", "")           # e.g. agent-xyz.run.app
PLIVO_FROM = os.getenv("PLIVO_FROM_NUMBER", "")
CALL_WINDOW = CallWindow.from_env()


# --- Firestore --------------------------------------------------------------

def _db():
    """Lazily build a Firestore client from ADC."""
    from google.cloud import firestore

    return firestore.Client(project=os.getenv("GOOGLE_CLOUD_PROJECT"))


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

    state = await run_bot(transport, sample_rate=TELEPHONY_SAMPLE_RATE, lead=lead)
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
