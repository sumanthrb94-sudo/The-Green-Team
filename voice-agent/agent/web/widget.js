/**
 * Telugu voice agent widget for thegreenteam site.
 *
 *   <script src="https://<agent-host>/web/widget.js"
 *           data-agent-host="https://<agent-host>"
 *           data-project="agartha"></script>
 *
 * Two things here are compliance, not decoration, and must not be removed:
 *
 *  1. The consent panel appears BEFORE getUserMedia is called. Under the DPDP
 *     Act voice is personal data, and notice has to precede collection — not
 *     sit in a policy page the visitor never opens.
 *  2. The panel states plainly that the agent is AI. IT Rules 2026 treat a
 *     cloned voice as synthetically generated information requiring
 *     disclosure, and the agent also says so in its opening line.
 */
(function () {
  "use strict";

  // The host page may evaluate this script more than once — React StrictMode
  // re-runs effects in dev, and a SPA can remount the loader on navigation.
  // Mounting twice would put two call buttons on the page, so the guard lives
  // here rather than in any one host framework's loader.
  if (window.__gtVoiceAgentMounted) return;
  window.__gtVoiceAgentMounted = true;

  const script = document.currentScript;
  const HOST = (script && script.dataset.agentHost) || window.location.origin;
  const PROJECT = (script && script.dataset.project) || "agartha";
  const RERA = (script && script.dataset.rera) || "";

  // "ws" (default) streams PCM over a WebSocket — works on any HTTPS host
  // including Cloud Run, so no VM, no DNS record, no certificate to manage.
  // "webrtc" needs UDP and therefore a VM, but degrades better on bad
  // networks. Same pipeline behind both.
  // ?gt_transport=webrtc overrides the tag, so both can be compared on a live
  // page without a redeploy.
  const TRANSPORT =
    new URLSearchParams(window.location.search).get("gt_transport") ||
    (script && script.dataset.transport) ||
    "ws";
  const SAMPLE_RATE = 16000;

  const COPY = {
    launcher: "మాట్లాడండి",
    launcherSub: "Talk to us",
    title: "Talk to our AI assistant",
    consent: [
      "You'll be speaking with an AI voice assistant, not a person.",
      "It can answer questions about the property and book a site visit.",
      "Your microphone audio and a transcript are recorded so we can follow up and improve the service.",
    ],
    start: "Allow mic & start",
    cancel: "Not now",
    connecting: "Connecting…",
    listening: "Listening — start speaking",
    speaking: "Speaking…",
    ended: "Call ended",
    denied: "Microphone permission is needed to talk. You can still call us.",
    busy: "All assistants are busy right now. Please try again shortly.",
    error: "Could not connect. Please try again.",
    end: "End",
  };

  const CSS = `
  .gt-va, .gt-va * { box-sizing: border-box; font-family: ui-sans-serif, -apple-system, "Segoe UI", Roboto, sans-serif; }
  /* Sits above the site's existing bottom-right control (48px FAB at
     bottom-8 right-8 on desktop, bottom-20 on mobile) rather than on top of
     it. Override with data-offset-bottom if that button ever moves. */
  .gt-va { position: fixed; right: 20px; bottom: var(--gt-va-bottom, 96px);
           z-index: 2147483000; }
  @media (max-width: 767px) { .gt-va { bottom: var(--gt-va-bottom, 144px); } }
  .gt-va-btn { display: flex; align-items: center; gap: 10px; padding: 13px 20px; border: 0;
    border-radius: 999px; background: #2d3a1d; color: #faf9f6; cursor: pointer;
    box-shadow: 0 6px 24px rgba(26,36,16,.28); font-size: 15px; font-weight: 600; }
  .gt-va-btn:hover { background: #3d4c28; }
  .gt-va-btn:focus-visible { outline: 3px solid #b8860b; outline-offset: 2px; }
  .gt-va-btn small { font-weight: 400; opacity: .75; font-size: 12px; }
  .gt-va-panel { width: 330px; background: #faf9f6; color: #1a2410; border: 1px solid #d5d8cb;
    border-radius: 14px; padding: 20px; box-shadow: 0 12px 40px rgba(26,36,16,.22); }
  .gt-va-panel h3 { margin: 0 0 12px; font-size: 16px; font-weight: 700; }
  .gt-va-panel ul { margin: 0 0 16px; padding-left: 18px; font-size: 13.5px; line-height: 1.55; color: #3d4636; }
  .gt-va-panel li { margin-bottom: 6px; }
  .gt-va-row { display: flex; gap: 8px; }
  .gt-va-primary { flex: 1; padding: 10px; border: 0; border-radius: 8px; background: #2d3a1d;
    color: #faf9f6; font-weight: 600; cursor: pointer; font-size: 14px; }
  .gt-va-ghost { padding: 10px 14px; border: 1px solid #d5d8cb; border-radius: 8px;
    background: transparent; color: #3d4636; cursor: pointer; font-size: 14px; }
  .gt-va-status { display: flex; align-items: center; gap: 10px; font-size: 14px; margin: 4px 0 16px; }
  .gt-va-dot { width: 10px; height: 10px; border-radius: 50%; background: #8c9c8c; flex: none; }
  .gt-va-dot.live { background: #4a7c3d; animation: gt-va-pulse 1.4s ease-in-out infinite; }
  .gt-va-dot.talk { background: #b8860b; }
  @keyframes gt-va-pulse { 0%,100% { opacity: 1 } 50% { opacity: .35 } }
  @media (prefers-reduced-motion: reduce) { .gt-va-dot.live { animation: none } }
  .gt-va-fine { font-size: 11.5px; color: #6b7363; margin-top: 12px; line-height: 1.5; }
  `;

  let pc = null;
  let stream = null;
  let pcId = null;
  let ws = null;
  let audioCtx = null;
  let playHead = 0;

  function el(tag, cls, text) {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text) n.textContent = text;
    return n;
  }

  function mount() {
    if (document.querySelector(".gt-va")) return;

    const style = el("style");
    style.textContent = CSS;
    document.head.appendChild(style);

    const root = el("div", "gt-va");
    const offset = script && script.dataset.offsetBottom;
    if (offset) root.style.setProperty("--gt-va-bottom", offset);

    const launcher = el("button", "gt-va-btn");
    launcher.type = "button";
    launcher.setAttribute("aria-label", COPY.title);
    launcher.append(COPY.launcher, el("small", null, COPY.launcherSub));
    launcher.addEventListener("click", () => showConsent(root, launcher));
    root.appendChild(launcher);
    document.body.appendChild(root);
  }

  function showConsent(root, launcher) {
    launcher.remove();
    const panel = el("div", "gt-va-panel");
    panel.appendChild(el("h3", null, COPY.title));

    const list = el("ul");
    COPY.consent.forEach((line) => list.appendChild(el("li", null, line)));
    panel.appendChild(list);

    const row = el("div", "gt-va-row");
    const start = el("button", "gt-va-primary", COPY.start);
    const cancel = el("button", "gt-va-ghost", COPY.cancel);
    row.append(start, cancel);
    panel.appendChild(row);

    if (RERA) {
      panel.appendChild(el("div", "gt-va-fine", "RERA Agent Reg. " + RERA));
    }

    cancel.addEventListener("click", () => {
      panel.remove();
      root.appendChild(launcher);
    });
    start.addEventListener("click", () => connect(root, panel, launcher));

    root.appendChild(panel);
    start.focus();
  }

  async function connect(root, panel, launcher) {
    panel.innerHTML = "";
    panel.appendChild(el("h3", null, COPY.title));

    const status = el("div", "gt-va-status");
    const dot = el("span", "gt-va-dot");
    const label = el("span", null, COPY.connecting);
    status.append(dot, label);
    panel.appendChild(status);

    const end = el("button", "gt-va-ghost", COPY.end);
    end.addEventListener("click", () => teardown(root, panel, launcher, label, dot));
    panel.appendChild(end);

    // Create the AudioContext synchronously, while the click that got us here
    // still counts as user activation. Created after the getUserMedia await it
    // can come up suspended, and then nothing is ever audible.
    if (TRANSPORT === "ws" && !audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)({
        sampleRate: SAMPLE_RATE,
      });
      // Exposed so the e2e suite can assert playback really started; the
      // byte count alone hid a scheduler bug that made everything inaudible.
      window.__gtAudioCtx = audioCtx;
      window.__gtScheduled = 0;
      audioCtx.resume().catch(() => {});
    }

    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true },
      });
    } catch (err) {
      label.textContent = COPY.denied;
      return;
    }

    if (TRANSPORT === "ws") {
      try {
        await connectWebSocket(dot, label);
      } catch (err) {
        console.warn("[VoiceAgent]", err);
        label.textContent = COPY.error;
      }
      return;
    }

    pc = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    });

    // addTrack creates a sendrecv transceiver, which already carries the
    // agent's audio back. Adding a second recvonly transceiver produces a
    // second audio m-line that the answerer does not fill — ontrack then
    // never fires and no audio flows in either direction.
    stream.getTracks().forEach((t) => pc.addTrack(t, stream));

    const remote = new Audio();
    remote.autoplay = true;
    pc.ontrack = (e) => {
      remote.srcObject = e.streams[0];
      dot.className = "gt-va-dot talk";
      label.textContent = COPY.speaking;
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === "connected") {
        dot.className = "gt-va-dot live";
        label.textContent = COPY.listening;
      } else if (["failed", "closed", "disconnected"].includes(pc.connectionState)) {
        dot.className = "gt-va-dot";
        label.textContent = COPY.ended;
      }
    };

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    // Wait for ICE gathering so the offer carries candidates — simpler than
    // trickling them, and fast enough on a single STUN server.
    await new Promise((resolve) => {
      if (pc.iceGatheringState === "complete") return resolve();
      const check = () => {
        if (pc.iceGatheringState === "complete") {
          pc.removeEventListener("icegatheringstatechange", check);
          resolve();
        }
      };
      pc.addEventListener("icegatheringstatechange", check);
      setTimeout(resolve, 2000);
    });

    let answer;
    try {
      const res = await fetch(HOST + "/web/offer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sdp: pc.localDescription.sdp,
          type: pc.localDescription.type,
          pc_id: pcId,
          project: PROJECT,
        }),
      });
      if (res.status === 503) {
        label.textContent = COPY.busy;
        return;
      }
      if (!res.ok) throw new Error("offer rejected: " + res.status);
      answer = await res.json();
    } catch (err) {
      label.textContent = COPY.error;
      return;
    }

    pcId = answer.pc_id;
    await pc.setRemoteDescription(answer);
  }

  /**
   * PCM16 over a WebSocket. Mic → AudioWorklet → binary frames up;
   * binary frames down → scheduled AudioBuffers.
   */
  async function connectWebSocket(dot, label) {
    // Normally created in connect() during the click; this is the fallback.
    // Asking for the wire rate avoids resampling in either direction.
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)({
        sampleRate: SAMPLE_RATE,
      });
    }
    await audioCtx.resume().catch(() => {});
    if (audioCtx.state !== "running") {
      console.warn(
        "[VoiceAgent] AudioContext is " + audioCtx.state +
        " — the browser is blocking playback. Click the page and retry.",
      );
    }
    playHead = 0;

    const url = new URL(HOST.replace(/^http/, "ws").replace(/\/$/, "") + "/web/ws");
    if (PROJECT) url.searchParams.set("project", PROJECT);

    ws = new WebSocket(url);
    ws.binaryType = "arraybuffer";

    await new Promise((resolve, reject) => {
      ws.onopen = resolve;
      ws.onerror = () => reject(new Error("websocket failed to open"));
      setTimeout(() => reject(new Error("websocket timed out")), 15000);
    });

    dot.className = "gt-va-dot live";
    label.textContent = COPY.listening;

    // --- playback ---
    // Chunks arrive roughly every 20 ms. Scheduling each one to start "now"
    // means any network jitter lands it in the past, where browsers drop it
    // silently — you see activity and hear nothing. So keep a lookahead
    // cushion and schedule strictly back to back from it.
    const JITTER_SECONDS = 0.2;
    let idleTimer = null;
    let logged = false;

    const goIdle = () => {
      dot.className = "gt-va-dot live";
      label.textContent = COPY.listening;
    };

    ws.onmessage = async (event) => {
      if (!(event.data instanceof ArrayBuffer) || !audioCtx) return;

      // An AudioContext created after an await can come up suspended, because
      // the user-activation that authorised it has already been consumed.
      if (audioCtx.state !== "running") {
        try { await audioCtx.resume(); } catch (err) { /* reported below */ }
      }

      const pcm = new Int16Array(event.data);
      if (!pcm.length) return;

      if (!logged) {
        logged = true;
        console.info(
          `[VoiceAgent] audio in: ${pcm.length} samples/chunk, ` +
          `ctx ${audioCtx.state} @ ${audioCtx.sampleRate} Hz`,
        );
      }

      const buffer = audioCtx.createBuffer(1, pcm.length, SAMPLE_RATE);
      const channel = buffer.getChannelData(0);
      for (let i = 0; i < pcm.length; i++) channel[i] = pcm[i] / 32768;

      const source = audioCtx.createBufferSource();
      source.buffer = buffer;
      source.connect(audioCtx.destination);

      const now = audioCtx.currentTime;
      // Rebuild the cushion whenever we have fallen behind, rather than
      // scheduling into the past.
      if (playHead < now + 0.02) playHead = now + JITTER_SECONDS;
      source.start(playHead);
      playHead += buffer.duration;
      window.__gtScheduled = (window.__gtScheduled || 0) + 1;

      // Status follows the stream, not individual 20 ms fragments — driving it
      // per fragment made it flap between speaking and listening.
      dot.className = "gt-va-dot talk";
      label.textContent = COPY.speaking;
      clearTimeout(idleTimer);
      idleTimer = setTimeout(goIdle, 700);
    };

    ws.onclose = () => {
      dot.className = "gt-va-dot";
      label.textContent = COPY.ended;
    };

    // --- capture ---
    // AudioWorklet from a Blob so the widget stays a single file.
    const workletSource = `
      class PCMCapture extends AudioWorkletProcessor {
        process(inputs) {
          const input = inputs[0];
          if (input && input[0]) {
            const f32 = input[0];
            const pcm = new Int16Array(f32.length);
            for (let i = 0; i < f32.length; i++) {
              const s = Math.max(-1, Math.min(1, f32[i]));
              pcm[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
            }
            this.port.postMessage(pcm.buffer, [pcm.buffer]);
          }
          return true;
        }
      }
      registerProcessor('pcm-capture', PCMCapture);
    `;
    const blobUrl = URL.createObjectURL(
      new Blob([workletSource], { type: "application/javascript" }),
    );
    await audioCtx.audioWorklet.addModule(blobUrl);
    URL.revokeObjectURL(blobUrl);

    const mic = audioCtx.createMediaStreamSource(stream);
    const capture = new AudioWorkletNode(audioCtx, "pcm-capture");

    // A worklet render quantum is 128 samples — 8 ms, 256 bytes. Sending each
    // one is ~125 WebSocket frames a second of mostly header. Batch to 20 ms.
    const CHUNK_BYTES = SAMPLE_RATE / 50 * 2; // 640
    let pending = [];
    let pendingBytes = 0;

    // While the agent is speaking, its own voice comes back through the phone
    // speaker into the mic. The browser's echo canceller does not reliably
    // remove audio played through a separate AudioContext, so the agent hears
    // itself and treats it as an interruption — it stops on every sentence.
    // Gate the uplink during playback unless the input is clearly louder than
    // the echo, which is what a real interruption sounds like.
    // Low enough that ordinary speech passes — an earlier value of 0.12 was
    // above what a phone mic produces at conversational volume, so nothing
    // reached the agent at all while it was speaking.
    const ECHO_GATE_RMS = 0.045;

    const rmsOf = (bytes) => {
      const pcm = new Int16Array(bytes.buffer, bytes.byteOffset,
                                 bytes.byteLength >> 1);
      let sum = 0;
      for (let i = 0; i < pcm.length; i++) {
        const s = pcm[i] / 32768;
        sum += s * s;
      }
      return pcm.length ? Math.sqrt(sum / pcm.length) : 0;
    };

    capture.port.onmessage = (e) => {
      if (!ws || ws.readyState !== WebSocket.OPEN) return;
      pending.push(new Uint8Array(e.data));
      pendingBytes += e.data.byteLength;
      if (pendingBytes < CHUNK_BYTES) return;

      const out = new Uint8Array(pendingBytes);
      let offset = 0;
      for (const part of pending) {
        out.set(part, offset);
        offset += part.length;
      }
      pending = [];
      pendingBytes = 0;

      const agentSpeaking = audioCtx && playHead > audioCtx.currentTime + 0.05;
      if (agentSpeaking && rmsOf(out) < ECHO_GATE_RMS) return;

      ws.send(out.buffer);
    };
    mic.connect(capture);
    // Worklets only run while connected to the graph; a zero-gain sink keeps
    // it alive without echoing the caller back to themselves.
    const silent = audioCtx.createGain();
    silent.gain.value = 0;
    capture.connect(silent).connect(audioCtx.destination);
  }

  function teardown(root, panel, launcher, label, dot) {
    if (pc) pc.close();
    if (ws && ws.readyState <= WebSocket.OPEN) ws.close();
    if (audioCtx) audioCtx.close().catch(() => {});
    if (stream) stream.getTracks().forEach((t) => t.stop());
    pc = stream = pcId = ws = audioCtx = null;
    if (label) label.textContent = COPY.ended;
    if (dot) dot.className = "gt-va-dot";
    panel.remove();
    root.appendChild(launcher);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", mount);
  } else {
    mount();
  }
})();
