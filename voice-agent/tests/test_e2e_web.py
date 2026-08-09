"""End-to-end: real browser, real WebRTC, stub vendor services.

Proves the parts we own work together — signalling, transport, VAD, the
pipeline, the Telugu normalizer in the audio path, control-token extraction,
and audio actually reaching the browser. The vendor APIs are stubbed
(agent/offline.py), so this passes with no Sarvam key and no network.

What it does NOT prove: that Sarvam accepts our requests. Run
`python3 -m tools.preflight` for that.

    pytest tests/test_e2e_web.py -v        (needs: pip install playwright)
"""

from __future__ import annotations

import os
import socket
import subprocess
import sys
import time
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parents[1]
CHROME = "/opt/pw-browsers/chromium-1194/chrome-linux/chrome"

# The agent's dependencies live in the venv; the test runner may not. Prefer
# the venv interpreter for the server subprocess.
VENV_PY = ROOT / ".venv" / "bin" / "python"
AGENT_PY = str(VENV_PY) if VENV_PY.exists() else sys.executable

playwright = pytest.importorskip("playwright.sync_api", reason="playwright not installed")
from playwright.sync_api import sync_playwright  # noqa: E402


def _free_port() -> int:
    with socket.socket() as s:
        s.bind(("127.0.0.1", 0))
        return s.getsockname()[1]


@pytest.fixture(scope="module")
def agent_server():
    """Boot the agent in offline mode on a free port."""
    port = _free_port()
    env = {
        **os.environ,
        "AGENT_OFFLINE": "1",
        "SARVAM_API_KEY": "not-needed-offline",
        "ALLOWED_ORIGINS": f"http://localhost:{port}",
    }
    proc = subprocess.Popen(
        [AGENT_PY, "-m", "uvicorn", "agent.server:app",
         "--port", str(port), "--log-level", "warning"],
        cwd=ROOT, env=env, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True,
    )

    import urllib.request
    for _ in range(60):
        try:
            urllib.request.urlopen(f"http://localhost:{port}/healthz", timeout=1)
            break
        except Exception:
            if proc.poll() is not None:
                pytest.fail(f"agent died on boot:\n{proc.stdout.read()}")
            time.sleep(0.5)
    else:
        proc.kill()
        pytest.fail("agent did not come up")

    yield f"http://localhost:{port}"

    proc.terminate()
    try:
        proc.wait(timeout=10)
    except subprocess.TimeoutExpired:
        proc.kill()


@pytest.fixture(scope="module")
def page(agent_server):
    if not Path(CHROME).exists():
        pytest.skip("chromium not present")
    with sync_playwright() as p:
        browser = p.chromium.launch(
            executable_path=CHROME,
            args=[
                # Feed a synthetic tone into getUserMedia and auto-grant the
                # permission prompt, so the whole flow runs unattended.
                "--use-fake-device-for-media-stream",
                "--use-fake-ui-for-media-capture",
                "--autoplay-policy=no-user-gesture-required",
            ],
        )
        ctx = browser.new_context(permissions=["microphone"])
        pg = ctx.new_page()
        pg.goto(agent_server, wait_until="networkidle")
        yield pg
        browser.close()


def _spy_on_getusermedia(page) -> None:
    """Count getUserMedia calls so 'consent came first' is actually testable."""
    page.evaluate("""() => {
        window.__micCalls = 0;
        const orig = navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);
        navigator.mediaDevices.getUserMedia = (...a) => {
            window.__micCalls++;
            return orig(...a);
        };
    }""")


class TestWidget:
    def test_one_button_only(self, page):
        assert page.locator(".gt-va-btn").count() == 1

    def test_consent_precedes_the_microphone(self, page):
        """DPDP: notice has to come before collection, not after."""
        page.reload(wait_until="networkidle")
        _spy_on_getusermedia(page)

        page.locator(".gt-va-btn").click()
        panel = page.locator(".gt-va-panel")
        panel.wait_for(state="visible", timeout=5000)

        text = panel.inner_text()
        assert "AI voice assistant, not a person" in text
        assert "recorded" in text

        # The notice is on screen and the mic has NOT been touched yet.
        assert page.evaluate("() => window.__micCalls") == 0

        page.get_by_text("Allow mic & start").click()
        page.wait_for_function("() => window.__micCalls === 1", timeout=10000)


class TestWebSocketTransport:
    """The default web transport: PCM over a WebSocket, no UDP, Cloud Run-able."""

    def test_audio_flows_both_ways(self, page):
        page.reload(wait_until="networkidle")

        # Count bytes in each direction on the real WebSocket.
        page.evaluate("""() => {
            window.__ws = { sent: 0, received: 0, opened: false };
            const Orig = window.WebSocket;
            window.WebSocket = function (...a) {
                const sock = new Orig(...a);
                window.__ws.url = String(a[0]);
                sock.addEventListener('open', () => { window.__ws.opened = true; });
                sock.addEventListener('message', (e) => {
                    window.__ws.received += (e.data.byteLength || 0);
                });
                const send = sock.send.bind(sock);
                sock.send = (d) => { window.__ws.sent += (d.byteLength || 0); return send(d); };
                return sock;
            };
            window.WebSocket.prototype = Orig.prototype;
            window.WebSocket.OPEN = Orig.OPEN;
            window.WebSocket.CLOSED = Orig.CLOSED;
        }""")

        page.locator(".gt-va-btn").click()
        page.locator(".gt-va-panel").wait_for(state="visible", timeout=5000)
        page.get_by_text("Allow mic & start").click()

        page.wait_for_function("() => window.__ws && window.__ws.opened", timeout=20000)

        sent = received = 0
        deadline = time.time() + 30
        while time.time() < deadline:
            stats = page.evaluate("() => window.__ws")
            sent, received = stats["sent"], stats["received"]
            if sent > 0 and received > 0:
                break
            page.wait_for_timeout(500)

        assert sent > 0, "no microphone audio was sent to the agent"
        assert received > 0, "no agent audio came back"

    def test_it_uses_the_ws_endpoint_not_webrtc(self, page):
        url = page.evaluate("() => window.__ws && window.__ws.url")
        assert url and "/web/ws" in url, url


class TestWebRTCTransport:
    """Still supported for a VM deployment where jitter resilience matters."""

    def test_webrtc_connects_and_the_agent_speaks(self, page, agent_server):
        # ws is the default now, so ask for the WebRTC path explicitly.
        page.goto(f"{agent_server}/?gt_transport=webrtc", wait_until="networkidle")
        page.locator(".gt-va-btn").click()
        page.locator(".gt-va-panel").wait_for(state="visible", timeout=5000)

        # Instrument the peer connection before starting.
        page.evaluate("""() => {
            window.__stats = { connected: false, inboundBytes: 0 };
            const orig = window.RTCPeerConnection;
            window.RTCPeerConnection = function (...a) {
                const pc = new orig(...a);
                pc.addEventListener('connectionstatechange', () => {
                    if (pc.connectionState === 'connected') window.__stats.connected = true;
                });
                window.__pc = pc;
                return pc;
            };
            window.RTCPeerConnection.prototype = orig.prototype;
        }""")

        page.get_by_text("Allow mic & start").click()

        # Wait for the connection, then for audio to actually arrive.
        page.wait_for_function("() => window.__stats && window.__stats.connected",
                               timeout=30000)

        # Poll from the test rather than relying on a side effect inside
        # wait_for_function — the value has to come back across the boundary.
        read_bytes = """async () => {
            if (!window.__pc) return 0;
            const report = await window.__pc.getStats();
            let bytes = 0;
            report.forEach(s => {
                if (s.type === 'inbound-rtp' && s.kind === 'audio') {
                    bytes += s.bytesReceived || 0;
                }
            });
            return bytes;
        }"""

        received = 0
        deadline = time.time() + 30
        while time.time() < deadline:
            received = page.evaluate(read_bytes)
            if received > 0:
                break
            page.wait_for_timeout(500)

        assert received > 0, "agent audio never reached the browser"

        # One audio m-line each way. A second, unfilled one silently kills
        # both directions — that was a real bug here.
        lines = page.evaluate(
            "() => (window.__pc.remoteDescription?.sdp || '')"
            ".split('\\n').filter(l => l.startsWith('m=audio')).length"
        )
        assert lines == 1, f"expected one audio m-line, got {lines}"

        # Asserted here rather than in its own test: the status is state left
        # by this connection, and reading it from a separate test made the
        # suite order-dependent and flaky under load.
        status = page.locator(".gt-va-status").inner_text()
        assert "Listening" in status or "Speaking" in status, status
