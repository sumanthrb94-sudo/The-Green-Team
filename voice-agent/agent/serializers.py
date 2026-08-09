"""Raw PCM over a WebSocket, for browser audio without WebRTC.

Why this exists: WebRTC media is UDP, which rules out Cloud Run and forces a
VM plus a DNS record plus a certificate. A WebSocket carries the same audio
over the connection Cloud Run already terminates with a valid certificate on
its own *.run.app hostname — no DNS to configure, no VM to run.

The trade is real and worth knowing: WebRTC brings its own jitter buffer,
packet loss concealment and echo-cancellation negotiation. Over a WebSocket
we get TCP, so a lost packet becomes a stall rather than a glitch. On a decent
connection the difference is small; on a bad mobile network WebRTC degrades
more gracefully.

Wire format, deliberately trivial so the browser side needs no library:
    both directions — little-endian signed 16-bit PCM, mono, binary frames.
Sample rate is fixed by the transport's audio_in/out_sample_rate.
"""

from __future__ import annotations

from pipecat.frames.frames import (
    AudioRawFrame,
    Frame,
    InputAudioRawFrame,
    StartFrame,
)
from pipecat.serializers.base_serializer import FrameSerializer


class RawPCMSerializer(FrameSerializer):
    """Passes PCM16 straight through in both directions.

    Non-audio frames serialize to None, which the transport drops — the
    browser client has no use for pipecat's control frames, and sending them
    would mean teaching the widget a protocol.
    """

    def __init__(self, *, sample_rate: int = 16000):
        super().__init__()
        self._sample_rate = sample_rate

    @property
    def type(self) -> str:
        return "binary"

    async def setup(self, frame: StartFrame):
        # The transport tells us the rate it negotiated; trust that over the
        # constructor default.
        self._sample_rate = frame.audio_out_sample_rate or self._sample_rate

    async def serialize(self, frame: Frame) -> str | bytes | None:
        if isinstance(frame, AudioRawFrame):
            return frame.audio
        return None

    async def deserialize(self, data: str | bytes) -> Frame | None:
        if not isinstance(data, bytes) or not data:
            return None
        return InputAudioRawFrame(
            audio=data, sample_rate=self._sample_rate, num_channels=1
        )
