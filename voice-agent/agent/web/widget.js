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

  const script = document.currentScript;
  const HOST = (script && script.dataset.agentHost) || window.location.origin;
  const PROJECT = (script && script.dataset.project) || "agartha";
  const RERA = (script && script.dataset.rera) || "";

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
  .gt-va { position: fixed; right: 20px; bottom: 20px; z-index: 2147483000; }
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

  function el(tag, cls, text) {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text) n.textContent = text;
    return n;
  }

  function mount() {
    const style = el("style");
    style.textContent = CSS;
    document.head.appendChild(style);

    const root = el("div", "gt-va");
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

    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true },
      });
    } catch (err) {
      label.textContent = COPY.denied;
      return;
    }

    pc = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    });

    stream.getTracks().forEach((t) => pc.addTrack(t, stream));
    // The agent needs a receive slot for its own audio even though the
    // browser sends nothing on it.
    pc.addTransceiver("audio", { direction: "recvonly" });

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

  function teardown(root, panel, launcher, label, dot) {
    if (pc) pc.close();
    if (stream) stream.getTracks().forEach((t) => t.stop());
    pc = stream = pcId = null;
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
