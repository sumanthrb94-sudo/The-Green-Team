'use client';

/** Groot — floating sanctuary AI advisor. Streams NDJSON ChatEvents from /api/chat. */
import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { ArrowUpRight, Leaf, MessageSquare, Send, Square, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/components/auth/AuthProvider';
import { GROOT_FALLBACK, GROOT_GREETING, GROOT_SUGGESTIONS } from '@/lib/data/groot';
import { WHATSAPP } from '@/lib/data/contact';
import { track } from '@/lib/analytics';
import type { ActionPayload, ChatEvent, ChatMessage, SourceRef } from '@/lib/rag/types';

interface UiMessage extends ChatMessage {
  id: string;
  actions?: ActionPayload[];
  sources?: SourceRef[];
}

const STORE_KEY = 'gt_groot_v1';
const MAX_STORED = 30;

const FOCUSABLE =
  'a[href],button:not([disabled]),input:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

let seq = 0;
const uid = () => `m${Date.now().toString(36)}${(seq++).toString(36)}`;

const greeting = (): UiMessage => ({ id: 'greeting', role: 'model', text: GROOT_GREETING });

const isExternal = (href: string) => /^(https?:)?\/\//i.test(href) || href.startsWith('mailto:');

/* --- markdown-lite ------------------------------------------------------- */

const ESCAPES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};
const escapeHtml = (s: string) => s.replace(/[&<>"']/g, c => ESCAPES[c]);

/** Only real routes are linkified — otherwise "₹8,500/sq yd" becomes a link. */
const ROUTE =
  /(^|[\s(])(\/(?:sanctuaries|blog|map|list|membership|adviser-call|preinvestor-gold|syl)[\w\-/]*)/g;
const ABSOLUTE = /https?:\/\/[^\s<]+/g;
const LINK_CLASS = 'underline decoration-dotted underline-offset-2 text-[#c8a951] hover:text-white';

/**
 * The model writes plain prose with the occasional **emphasis** and link. Text is
 * escaped first, so the only markup that reaches the DOM is what this builds.
 */
function renderRich(text: string): string {
  let html = escapeHtml(text);
  html = html.replace(ABSOLUTE, match => {
    const href = match.replace(/[.,;:!?)\]]+$/, '');
    const tail = match.slice(href.length);
    const label = href.replace(/^https?:\/\//, '').replace(/\/$/, '');
    return `<a href="${href}" target="_blank" rel="noopener noreferrer" class="${LINK_CLASS}">${label}</a>${tail}`;
  });
  html = html.replace(ROUTE, (_m, pre: string, path: string) => `${pre}<a href="${path}" class="${LINK_CLASS}">${path}</a>`);
  html = html.replace(/\*\*([^*<>]+)\*\*/g, '<strong class="font-semibold text-white">$1</strong>');
  return html.replace(/\n/g, '<br />');
}

/* --- component ----------------------------------------------------------- */

export function Groot() {
  const { user } = useAuth();
  const reduce = useReducedMotion() ?? false;

  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [messages, setMessages] = useState<UiMessage[]>([greeting()]);
  const [conversationId, setConversationId] = useState<string | undefined>();

  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const launcherRef = useRef<HTMLButtonElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const messagesRef = useRef(messages);
  const restoredRef = useRef(false);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    restoredRef.current = true;
    try {
      const raw = sessionStorage.getItem(STORE_KEY);
      if (!raw) return;
      const saved = JSON.parse(raw) as { messages?: UiMessage[]; conversationId?: string };
      const restored = (saved.messages ?? []).filter(
        m => m && typeof m.text === 'string' && (m.role === 'user' || m.role === 'model')
      );
      if (restored.length > 0) setMessages(restored.slice(-MAX_STORED).map(m => ({ ...m, id: m.id || uid() })));
      if (saved.conversationId) setConversationId(saved.conversationId);
    } catch {}
  }, []);

  useEffect(() => {
    if (!restoredRef.current) return;
    try {
      sessionStorage.setItem(
        STORE_KEY,
        JSON.stringify({ messages: messages.slice(-MAX_STORED), conversationId })
      );
    } catch {}
  }, [messages, conversationId]);

  useEffect(() => {
    listRef.current?.scrollTo({
      top: listRef.current.scrollHeight,
      behavior: reduce ? 'auto' : 'smooth',
    });
  }, [messages, streaming, reduce]);

  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => inputRef.current?.focus(), 60);
    return () => clearTimeout(t);
  }, [open]);

  const close = useCallback(() => {
    setOpen(false);
    launcherRef.current?.focus();
  }, []);

  const stop = useCallback(() => abortRef.current?.abort(), []);

  const patch = useCallback((id: string, fn: (m: UiMessage) => UiMessage) => {
    setMessages(prev => prev.map(m => (m.id === id ? fn(m) : m)));
  }, []);

  const apply = useCallback(
    (event: ChatEvent, replyId: string) => {
      switch (event.type) {
        case 'token':
          patch(replyId, m => ({ ...m, text: m.text + event.text }));
          break;
        case 'action':
          patch(replyId, m => ({ ...m, actions: [...(m.actions ?? []), event.data] }));
          break;
        case 'sources':
          patch(replyId, m => ({ ...m, sources: event.items }));
          break;
        case 'done':
          if (event.conversationId) setConversationId(event.conversationId);
          break;
        case 'error':
          patch(replyId, m => ({ ...m, text: event.text }));
          break;
      }
    },
    [patch]
  );

  const send = useCallback(
    async (raw: string) => {
      const text = raw.trim();
      // abortRef, unlike `streaming`, is already set for a second click in the same tick.
      if (!text || streaming || abortRef.current) return;

      setInput('');
      const history = [...messagesRef.current, { id: uid(), role: 'user' as const, text }];
      const replyId = uid();
      setMessages([...history, { id: replyId, role: 'model', text: '' }]);
      setStreaming(true);

      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            // A leading model turn (the greeting) is not a valid transcript opener.
            messages: dropLeadingModel(history).map(({ role, text: t }) => ({ role, text: t })),
            userName: user?.displayName ?? 'Guest',
            conversationId,
          }),
          signal: controller.signal,
        });

        if (!res.ok || !res.body) {
          const body = (await res.json().catch(() => ({}))) as {
            error?: string;
            message?: string;
            href?: string;
          };
          // `error` is a machine code ('forbidden', 'rate_limited') — never show
          // it to a visitor. Only `message` is written for human eyes.
          apply({ type: 'error', text: body.message ?? GROOT_FALLBACK }, replyId);
          apply(
            {
              type: 'action',
              action: 'whatsapp_handoff',
              ok: true,
              data: {
                message: 'An adviser can pick this up right away.',
                ctaLabel: 'Continue on WhatsApp',
                ctaHref: body.href ?? WHATSAPP.generic,
              },
            },
            replyId
          );
          return;
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        const consume = (line: string) => {
          const trimmed = line.trim();
          if (!trimmed) return;
          try {
            apply(JSON.parse(trimmed) as ChatEvent, replyId);
          } catch {
            // A truncated or malformed line must not kill the rest of the stream.
          }
        };

        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          let nl = buffer.indexOf('\n');
          while (nl >= 0) {
            consume(buffer.slice(0, nl));
            buffer = buffer.slice(nl + 1);
            nl = buffer.indexOf('\n');
          }
        }
        consume(buffer + decoder.decode());
      } catch (err) {
        const aborted = err instanceof DOMException && err.name === 'AbortError';
        if (aborted) {
          setMessages(prev => prev.filter(m => m.id !== replyId || m.text.length > 0));
        } else {
          apply({ type: 'error', text: GROOT_FALLBACK }, replyId);
          apply(
            {
              type: 'action',
              action: 'whatsapp_handoff',
              ok: true,
              data: {
                message: 'An adviser can pick this up right away.',
                ctaLabel: 'Continue on WhatsApp',
                ctaHref: WHATSAPP.generic,
              },
            },
            replyId
          );
        }
      } finally {
        abortRef.current = null;
        setStreaming(false);
      }
    },
    [apply, conversationId, streaming, user?.displayName]
  );

  const onPanelKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.stopPropagation();
      close();
      return;
    }
    if (e.key !== 'Tab' || !panelRef.current) return;
    const nodes = Array.from(panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
      n => n.offsetParent !== null
    );
    if (nodes.length === 0) return;
    const first = nodes[0];
    const last = nodes[nodes.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };

  const showSuggestions = messages.length === 1 && messages[0].role === 'model';
  const panelMotion = reduce
    ? {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 },
        transition: { duration: 0.12 },
      }
    : {
        initial: { opacity: 0, y: 40, scale: 0.98 },
        animate: { opacity: 1, y: 0, scale: 1 },
        exit: { opacity: 0, y: 30, scale: 0.98 },
        transition: { type: 'spring' as const, damping: 30, stiffness: 340 },
      };

  return (
    <>
      <button
        ref={launcherRef}
        onClick={() => {
          setOpen(true);
          track.chatOpen();
        }}
        aria-label="Chat with Groot"
        aria-expanded={open}
        className="fixed bottom-20 right-5 md:bottom-8 md:right-8 z-[999] w-12 h-12 bg-olive-800 text-cream dark:bg-primary dark:text-on-primary rounded-full shadow-lg flex items-center justify-center hover:scale-105 hover:shadow-xl transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
      >
        <MessageSquare className="w-5 h-5" />
      </button>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={close}
              className="fixed inset-0 z-[9975] bg-black/40 backdrop-blur-[2px]"
            />
            <motion.div
              ref={panelRef}
              onKeyDown={onPanelKeyDown}
              role="dialog"
              aria-modal="true"
              aria-label="Groot — sanctuary AI advisor"
              {...panelMotion}
              className="fixed inset-0 z-[9981] flex flex-col overflow-hidden rounded-none bg-[#0a1208] text-white shadow-2xl md:inset-auto md:bottom-28 md:right-8 md:w-[380px] md:max-w-[calc(100vw-2.5rem)] md:h-[600px] md:max-h-[calc(100vh-9rem)] md:rounded-3xl md:border md:border-white/10"
            >
              <div className="flex items-center justify-between gap-3 border-b border-white/8 bg-[#141c0f] px-5 pb-4 pt-[max(1rem,env(safe-area-inset-top))] md:pt-4">
                <div className="flex items-center gap-3.5">
                  <span className="w-10 h-10 rounded-full bg-white/8 flex items-center justify-center border border-white/12">
                    <Leaf className="w-5 h-5 text-[#c8a951]" />
                  </span>
                  <span>
                    <span className="block font-headline font-bold text-lg leading-none">Groot</span>
                    <span className="block text-[8px] uppercase tracking-[0.3em] text-[#a3b18a] mt-1">
                      Sanctuary AI Advisor
                    </span>
                  </span>
                </div>
                <button
                  onClick={close}
                  aria-label="Close chat"
                  className="p-2 rounded-full text-white/70 hover:bg-white/10 hover:text-white transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c8a951] focus-visible:ring-offset-2 focus-visible:ring-offset-[#141c0f]"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div
                ref={listRef}
                aria-live="polite"
                aria-atomic="false"
                className="flex-1 overflow-y-auto overscroll-contain px-5 py-5 space-y-4"
              >
                {messages.map((m, i) => {
                  const inFlight = streaming && i === messages.length - 1 && m.role === 'model';
                  return (
                    <div key={m.id} className={cn('flex flex-col gap-2', m.role === 'user' ? 'items-end' : 'items-start')}>
                      {(m.text.length > 0 || !inFlight) && (
                        <div
                          className={cn(
                            'max-w-[88%] px-4 py-3 text-sm leading-relaxed rounded-2xl',
                            m.role === 'user'
                              ? 'bg-[#a3b18a] text-[#0a1208] rounded-tr-sm'
                              : 'bg-[#141c0f] text-white/85 border border-white/8 rounded-tl-sm'
                          )}
                        >
                          {m.role === 'user' ? (
                            m.text
                          ) : (
                            <>
                              <span dangerouslySetInnerHTML={{ __html: renderRich(m.text) }} />
                              {inFlight && (
                                <span
                                  aria-hidden
                                  className={cn(
                                    'ml-1 inline-block h-3.5 w-[2px] translate-y-[2px] bg-[#c8a951]',
                                    !reduce && 'animate-pulse'
                                  )}
                                />
                              )}
                            </>
                          )}
                        </div>
                      )}

                      {inFlight && m.text.length === 0 && (
                        <div className="flex items-center gap-2 rounded-2xl rounded-tl-sm border border-white/8 bg-[#141c0f] px-4 py-3">
                          <span className="text-xs italic text-[#a3b18a]">Groot is thinking…</span>
                          <span className="flex gap-1">
                            {[0, 0.2, 0.4].map(d => (
                              <motion.span
                                key={d}
                                animate={reduce ? undefined : { opacity: [0, 1, 0] }}
                                transition={{ repeat: Infinity, duration: 1, delay: d }}
                                className="w-1 h-1 bg-[#c8a951] rounded-full"
                              />
                            ))}
                          </span>
                        </div>
                      )}

                      {m.actions?.map((action, k) => (
                        <div
                          key={k}
                          className="w-full max-w-[88%] rounded-2xl border border-[#c8a951]/35 bg-[#c8a951]/8 px-4 py-3.5"
                        >
                          <p className="text-sm leading-relaxed text-white/85">{action.message}</p>
                          {action.ctaHref &&
                            (isExternal(action.ctaHref) ? (
                              <a
                                href={action.ctaHref}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="mt-3 inline-flex items-center gap-2 rounded-full bg-[#c8a951] px-4 py-2.5 text-[9px] font-bold uppercase tracking-[0.25em] text-[#1a1a0a] transition-all hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c8a951] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a1208]"
                              >
                                {action.ctaLabel ?? 'Open'} <ArrowUpRight className="h-3.5 w-3.5" />
                              </a>
                            ) : (
                              <Link
                                href={action.ctaHref}
                                onClick={close}
                                className="mt-3 inline-flex items-center gap-2 rounded-full bg-[#c8a951] px-4 py-2.5 text-[9px] font-bold uppercase tracking-[0.25em] text-[#1a1a0a] transition-all hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c8a951] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a1208]"
                              >
                                {action.ctaLabel ?? 'Open'} <ArrowUpRight className="h-3.5 w-3.5" />
                              </Link>
                            ))}
                        </div>
                      ))}

                      {m.sources && m.sources.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {m.sources.map((s, k) =>
                            s.url ? (
                              <Link
                                key={k}
                                href={s.url}
                                onClick={close}
                                className="rounded-full border border-white/12 px-2.5 py-1 text-[10px] text-white/55 transition-all hover:border-white/25 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c8a951] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a1208]"
                              >
                                {s.title}
                              </Link>
                            ) : (
                              <span
                                key={k}
                                className="rounded-full border border-white/12 px-2.5 py-1 text-[10px] text-white/40"
                              >
                                {s.title}
                              </span>
                            )
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}

                {showSuggestions && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {GROOT_SUGGESTIONS.map(s => (
                      <button
                        key={s}
                        onClick={() => send(s)}
                        className="rounded-full border border-white/15 px-3.5 py-2 text-xs text-[#a3b18a] transition-all hover:border-[#a3b18a]/60 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c8a951] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a1208]"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="border-t border-white/8 bg-[#141c0f] px-4 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))] md:pb-4">
                {streaming && (
                  <div className="flex justify-center pb-2.5">
                    <button
                      onClick={stop}
                      aria-label="Stop generating"
                      className="inline-flex items-center gap-2 rounded-full border border-white/20 px-3.5 py-1.5 text-[9px] font-bold uppercase tracking-[0.25em] text-white/70 transition-all hover:border-white/40 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c8a951] focus-visible:ring-offset-2 focus-visible:ring-offset-[#141c0f]"
                    >
                      <Square className="h-3 w-3 fill-current" /> Stop
                    </button>
                  </div>
                )}
                <form
                  onSubmit={e => {
                    e.preventDefault();
                    void send(input);
                  }}
                  className="relative flex items-center"
                >
                  <input
                    ref={inputRef}
                    type="text"
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    placeholder="Ask Groot about sanctuaries…"
                    aria-label="Message Groot"
                    autoComplete="off"
                    className="w-full rounded-2xl border border-white/15 bg-white/5 py-3.5 pl-5 pr-14 text-sm text-white placeholder:text-white/30 outline-none transition-all focus:border-[#a3b18a]/60 focus-visible:ring-2 focus-visible:ring-[#c8a951]/50"
                  />
                  <button
                    type="submit"
                    disabled={streaming || !input.trim()}
                    aria-label="Send"
                    className="absolute right-1.5 rounded-xl bg-[#a3b18a] p-2.5 text-[#0a1208] transition-all hover:opacity-90 disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c8a951] focus-visible:ring-offset-2 focus-visible:ring-offset-[#141c0f]"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </form>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

function dropLeadingModel(messages: UiMessage[]): UiMessage[] {
  let i = 0;
  while (i < messages.length && messages[i].role === 'model') i++;
  return messages.slice(i);
}
