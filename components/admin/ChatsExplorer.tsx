'use client';

/** Read-only transcript viewer. The refused-question list is what drives the next round of KB content. */
import { useMemo, useState } from 'react';
import {
  ArrowLeft,
  Check,
  ChevronDown,
  ChevronRight,
  Copy,
  MessageSquare,
  ShieldAlert,
  Sparkles,
  Target,
  User,
  Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AdminConversation } from '@/lib/server/admin-data';
import type { ChatRole, StoredAction, ToolName } from '@/lib/rag/types';

type Filter = 'all' | 'lead' | 'refused';

const LEAD_TOOLS: ToolName[] = ['book_site_visit', 'capture_lead'];

const BADGE = 'px-2.5 py-0.5 rounded-full border text-[8px] uppercase tracking-widest font-bold flex-shrink-0';

const producedLead = (c: AdminConversation) =>
  c.leadIds.length > 0 || c.actions.some(a => a.ok && LEAD_TOOLS.includes(a.tool));

const title = (c: AdminConversation) =>
  c.messages.find(m => m.role === 'user')?.text.trim() || 'Empty conversation';

const relative = (at: string) => {
  const t = Date.parse(at);
  if (!t) return '—';
  const mins = Math.round((Date.now() - t) / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  if (mins < 1440) return `${Math.round(mins / 60)}h ago`;
  if (mins < 43200) return `${Math.round(mins / 1440)}d ago`;
  return new Date(t).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' });
};

const clock = (at: string) => {
  const t = Date.parse(at);
  return t ? new Date(t).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '';
};

type Entry =
  | { kind: 'message'; at: string; role: ChatRole; text: string }
  | { kind: 'action'; at: string; action: StoredAction };

/** Actions are stamped separately from messages, so replay both on one clock to show where each fired. */
const timeline = (c: AdminConversation): Entry[] =>
  [
    ...c.messages.map<Entry>(m => ({ kind: 'message', at: m.at, role: m.role, text: m.text })),
    ...c.actions.map<Entry>(a => ({ kind: 'action', at: a.at, action: a })),
  ].sort((a, b) => a.at.localeCompare(b.at));

export function ChatsExplorer({ conversations }: { conversations: AdminConversation[] }) {
  const [filter, setFilter] = useState<Filter>('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [openQuestions, setOpenQuestions] = useState(true);
  const [copied, setCopied] = useState(false);

  const counts = useMemo(() => {
    const lead = conversations.filter(producedLead).length;
    const refused = conversations.filter(c => c.status === 'refused').length;
    return { all: conversations.length, lead, refused };
  }, [conversations]);

  const unanswered = useMemo(() => {
    const seen = new Set<string>();
    const out: { key: string; text: string; when: string }[] = [];
    for (const c of conversations) {
      if (c.status !== 'refused') continue;
      for (const m of c.messages) {
        const text = m.text.trim();
        const key = text.toLowerCase();
        if (m.role !== 'user' || !text || seen.has(key)) continue;
        seen.add(key);
        out.push({ key, text, when: c.updatedAt });
      }
    }
    return out;
  }, [conversations]);

  const visible = useMemo(
    () =>
      conversations.filter(c =>
        filter === 'lead' ? producedLead(c) : filter === 'refused' ? c.status === 'refused' : true
      ),
    [conversations, filter]
  );

  const selected = conversations.find(c => c.id === selectedId) ?? null;

  const copyQuestions = async () => {
    try {
      await navigator.clipboard.writeText(unanswered.map(u => u.text).join('\n'));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  if (conversations.length === 0) {
    return (
      <div className="p-12 rounded-3xl bg-surface border border-outline/12 text-center">
        <MessageSquare className="w-8 h-8 mx-auto text-primary/30" />
        <p className="mt-4 text-sm font-bold text-on-surface">No conversations yet.</p>
        <p className="mt-1 text-xs text-secondary/50">
          Transcripts appear here the moment someone talks to Groot on the site.
        </p>
      </div>
    );
  }

  const refusalRate = Math.round((counts.refused / counts.all) * 100);

  const stats = [
    { label: 'Conversations', value: counts.all, sub: 'stored transcripts', Icon: MessageSquare },
    {
      label: 'Produced a lead',
      value: counts.lead,
      sub: `${Math.round((counts.lead / counts.all) * 100)}% of chats`,
      Icon: Target,
    },
    { label: 'Refusal rate', value: `${refusalRate}%`, sub: `${counts.refused} with no answer`, Icon: ShieldAlert },
  ];

  const chips: { id: Filter; label: string }[] = [
    { id: 'all', label: `All (${counts.all})` },
    { id: 'lead', label: `Produced a lead (${counts.lead})` },
    { id: 'refused', label: `Refused (${counts.refused})` },
  ];

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {stats.map(({ label, value, sub, Icon }) => (
          <div key={label} className="p-6 rounded-3xl bg-surface border border-outline/12">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[9px] uppercase tracking-[0.35em] font-bold text-secondary/50">{label}</span>
              <Icon className="w-4 h-4 text-primary/50" />
            </div>
            <p className="text-4xl font-headline font-extrabold text-on-surface tabular-nums">{value}</p>
            <p className="text-xs text-secondary/60 mt-1 tabular-nums">{sub}</p>
          </div>
        ))}
      </div>

      <div className="rounded-3xl bg-surface border border-outline/12">
        <div className="flex items-center justify-between gap-3 p-5">
          <button
            onClick={() => setOpenQuestions(o => !o)}
            className="flex items-center gap-2.5 min-w-0 text-left"
          >
            {openQuestions ? (
              <ChevronDown className="w-4 h-4 text-primary flex-shrink-0" />
            ) : (
              <ChevronRight className="w-4 h-4 text-primary flex-shrink-0" />
            )}
            <span className="text-[9px] uppercase tracking-[0.35em] font-bold text-secondary/50">
              Unanswered questions
            </span>
            <span className="text-[10px] font-bold text-error tabular-nums">{unanswered.length}</span>
          </button>
          {unanswered.length > 0 && (
            <button
              onClick={() => void copyQuestions()}
              className="flex items-center gap-2 px-4 py-2 rounded-full border border-outline/25 text-[9px] uppercase tracking-widest font-bold text-secondary/70 hover:text-on-surface transition-all flex-shrink-0"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-primary" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copied' : 'Copy list'}
            </button>
          )}
        </div>
        {openQuestions && (
          <div className="px-5 pb-5">
            {unanswered.length === 0 ? (
              <p className="text-xs text-secondary/50">
                Nothing refused yet — the knowledge base covered every question asked.
              </p>
            ) : (
              <>
                <p className="text-xs text-secondary/60 mb-4">
                  Groot had no source for these. Each one is a page, an FAQ entry, or a fact worth adding.
                </p>
                <ol className="divide-y divide-outline/10 border-t border-outline/10">
                  {unanswered.map((u, i) => (
                    <li key={u.key} className="py-3 flex items-start gap-3">
                      <span className="text-[10px] font-bold text-secondary/40 tabular-nums mt-0.5 w-5 flex-shrink-0">
                        {i + 1}.
                      </span>
                      <span className="text-sm text-on-surface">{u.text}</span>
                    </li>
                  ))}
                </ol>
              </>
            )}
          </div>
        )}
      </div>

      <div className="flex gap-2 overflow-x-auto no-scrollbar">
        {chips.map(c => (
          <button
            key={c.id}
            onClick={() => setFilter(c.id)}
            className={cn(
              'flex-shrink-0 px-4 py-2 rounded-full text-[9px] uppercase tracking-[0.25em] font-bold border transition-all tabular-nums',
              filter === c.id
                ? 'bg-primary text-on-primary border-primary'
                : 'border-outline/25 text-secondary/60 hover:text-on-surface'
            )}
          >
            {c.label}
          </button>
        ))}
      </div>

      <div className="grid lg:grid-cols-[minmax(0,21rem)_minmax(0,1fr)] gap-4 items-start">
        <div className={cn('space-y-2', selected && 'hidden lg:block')}>
          {visible.length === 0 && (
            <p className="text-center py-16 text-secondary/40 text-sm">No conversations in this cut.</p>
          )}
          {visible.map(c => {
            const lead = producedLead(c);
            return (
              <button
                key={c.id}
                onClick={() => setSelectedId(c.id)}
                className={cn(
                  'w-full text-left p-4 rounded-3xl border transition-all',
                  c.id === selectedId
                    ? 'bg-surface border-primary/40'
                    : 'bg-surface border-outline/12 hover:border-primary/25'
                )}
              >
                <p className="text-sm font-bold text-on-surface line-clamp-2">{title(c)}</p>
                <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-2">
                  <span className="text-[10px] text-secondary/50 tabular-nums">
                    {c.turns} {c.turns === 1 ? 'turn' : 'turns'} · <span suppressHydrationWarning>{relative(c.updatedAt)}</span>
                  </span>
                  {lead && <span className={cn(BADGE, 'bg-gold/15 text-gold border-gold/30')}>Lead</span>}
                  {c.status === 'refused' && (
                    <span className={cn(BADGE, 'bg-error/10 text-error border-error/25')}>Refused</span>
                  )}
                  {c.status === 'degraded' && (
                    <span className={cn(BADGE, 'bg-secondary/10 text-secondary border-secondary/25')}>Degraded</span>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        <div className={cn('rounded-3xl bg-surface border border-outline/12', !selected && 'hidden lg:block')}>
          {!selected ? (
            <p className="py-24 text-center text-sm text-secondary/40">Select a conversation to read it.</p>
          ) : (
            <>
              <div className="flex items-start justify-between gap-4 p-5 border-b border-outline/10">
                <div className="min-w-0">
                  <p className="text-sm font-bold text-on-surface truncate">
                    {selected.userName || 'Anonymous visitor'}
                  </p>
                  <p className="text-[10px] text-secondary/50 tabular-nums mt-0.5">
                    {selected.turns} {selected.turns === 1 ? 'turn' : 'turns'} ·{' '}
                    <span suppressHydrationWarning>{relative(selected.updatedAt)}</span> · {selected.id}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedId(null)}
                  className="lg:hidden flex items-center gap-1.5 px-3 py-2 rounded-full border border-outline/25 text-[9px] uppercase tracking-widest font-bold text-secondary/70 flex-shrink-0"
                >
                  <ArrowLeft className="w-3 h-3" /> List
                </button>
              </div>
              <div className="p-5 space-y-3">
                {timeline(selected).map((e, i) =>
                  e.kind === 'action' ? (
                    <div
                      key={i}
                      className="flex items-start gap-2.5 px-4 py-3 rounded-2xl border border-gold/25 bg-gold/8"
                    >
                      <Zap className="w-3.5 h-3.5 text-gold mt-0.5 flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="text-[9px] uppercase tracking-[0.3em] font-bold text-gold">
                          {e.action.tool.replace(/_/g, ' ')}
                          {!e.action.ok && ' · failed'}
                        </p>
                        {Object.entries(e.action.args).length > 0 && (
                          <p className="mt-1.5 text-xs text-secondary/70 break-words">
                            {Object.entries(e.action.args)
                              .map(([k, v]) => `${k}: ${v}`)
                              .join(' · ')}
                          </p>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div
                      key={i}
                      className={cn('max-w-[85%]', e.role === 'user' ? 'ml-auto' : 'mr-auto')}
                    >
                      <div
                        className={cn(
                          'flex items-center gap-1.5 mb-1 text-[8px] uppercase tracking-[0.3em] font-bold',
                          e.role === 'user' ? 'justify-end text-primary/70' : 'text-secondary/50'
                        )}
                      >
                        {e.role === 'user' ? (
                          <>
                            <span className="tabular-nums normal-case tracking-normal text-secondary/40">
                              {clock(e.at)}
                            </span>
                            Visitor <User className="w-3 h-3" />
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-3 h-3" /> Groot
                            <span className="tabular-nums normal-case tracking-normal text-secondary/40">
                              {clock(e.at)}
                            </span>
                          </>
                        )}
                      </div>
                      <p
                        className={cn(
                          'px-4 py-3 rounded-2xl text-sm whitespace-pre-wrap break-words border',
                          e.role === 'user'
                            ? 'bg-primary/10 border-primary/20 text-on-surface'
                            : 'bg-surface-container-low border-outline/12 text-on-surface/90'
                        )}
                      >
                        {e.text}
                      </p>
                    </div>
                  )
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
