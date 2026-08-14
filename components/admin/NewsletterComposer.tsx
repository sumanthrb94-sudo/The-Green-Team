'use client';

/** Compose and dispatch a newsletter issue to all subscribers (via Resend). */
import { useState } from 'react';
import { Send, FlaskConical, CheckCircle2, AlertTriangle } from 'lucide-react';

export function NewsletterComposer({ subscriberCount }: { subscriberCount: number }) {
  const [open, setOpen] = useState(false);
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [busy, setBusy] = useState<'test' | 'all' | null>(null);
  const [msg, setMsg] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);

  const dispatch = async (test: boolean) => {
    if (!subject.trim() || !body.trim()) {
      setMsg({ kind: 'err', text: 'Subject and message are both required.' });
      return;
    }
    if (!test && !confirm(`Send this issue to all ${subscriberCount} subscribers? This cannot be undone.`)) return;
    setBusy(test ? 'test' : 'all');
    setMsg(null);
    try {
      const res = await fetch('/api/admin/newsletter/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject, body, test }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? `failed (${res.status})`);
      setMsg({
        kind: 'ok',
        text: test
          ? 'Test issue sent to your admin inbox — check it before the real dispatch.'
          : `Issue dispatched to ${data.sent}/${data.total} subscribers.`,
      });
    } catch (e) {
      setMsg({ kind: 'err', text: e instanceof Error ? e.message : 'Send failed' });
    } finally {
      setBusy(null);
    }
  };

  const input =
    'w-full bg-surface-container-low border border-outline/25 rounded-2xl px-4 py-3 text-sm text-on-surface placeholder:text-on-surface/30 outline-none focus:border-primary transition-all';

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-primary text-on-primary text-[9px] uppercase tracking-widest font-bold hover:opacity-95 transition-all"
      >
        <Send className="w-3.5 h-3.5" /> Compose Issue
      </button>
    );
  }

  return (
    <div className="w-full p-6 rounded-3xl bg-surface border border-outline/15 space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-[9px] uppercase tracking-[0.4em] font-bold text-primary">New Dispatch</p>
        <button onClick={() => setOpen(false)} className="text-xs text-secondary/60 hover:text-on-surface">
          Close
        </button>
      </div>
      <input
        value={subject}
        onChange={e => setSubject(e.target.value)}
        placeholder="Subject — e.g. August Sanctuary Briefing"
        className={input}
      />
      <textarea
        rows={8}
        value={body}
        onChange={e => setBody(e.target.value)}
        placeholder={'Write the issue…\n\nSeparate paragraphs with a blank line. It goes out in the branded Green Team template with a "View the Sanctuaries" button.'}
        className={input}
      />
      {msg && (
        <p
          className={`flex items-start gap-2 text-sm ${msg.kind === 'ok' ? 'text-primary' : 'text-error'}`}
        >
          {msg.kind === 'ok' ? (
            <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          )}
          {msg.text}
        </p>
      )}
      <div className="flex flex-wrap gap-3">
        <button
          onClick={() => void dispatch(true)}
          disabled={busy !== null}
          className="flex items-center gap-2 px-5 py-3 rounded-2xl border border-outline/30 text-[9px] uppercase tracking-widest font-bold text-on-surface/70 hover:border-primary/50 transition-all disabled:opacity-50"
        >
          <FlaskConical className="w-3.5 h-3.5" /> {busy === 'test' ? 'Sending…' : 'Send Test to Me'}
        </button>
        <button
          onClick={() => void dispatch(false)}
          disabled={busy !== null}
          className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-primary text-on-primary text-[9px] uppercase tracking-widest font-bold hover:opacity-95 transition-all disabled:opacity-50"
        >
          <Send className="w-3.5 h-3.5" /> {busy === 'all' ? 'Dispatching…' : `Send to ${subscriberCount} Subscribers`}
        </button>
      </div>
    </div>
  );
}
