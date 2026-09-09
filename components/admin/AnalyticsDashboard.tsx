'use client';

/**
 * Admin → Analytics. Renders the first-party pipeline: who came, from where,
 * what they looked at and how long they actually stayed.
 *
 * Deliberately built around *engaged* time and visitor-counted funnels rather
 * than raw hits — for a business selling ₹1 Cr+ land, five minutes on the
 * Agartha page from one person in Hyderabad is worth more than a hundred
 * one-second bounces, and the dashboard should say so.
 */
import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import {
  Users,
  Eye,
  Timer,
  MousePointerClick,
  Globe,
  Smartphone,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Search,
  Lock,
  Flame,
  UserRound,
} from 'lucide-react';
import type { AnalyticsSummary, Row, VisitorRow } from '@/lib/server/analytics-data';

const GREEN = '#4a5c3d';
const GOLD = '#b8860b';

const RANGES = [
  { days: 1, label: '24h' },
  { days: 7, label: '7d' },
  { days: 30, label: '30d' },
  { days: 90, label: '90d' },
];

/** 95s → "1m 35s"; 0 → "0s". Seconds matter here, so never round to minutes. */
function dur(sec: number): string {
  if (!sec) return '0s';
  if (sec < 60) return `${sec}s`;
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return s ? `${m}m ${s}s` : `${m}m`;
}

const PRETTY_EVENT: Record<string, string> = {
  whatsapp_click: 'WhatsApp tap',
  chat_open: 'Opened Groot',
  generate_lead: 'Lead submitted',
  site_visit: 'Site visit requested',
  sign_up: 'Newsletter signup',
  outbound_click: 'Outbound link',
  phone_click: 'Phone tap',
  email_click: 'Email tap',
  submit_review: 'Review submitted',
  pricing_gate_view: 'Saw the pricing gate',
  pricing_gate_signin_click: 'Clicked sign in at the gate',
  pricing_unlocked: 'Unlocked the price sheet',
  profile_email_skipped: 'Skipped giving an email',
  section_dwell: 'Read a section',
  experiment_impression: 'Saw a test variant',
};

/** Full stamp with the year — a buyer returning after two months is the signal. */
const stamp = (iso: string) =>
  new Date(iso).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

/**
 * Paste a reference out of a WhatsApp message and get the visit behind it.
 *
 * A plain link rather than a fetch: the trace is a server-rendered page under
 * the same admin gate, so there is no client-side data path to secure and the
 * result is shareable and back-buttonable.
 */
function TraceBox({ range }: { range: number }) {
  const router = useRouter();
  const [q, setQ] = useState('');
  return (
    <form
      onSubmit={e => {
        e.preventDefault();
        const v = q.trim();
        if (v) router.push(`/admin/analytics?trace=${encodeURIComponent(v)}&range=${range}`);
      }}
      className="flex items-center gap-2 px-4 py-2 rounded-full border border-outline/25 bg-surface focus-within:border-primary/50 transition-colors"
    >
      <Search className="w-3.5 h-3.5 text-secondary/40 flex-shrink-0" />
      <input
        value={q}
        onChange={e => setQ(e.target.value)}
        placeholder="Trace GT-XXXXXX"
        aria-label="Trace a session reference"
        className="bg-transparent outline-none text-sm w-36 sm:w-44 placeholder:text-secondary/35 font-mono"
      />
    </form>
  );
}

/**
 * Attention: how far down a page people get, and where the time goes.
 *
 * The depth numbers are cumulative reach, which is the form that answers the
 * question worth asking — "is anyone seeing the thing at 70% of the page?"
 */
function AttentionMap({ rows }: { rows: AnalyticsSummary['attention'] }) {
  const [open, setOpen] = useState(rows[0]?.path ?? '');
  const page = rows.find(r => r.path === open) ?? rows[0];
  if (!rows.length) return <p className="text-sm text-secondary/40">No data yet.</p>;

  const heat = (pct: number) =>
    // Green through gold: cool where people leave, hot where they stay.
    `color-mix(in srgb, ${pct >= 60 ? GOLD : GREEN} ${Math.max(8, pct)}%, transparent)`;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-1.5">
        {rows.map(r => (
          <button
            key={r.path}
            onClick={() => setOpen(r.path)}
            className={`px-3 py-1.5 rounded-full text-[11px] font-medium transition-colors ${
              page?.path === r.path
                ? 'bg-primary text-on-primary'
                : 'bg-black/[0.03] dark:bg-white/[0.05] text-secondary/70 hover:text-secondary'
            }`}
          >
            {r.path}
          </button>
        ))}
      </div>

      {page && (
        <>
          <div>
            <p className="text-[10px] uppercase tracking-widest text-secondary/40 mb-2">
              How far down they got · {page.samples} visit{page.samples === 1 ? '' : 's'}
            </p>
            <div className="grid grid-cols-4 gap-1.5">
              {(['25%', '50%', '75%', 'Bottom'] as const).map((label, i) => (
                <div
                  key={label}
                  className="rounded-xl border border-outline/10 p-3 text-center"
                  style={{ background: heat(page.depth[i]) }}
                >
                  <p className="text-lg font-headline font-extrabold text-on-surface tabular-nums">
                    {page.depth[i]}%
                  </p>
                  <p className="text-[10px] text-secondary/60 mt-0.5">reached {label}</p>
                </div>
              ))}
            </div>
          </div>

          <div>
            <p className="text-[10px] uppercase tracking-widest text-secondary/40 mb-2">
              Where the time went
            </p>
            {page.sections.length === 0 ? (
              <p className="text-sm text-secondary/40">
                No section dwell recorded yet — it starts collecting on the next deploy, and needs a
                visit that stays more than a second on a section.
              </p>
            ) : (
              <ul className="space-y-1.5">
                {page.sections.map(s => {
                  const max = page.sections[0].avgSec || 1;
                  return (
                    <li key={s.id} className="relative">
                      <div
                        className="absolute inset-y-0 left-0 rounded-lg"
                        style={{ width: `${(s.avgSec / max) * 100}%`, background: heat(70) }}
                        aria-hidden
                      />
                      <div className="relative flex items-center justify-between gap-3 px-3 py-2">
                        <span className="text-sm text-on-surface truncate">{s.id}</span>
                        <span className="text-xs tabular-nums flex-shrink-0">
                          <span className="text-secondary/50">{s.samples} visits</span>
                          <span className="font-bold text-on-surface ml-3">{dur(s.avgSec)}</span>
                        </span>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </>
      )}
      <p className="text-[10px] text-secondary/35">
        Dwell is measured only while a section is at least half on screen, the tab is in front and
        the visitor is not idle. It is not mouse-position — most of this traffic is a phone, where
        there is no cursor to record.
      </p>
    </div>
  );
}

/** The people behind the numbers, most engaged first. */
function VisitorTable({ rows, range }: { rows: VisitorRow[]; range: number }) {
  const [membersOnly, setMembersOnly] = useState(false);
  const shown = membersOnly ? rows.filter(r => r.uid) : rows;
  if (!rows.length) return <p className="text-sm text-secondary/40">No visitors yet.</p>;

  return (
    <div className="space-y-3">
      <label className="flex items-center gap-2 text-[11px] text-secondary/60 cursor-pointer">
        <input
          type="checkbox"
          checked={membersOnly}
          onChange={e => setMembersOnly(e.target.checked)}
          className="accent-[#4a5c3d]"
        />
        Signed-in members only
      </label>
      <div className="overflow-x-auto -mx-2">
        <table className="w-full text-sm min-w-[640px]">
          <thead>
            <tr className="text-[9px] uppercase tracking-[0.25em] text-secondary/40 text-left">
              <th className="px-2 py-2 font-bold">Visitor</th>
              <th className="px-2 py-2 font-bold">First seen</th>
              <th className="px-2 py-2 font-bold">Last seen</th>
              <th className="px-2 py-2 font-bold text-right">Visits</th>
              <th className="px-2 py-2 font-bold text-right">Engaged</th>
              <th className="px-2 py-2 font-bold">Did</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline/8">
            {shown.slice(0, 40).map(v => (
              <tr key={v.vid} className="hover:bg-primary/[0.03]">
                <td className="px-2 py-2.5">
                  {v.ref ? (
                    <Link
                      href={`/admin/analytics?trace=${encodeURIComponent(v.ref)}&range=${range}`}
                      className="font-mono text-xs text-primary hover:underline underline-offset-4"
                    >
                      {v.ref}
                    </Link>
                  ) : (
                    <Link
                      href={`/admin/analytics?trace=${encodeURIComponent(v.vid)}&range=${range}`}
                      className="font-mono text-xs text-secondary/60 hover:underline underline-offset-4"
                    >
                      {v.vid.slice(0, 8)}
                    </Link>
                  )}
                  <span className="block text-[10px] text-secondary/45 mt-0.5">
                    {v.uid && (
                      <UserRound className="w-3 h-3 inline mr-1 text-primary" aria-label="Member" />
                    )}
                    {v.city !== 'Unknown' ? v.city : v.country} · {v.device} · {v.channel}
                    {v.focus && ` · ${v.focus}`}
                  </span>
                </td>
                <td className="px-2 py-2.5 text-xs text-secondary/60 whitespace-nowrap">
                  {stamp(v.firstSeen)}
                </td>
                <td className="px-2 py-2.5 text-xs text-secondary/60 whitespace-nowrap">
                  {stamp(v.lastSeen)}
                </td>
                <td className="px-2 py-2.5 text-right tabular-nums">
                  {v.sessions}
                  <span className="text-secondary/40 text-xs"> / {v.pageviews}p</span>
                </td>
                <td className="px-2 py-2.5 text-right tabular-nums font-bold">
                  {dur(v.engagedSec)}
                </td>
                <td className="px-2 py-2.5">
                  <span className="flex flex-wrap gap-1">
                    {v.did.map(d => (
                      <span
                        key={d}
                        className="px-2 py-0.5 rounded-full bg-gold/15 text-[10px] text-on-surface whitespace-nowrap"
                      >
                        {PRETTY_EVENT[d] ?? d}
                      </span>
                    ))}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-[10px] text-secondary/35">
        A visitor is a random first-party id in one browser, not a person: the same buyer on a phone
        and a laptop counts twice. The member icon appears only where somebody was signed in.
      </p>
    </div>
  );
}

function Delta({ now, before }: { now: number; before: number }) {
  if (!before) return null;
  const pct = Math.round(((now - before) / before) * 100);
  if (pct === 0) {
    return (
      <span className="inline-flex items-center gap-0.5 text-[10px] text-secondary/50">
        <Minus className="w-3 h-3" /> flat
      </span>
    );
  }
  const up = pct > 0;
  return (
    <span
      className={`inline-flex items-center gap-0.5 text-[10px] font-bold ${
        up ? 'text-[#4a5c3d]' : 'text-[#8a3d36]'
      }`}
      title="vs the previous period of equal length"
    >
      {up ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
      {Math.abs(pct)}%
    </span>
  );
}

function Panel({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="p-6 rounded-3xl bg-surface border border-outline/12">
      <div className="mb-4">
        <h2 className="text-[9px] uppercase tracking-[0.35em] font-bold text-secondary/50">{title}</h2>
        {hint && <p className="text-[11px] text-secondary/40 mt-1">{hint}</p>}
      </div>
      {children}
    </div>
  );
}

/** Horizontal bar list — the most legible way to read ranked dimensions. */
function BarList({
  rows,
  unit = 'views',
  showEngagement = false,
  labelOf,
}: {
  rows: Row[];
  unit?: string;
  showEngagement?: boolean;
  labelOf?: (k: string) => string;
}) {
  if (!rows.length) return <p className="text-sm text-secondary/40">No data yet.</p>;
  const max = Math.max(...rows.map(r => r.views), 1);
  return (
    <ul className="space-y-1.5">
      {rows.map(r => (
        <li key={r.key} className="relative">
          <div
            className="absolute inset-y-0 left-0 rounded-lg bg-primary/10"
            style={{ width: `${(r.views / max) * 100}%` }}
            aria-hidden
          />
          <div className="relative flex items-center justify-between gap-3 px-3 py-2">
            <span className="text-sm text-on-surface truncate" title={r.key}>
              {labelOf ? labelOf(r.key) : r.key}
            </span>
            <span className="flex items-center gap-3 flex-shrink-0 text-xs tabular-nums">
              {showEngagement && r.avgEngagedMs !== undefined && (
                <span className="text-secondary/50" title="Average engaged time on this page">
                  {dur(Math.round(r.avgEngagedMs / 1000))}
                </span>
              )}
              {showEngagement && r.avgScrollPct !== undefined && (
                <span className="text-secondary/40 hidden sm:inline" title="Average scroll depth">
                  {r.avgScrollPct}%
                </span>
              )}
              <span className="font-bold text-on-surface">{r.views.toLocaleString('en-IN')}</span>
            </span>
          </div>
        </li>
      ))}
      <li className="pt-1 text-[10px] uppercase tracking-widest text-secondary/30">
        {showEngagement ? 'page · avg time · scroll · ' : ''}
        {unit}
      </li>
    </ul>
  );
}

export function AnalyticsDashboard({ data, range }: { data: AnalyticsSummary; range: number }) {
  const [tab, setTab] = useState<'sources' | 'places' | 'tech'>('sources');

  const chart = useMemo(
    () =>
      data.daily.map(d => ({
        // 24h view still buckets by day; label stays short either way.
        day: d.day.slice(5),
        Visitors: d.visitors,
        Pageviews: d.pageviews,
      })),
    [data.daily]
  );

  const conversions = data.events
    .filter(e => ['generate_lead', 'site_visit', 'sign_up'].includes(e.name))
    .reduce((n, e) => n + e.count, 0);

  const kpis = [
    { label: 'Visitors', value: data.visitors.toLocaleString('en-IN'), sub: `${data.newVisitors} new`, Icon: Users, prev: data.prev.visitors, now: data.visitors },
    { label: 'Pageviews', value: data.pageviews.toLocaleString('en-IN'), sub: `${data.pagesPerSession} per visit`, Icon: Eye, prev: data.prev.pageviews, now: data.pageviews },
    { label: 'Avg time on page', value: dur(data.avgEngagedSec), sub: `${dur(data.avgSessionSec)} per visit`, Icon: Timer },
    { label: 'Conversions', value: conversions.toLocaleString('en-IN'), sub: `${data.bounceRate}% bounce`, Icon: MousePointerClick, prev: data.prev.conversions, now: conversions },
  ];

  return (
    <div className="space-y-6">
      {/* Header: range picker + live counter */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-on-surface">Analytics</h1>
          <p className="text-sm text-secondary/60 mt-1">
            First-party, ad-blocker-proof. Engaged time, not wall clock.
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <TraceBox range={range} />
          {data.liveVisitors > 0 && (
            <span className="flex items-center gap-2 px-3 py-2 rounded-full bg-[#4a5c3d]/10 text-[#4a5c3d] text-[10px] uppercase tracking-widest font-bold">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#4a5c3d] opacity-60" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#4a5c3d]" />
              </span>
              {data.liveVisitors} online
            </span>
          )}
          <div className="flex rounded-full border border-outline/25 overflow-hidden text-[9px] uppercase tracking-widest font-bold">
            {RANGES.map(r => (
              <Link
                key={r.days}
                href={`/admin/analytics?range=${r.days}`}
                className={`px-4 py-2 transition-colors ${
                  range === r.days ? 'bg-primary text-on-primary' : 'text-secondary/60 hover:text-secondary'
                }`}
              >
                {r.label}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {data.empty && (
        <div className="p-6 rounded-3xl border border-dashed border-outline/30 bg-surface">
          <p className="text-sm text-on-surface font-bold mb-1">No visits recorded yet.</p>
          <p className="text-sm text-secondary/60">
            Tracking starts the moment this build is live. Numbers appear here within seconds of the
            first real visit — no third-party account, no cookie banner, nothing to configure.
          </p>
        </div>
      )}

      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map(({ label, value, sub, Icon, prev, now }) => (
          <div key={label} className="p-6 rounded-3xl bg-surface border border-outline/12">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[9px] uppercase tracking-[0.35em] font-bold text-secondary/50">{label}</span>
              <Icon className="w-4 h-4 text-primary/50" />
            </div>
            <p className="text-3xl md:text-4xl font-headline font-extrabold text-on-surface">{value}</p>
            <p className="text-xs text-secondary/60 mt-1 flex items-center gap-2">
              {sub}
              {prev !== undefined && now !== undefined && <Delta now={now} before={prev} />}
            </p>
          </div>
        ))}
      </div>

      {/* Traffic over time */}
      <Panel title="Traffic" hint={`Last ${data.rangeDays} day${data.rangeDays > 1 ? 's' : ''}`}>
        <ResponsiveContainer width="100%" height={240}>
          <AreaChart data={chart} margin={{ top: 8, right: 8, bottom: 0, left: -20 }}>
            <defs>
              <linearGradient id="aVis" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={GREEN} stopOpacity={0.35} />
                <stop offset="100%" stopColor={GREEN} stopOpacity={0.02} />
              </linearGradient>
              <linearGradient id="aPv" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={GOLD} stopOpacity={0.28} />
                <stop offset="100%" stopColor={GOLD} stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="currentColor" strokeOpacity={0.08} />
            <XAxis dataKey="day" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} minTickGap={20} />
            <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} allowDecimals={false} />
            <Tooltip
              contentStyle={{
                borderRadius: 14,
                border: '1px solid rgba(0,0,0,.08)',
                fontSize: 12,
                background: 'var(--color-surface, #fff)',
              }}
            />
            <Area type="monotone" dataKey="Pageviews" stroke={GOLD} fill="url(#aPv)" strokeWidth={2} />
            <Area type="monotone" dataKey="Visitors" stroke={GREEN} fill="url(#aVis)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </Panel>

      {/* Pages + funnel */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Panel title="Pages" hint="Views, average engaged time and scroll depth">
          <BarList rows={data.topPages} showEngagement />
        </Panel>

        <div className="space-y-6">
          <Panel title="Buyer funnel" hint="Counted in people, not clicks">
            {data.funnel.every(f => !f.count) ? (
              <p className="text-sm text-secondary/40">No data yet.</p>
            ) : (
              <ul className="space-y-2.5">
                {data.funnel.map(f => (
                  <li key={f.step}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-on-surface">{f.step}</span>
                      <span className="tabular-nums font-bold">
                        {f.count}
                        <span className="text-secondary/40 font-normal ml-2">{f.pct}%</span>
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-outline/10 overflow-hidden">
                      <div className="h-full rounded-full bg-primary/70" style={{ width: `${f.pct}%` }} />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          <Panel title="Property attention" hint="Which sanctuary earns real time">
            <BarList rows={data.properties} showEngagement />
          </Panel>
        </div>
      </div>

      {/* The pricing gate — the narrowest point in the whole funnel */}
      <Panel
        title="Pricing gate"
        hint="Counted in people. The unlock event fires on every page load once somebody is signed in, so hits over-read badly here."
      >
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Saw the gate', n: data.gate.views, Icon: Lock },
            { label: 'Clicked sign in', n: data.gate.signInClicks, Icon: MousePointerClick },
            { label: 'Unlocked pricing', n: data.gate.unlocked, Icon: Flame },
          ].map(({ label, n, Icon }) => (
            <div key={label} className="p-4 rounded-2xl bg-black/[0.02] dark:bg-white/[0.03]">
              <Icon className="w-4 h-4 text-primary/50 mb-2" />
              <p className="text-3xl font-headline font-extrabold text-on-surface tabular-nums">{n}</p>
              <p className="text-[11px] text-secondary/60 mt-1">{label}</p>
            </div>
          ))}
        </div>
        {data.gate.views > 0 && (
          <p className="mt-4 text-xs text-secondary/60 leading-relaxed">
            <strong className="text-on-surface">
              {data.gate.views - data.gate.signInClicks} of {data.gate.views}
            </strong>{' '}
            people reached the price wall and never even clicked sign in. Nothing was captured from
            them — no name, no number, no way to follow up. That is the largest single leak on the
            site.
          </p>
        )}
      </Panel>

      {/* Attention heat + the people behind it */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Panel title="Attention" hint="How far down they get, and where the time actually goes">
          <AttentionMap rows={data.attention} />
        </Panel>
        <Panel title="Visitors" hint="Every visitor in the window, most engaged first">
          <VisitorTable rows={data.people} range={range} />
        </Panel>
      </div>

      {/* Segmented explorer */}
      <div className="p-6 rounded-3xl bg-surface border border-outline/12">
        <div className="flex items-center gap-2 mb-5 flex-wrap">
          {(
            [
              { id: 'sources', label: 'Sources', Icon: MousePointerClick },
              { id: 'places', label: 'Places', Icon: Globe },
              { id: 'tech', label: 'Devices', Icon: Smartphone },
            ] as const
          ).map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-[9px] uppercase tracking-widest font-bold transition-colors ${
                tab === t.id ? 'bg-primary text-on-primary' : 'text-secondary/60 hover:text-secondary'
              }`}
            >
              <t.Icon className="w-3.5 h-3.5" />
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'sources' && (
          <div className="grid md:grid-cols-3 gap-6">
            <div>
              <p className="text-[9px] uppercase tracking-[0.35em] font-bold text-secondary/50 mb-3">Channel</p>
              <BarList rows={data.channels} />
            </div>
            <div>
              <p className="text-[9px] uppercase tracking-[0.35em] font-bold text-secondary/50 mb-3">Referrer</p>
              <BarList rows={data.referrers} />
            </div>
            <div>
              <p className="text-[9px] uppercase tracking-[0.35em] font-bold text-secondary/50 mb-3">Campaign (UTM)</p>
              <BarList rows={data.campaigns} />
            </div>
          </div>
        )}

        {tab === 'places' && (
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <p className="text-[9px] uppercase tracking-[0.35em] font-bold text-secondary/50 mb-3">City</p>
              <BarList rows={data.cities} />
            </div>
            <div>
              <p className="text-[9px] uppercase tracking-[0.35em] font-bold text-secondary/50 mb-3">Country</p>
              <BarList rows={data.countries} />
            </div>
          </div>
        )}

        {tab === 'tech' && (
          <div className="grid md:grid-cols-3 gap-6">
            <div>
              <p className="text-[9px] uppercase tracking-[0.35em] font-bold text-secondary/50 mb-3">Device</p>
              <BarList rows={data.devices} />
            </div>
            <div>
              <p className="text-[9px] uppercase tracking-[0.35em] font-bold text-secondary/50 mb-3">Browser</p>
              <BarList rows={data.browsers} />
            </div>
            <div>
              <p className="text-[9px] uppercase tracking-[0.35em] font-bold text-secondary/50 mb-3">OS</p>
              <BarList rows={data.os} />
            </div>
          </div>
        )}
      </div>

      {/* Interactions + live feed */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Panel title="Interactions" hint="Every tracked action, by people and by count">
          {data.events.length === 0 ? (
            <p className="text-sm text-secondary/40">No interactions yet.</p>
          ) : (
            <ul className="space-y-1.5">
              {data.events.map(e => (
                <li key={e.name} className="flex items-center justify-between px-3 py-2 rounded-lg bg-black/[0.02] dark:bg-white/[0.03]">
                  <span className="text-sm text-on-surface">{PRETTY_EVENT[e.name] ?? e.name}</span>
                  <span className="text-xs tabular-nums">
                    <span className="text-secondary/50">{e.visitors} people</span>
                    <span className="font-bold text-on-surface ml-3">{e.count}</span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title="Live feed" hint="Most recent activity">
          {data.recent.length === 0 ? (
            <p className="text-sm text-secondary/40">Nothing yet.</p>
          ) : (
            <ul className="space-y-1 max-h-[360px] overflow-y-auto">
              {data.recent.map((r, i) => {
                const label = r.name === 'pageview' ? r.path : (PRETTY_EVENT[r.name] ?? r.name);
                const when = new Date(r.at).toLocaleTimeString('en-IN', {
                  hour: '2-digit',
                  minute: '2-digit',
                });
                const body = (
                  <>
                    <span className="truncate text-on-surface" title={r.path}>
                      {label}
                    </span>
                    <span className="flex-shrink-0 text-secondary/50 tabular-nums">
                      {r.city !== 'Unknown' ? r.city : r.country} · {r.device} · {when}
                    </span>
                  </>
                );
                // Every row with a reference opens the whole visit behind it.
                // Reading "WhatsApp tap · 7:44 pm" and being unable to click
                // through to what that person was doing is the exact gap this
                // closes.
                return (
                  <li key={`${r.at}-${i}`} className="border-b border-outline/8 last:border-0">
                    {r.ref ? (
                      <Link
                        href={`/admin/analytics?trace=${encodeURIComponent(r.ref)}&range=${range}`}
                        className="flex items-center justify-between gap-3 px-3 py-1.5 text-xs rounded-lg hover:bg-primary/5 transition-colors"
                      >
                        {body}
                      </Link>
                    ) : (
                      <span className="flex items-center justify-between gap-3 px-3 py-1.5 text-xs">
                        {body}
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </Panel>
      </div>

      <p className="text-[11px] text-secondary/40 px-2">
        No raw IP addresses are stored — visitors are counted with a random first-party id and a
        daily-rotating salted hash. Location is city-level from the CDN edge. Known bots are excluded.
      </p>
    </div>
  );
}
