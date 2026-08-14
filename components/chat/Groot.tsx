'use client';

/** Groot — floating sanctuary AI advisor. Replies come from /api/chat. */
import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Leaf, MessageSquare, Send, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/components/auth/AuthProvider';
import { GROOT_GREETING } from '@/lib/data/groot';

interface Msg { role: 'user' | 'model'; text: string }

export function Groot() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([{ role: 'model', text: GROOT_GREETING }]);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, loading]);

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;
    setInput('');
    const next: Msg[] = [...messages, { role: 'user', text }];
    setMessages(next);
    setLoading(true);
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: next, userName: user?.displayName ?? 'Guest' }),
      });
      const data = await res.json();
      setMessages(prev => [...prev, { role: 'model', text: data.text }]);
    } catch {
      setMessages(prev => [
        ...prev,
        { role: 'model', text: 'I am Groot. (My neural pathways are currently recharging. Please reach out via the Adviser Access form.)' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="Chat with Groot"
        className="fixed bottom-20 right-5 md:bottom-8 md:right-8 z-[999] w-12 h-12 bg-olive-800 text-cream dark:bg-primary dark:text-on-primary rounded-full shadow-lg flex items-center justify-center hover:scale-105 hover:shadow-xl transition-all duration-300"
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
              onClick={() => setOpen(false)}
              className="fixed inset-0 z-[995] bg-black/10 backdrop-blur-[1px]"
            />
            <motion.div
              initial={{ opacity: 0, y: 50, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 50, scale: 0.95 }}
              transition={{ type: 'spring', damping: 28, stiffness: 320 }}
              className="fixed bottom-20 right-5 md:bottom-28 md:right-8 z-[9981] w-[350px] max-w-[calc(100vw-2.5rem)] h-[520px] bg-surface shadow-2xl border border-outline/15 flex flex-col overflow-hidden rounded-3xl"
            >
              <div className="bg-forest-section p-5 text-white flex justify-between items-center">
                <div className="flex items-center gap-3.5">
                  <span className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center border border-white/15">
                    <Leaf className="w-5 h-5 text-gold-bright" />
                  </span>
                  <span>
                    <span className="block font-headline font-bold text-lg leading-none">Groot</span>
                    <span className="block text-[8px] uppercase tracking-[0.3em] text-white/50 mt-1">
                      Sanctuary AI Advisor
                    </span>
                  </span>
                </div>
                <button onClick={() => setOpen(false)} aria-label="Close chat" className="p-2 hover:bg-white/10 rounded-full transition-all">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div ref={listRef} className="flex-1 overflow-y-auto p-5 space-y-4 bg-surface-container-low/60">
                {messages.map((m, i) => (
                  <div key={i} className={cn('flex', m.role === 'user' ? 'justify-end' : 'justify-start')}>
                    <div
                      className={cn(
                        'max-w-[85%] px-4 py-3 text-sm leading-relaxed rounded-2xl shadow-sm',
                        m.role === 'user'
                          ? 'bg-primary text-on-primary rounded-tr-sm'
                          : 'bg-surface text-on-surface border border-outline/12 rounded-tl-sm'
                      )}
                    >
                      {m.text}
                    </div>
                  </div>
                ))}
                {loading && (
                  <div className="flex justify-start">
                    <div className="bg-surface border border-outline/12 px-4 py-3 rounded-2xl rounded-tl-sm shadow-sm flex items-center gap-2">
                      <span className="text-xs italic text-on-surface/50">Groot is thinking…</span>
                      <span className="flex gap-1">
                        {[0, 0.2, 0.4].map(d => (
                          <motion.span
                            key={d}
                            animate={{ opacity: [0, 1, 0] }}
                            transition={{ repeat: Infinity, duration: 1, delay: d }}
                            className="w-1 h-1 bg-primary rounded-full"
                          />
                        ))}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <div className="p-4 bg-surface border-t border-outline/12">
                <div className="relative flex items-center">
                  <input
                    type="text"
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && send()}
                    placeholder="Ask Groot about sanctuaries…"
                    className="w-full bg-surface-container-low border border-outline/20 rounded-2xl py-3.5 pl-5 pr-14 text-sm outline-none focus:border-primary/50 transition-all"
                  />
                  <button
                    onClick={send}
                    disabled={loading || !input.trim()}
                    aria-label="Send"
                    className="absolute right-1.5 p-2.5 bg-primary text-on-primary rounded-xl hover:opacity-90 transition-all disabled:opacity-40"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
