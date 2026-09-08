'use client';

/**
 * One visit, replayed in order.
 *
 * This exists to answer a question the aggregate dashboard structurally cannot:
 * a WhatsApp message arrives at 7:44 pm quoting `GT-4KP2QX` — who is this, what
 * were they reading, where did they come from, and had they been here before?
 * Averages cannot answer that, and on a business selling ₹1 Cr land the whole
 * month may turn on two such conversations.
 */
import Link from 'next/link';
import { ArrowLeft, MapPin, Smartphone, Clock, ExternalLink } from 'lucide-react';
import type { SessionTrace } from '@/lib/server/analytics-data';

const PRETTY: Record<string, string> = {
  pageview: 'Viewed',
  whatsapp_click: 'Tapped WhatsApp',
  chat_open: 'Opened Groot',
  generate_lead: 'Submitted the adviser form',
  site_visit: 'Requested a site visit',
  sign_up: 'Subscribed to the briefing',
  outbound_click: 'Followed an outbound link',
  phone_click: 'Tapped the phone number',
  email_click: 'Tapped the email address',
  pricing_gate_view: 'Reached the pricing gate',
  pricing_gate_signin_click: 'Clicked sign in at the gate',
  pricing_unlocked: 'Unlocked the price sheet',
  section_dwell: 'Read a section',
  experiment_impression: 'Saw a test variant',
  brochure_download: 'Downloaded the brochure',
  submit_review: 'Left a review',
};

/** Events worth a coloured dot — the ones that mean money. */
const HOT = new Set([
  'whatsapp_click',
  'generate_lead',
  'site_visit',
  'phone_click',
  'pricing_unlocked',
]);

const clock = (iso: string) =>
  new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

/** Full stamp with the year, because a returning buyer is the point. */
const stamp = (iso: string) =>
  new Date(iso).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

const dur = (sec: number) => (sec < 60 ? `${sec}s` : `${Math.floor(sec / 60)}m ${sec % 60}s`);

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[9px] uppercase tracking-[0.3em] font-bold text-secondary/40">{label}</p>
      <p className="text-sm text-on-surface mt-1 truncate" title={value}>
        {value}
      </p>
    </div>
  );
}

export function SessionTraceView({ trace, range }: { trace: SessionTrace; range: number }) {
  const back = (
    <Link
      href={`/admin/analytics?range=${range}`}
      className="inline-flex items-center gap-2 text-[10px] uppercase tracking-widest font-bold text-secondary/60 hover:text-secondary"
    >
      <ArrowLeft className="w-3.5 h-3.5" /> Back to analytics
    </Link>
  );

  if (!trace.found) {
    return (
      <div className="space-y-6">
        {back}
        <div className="p-8 rounded-3xl bg-surface border border-dashed border-outline/30">
          <p className="font-bold text-on-surface mb-2">Nothing found for “{trace.query}”.</p>
          <ul className="text-sm text-secondary/60 space-y-1.5 list-disc pl-5">
            <li>Check the code — it is six characters after <code>GT-</code>, no other letters.</li>
            <li>
              A code is only created once a visitor accepts analytics. Someone who refused the cookie
              banner sends a clean message with no reference, and there is nothing to trace.
            </li>
            <li>Records older than fourteen months are deleted automatically.</li>
          </ul>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {back}

      <div className="p-6 rounded-3xl bg-surface border border-outline/12 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-on-surface font-mono">{trace.ref ?? trace.sid}</h1>
            <p className="text-sm text-secondary/60 mt-1">
              {trace.startedAt && stamp(trace.startedAt)}
              {trace.durationSec !== undefined && ` · ${dur(trace.durationSec)} on site`}
            </p>
          </div>
          {trace.uid && (
            <span className="px-3 py-1.5 rounded-full bg-primary/10 text-primary text-[10px] uppercase tracking-widest font-bold">
              Signed-in member
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-5 pt-1">
          <Fact label="Came from" value={trace.channel ?? 'Direct'} />
          <Fact label="Place" value={`${trace.city ?? '—'}, ${trace.country ?? '—'}`} />
          <Fact label="Device" value={`${trace.device ?? '—'} · ${trace.browser ?? ''}`} />
          <Fact label="Engaged" value={dur(trace.engagedSec ?? 0)} />
        </div>

        {trace.utmCampaign && (
          <p className="text-xs text-secondary/60">Campaign: {trace.utmCampaign}</p>
        )}
      </div>

      {trace.leads.length > 0 && (
        <div className="p-6 rounded-3xl bg-primary/5 border border-primary/20">
          <h2 className="text-[9px] uppercase tracking-[0.35em] font-bold text-primary/70 mb-3">
            This visit became a lead
          </h2>
          <ul className="space-y-2">
            {trace.leads.map(l => (
              <li key={l.id} className="flex items-center justify-between gap-3 text-sm">
                <span className="text-on-surface font-medium">
                  {l.name}
                  {l.phone && <span className="text-secondary/60 font-normal ml-2">{l.phone}</span>}
                </span>
                <span className="text-xs text-secondary/50">
                  {l.source}
                  {l.createdAt && ` · ${stamp(l.createdAt)}`}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="p-6 rounded-3xl bg-surface border border-outline/12">
        <h2 className="text-[9px] uppercase tracking-[0.35em] font-bold text-secondary/50 mb-5">
          What they did, in order
        </h2>
        <ol className="relative border-l border-outline/15 ml-2 space-y-0">
          {trace.steps.map((s, i) => {
            const hot = HOT.has(s.name);
            return (
              <li key={`${s.at}-${i}`} className="relative pl-6 py-2.5">
                <span
                  className={`absolute -left-[5px] top-4 w-2.5 h-2.5 rounded-full ${
                    hot ? 'bg-gold ring-4 ring-gold/15' : 'bg-outline/30'
                  }`}
                  aria-hidden
                />
                <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                  <span className="text-sm text-on-surface">
                    <span className={hot ? 'font-bold' : ''}>{PRETTY[s.name] ?? s.name}</span>
                    {s.kind === 'pageview' && (
                      <span className="text-secondary/60"> {s.path}</span>
                    )}
                    {s.name === 'section_dwell' && s.meta?.s && (
                      <span className="text-secondary/60">
                        {' '}
                        “{String(s.meta.s)}” · {Math.round(Number(s.meta.ms ?? 0) / 1000)}s
                      </span>
                    )}
                  </span>
                  <span className="text-[11px] tabular-nums text-secondary/45 flex items-center gap-3">
                    {s.kind === 'pageview' && s.engagedSec > 0 && (
                      <span title="Engaged time on this page">
                        <Clock className="w-3 h-3 inline mr-1" />
                        {dur(s.engagedSec)} · {s.scrollPct}%
                      </span>
                    )}
                    {s.gapSec > 60 && <span title="Gap before this step">+{dur(s.gapSec)}</span>}
                    {clock(s.at)}
                  </span>
                </div>
              </li>
            );
          })}
        </ol>
      </div>

      {trace.otherSessions.length > 0 && (
        <div className="p-6 rounded-3xl bg-surface border border-outline/12">
          <h2 className="text-[9px] uppercase tracking-[0.35em] font-bold text-secondary/50 mb-1">
            Earlier visits by the same browser
          </h2>
          <p className="text-[11px] text-secondary/40 mb-4">
            Someone on their third visit is not a new enquiry — they are a decision in progress.
          </p>
          <ul className="space-y-1.5">
            {trace.otherSessions.map(s => (
              <li key={s.sid}>
                <Link
                  href={`/admin/analytics?trace=${encodeURIComponent(s.ref ?? s.sid)}&range=${range}`}
                  className="flex items-center justify-between gap-3 px-3 py-2 rounded-lg bg-black/[0.02] dark:bg-white/[0.03] hover:bg-primary/5 transition-colors text-sm"
                >
                  <span className="font-mono text-on-surface">{s.ref ?? s.sid.slice(0, 12)}</span>
                  <span className="text-xs text-secondary/50 flex items-center gap-3">
                    {s.steps} steps · {stamp(s.at)}
                    <ExternalLink className="w-3 h-3" />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      <p className="text-[11px] text-secondary/40 px-2 flex items-start gap-2">
        <MapPin className="w-3.5 h-3.5 flex-shrink-0 mt-px" />
        City-level location from the CDN edge — no raw IP address is stored, and nothing here
        identifies anyone who has not signed in or written to us.
        <Smartphone className="w-3.5 h-3.5 flex-shrink-0 mt-px ml-1" />
      </p>
    </div>
  );
}
