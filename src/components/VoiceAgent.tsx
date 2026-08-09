import { useEffect } from 'react';

/**
 * Loads the Telugu voice agent widget.
 *
 * The widget itself lives with the agent service (voice-agent/agent/web/
 * widget.js) and is served from the agent host, so the conversation logic and
 * the consent copy ship together — the button on this site can never get out
 * of step with what the agent actually does.
 *
 * Set VITE_AGENT_HOST to the agent's origin. With it unset the button simply
 * doesn't render, so a missing env var can't break the site.
 *
 *   local   VITE_AGENT_HOST=http://localhost:8080
 *   prod    VITE_AGENT_HOST=https://voice-agent-xxxx.a.run.app
 */
/** Local agent default, so `npm run dev` shows the button with no setup. */
const DEV_AGENT_HOST = 'http://localhost:8080';

export function VoiceAgent({ project }: { project?: string }) {
  const configured = import.meta.env.VITE_AGENT_HOST as string | undefined;
  const rera = import.meta.env.VITE_RERA_AGENT_REG_NO as string | undefined;

  // In dev, fall back to a local agent so the button is always there to test.
  // In production it stays gated: a button with no agent behind it is worse
  // than no button.
  const host = configured || (import.meta.env.DEV ? DEV_AGENT_HOST : undefined);

  useEffect(() => {
    if (!host) return;

    const existing = document.querySelector<HTMLScriptElement>('script[data-gt-voice]');
    if (existing) return;

    const script = document.createElement('script');
    script.src = `${host.replace(/\/$/, '')}/web/widget.js`;
    script.async = true;
    script.dataset.gtVoice = 'true';
    script.dataset.agentHost = host;
    // Which project the visitor is looking at. Omitted means the agent talks
    // about the whole portfolio and picks based on what they ask for.
    if (project) script.dataset.project = project;
    if (rera) script.dataset.rera = rera;

    script.onerror = () => {
      console.warn(
        `[VoiceAgent] no agent at ${host}. Start it with:\n` +
          '    cd voice-agent && .venv/bin/uvicorn agent.server:app --port 8080',
      );
    };

    document.body.appendChild(script);

    return () => {
      script.remove();
      document.querySelectorAll('.gt-va').forEach((n) => n.remove());
      // Let the widget mount again on the next effect run — StrictMode
      // unmounts and remounts once in dev.
      delete (window as Window & { __gtVoiceAgentMounted?: boolean })
        .__gtVoiceAgentMounted;
    };
    // Re-mount when the visitor navigates to a different property so the
    // agent opens already knowing which one they're looking at.
  }, [host, project, rera]);

  return null;
}
