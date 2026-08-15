import 'server-only';
import { embedOne } from '@/lib/ai/gemini';
import { loadIndex } from './index-store';
import { getPortfolio } from '@/lib/server/portfolio';
import { BUSINESS, WHATSAPP } from '@/lib/data/contact';
import type { ChatMessage, RetrievalResult, ScoredChunk } from './types';

const TOP_K = 8;
/**
 * Calibrated against this index, not copied from a tutorial: gemini-embedding-2
 * puts unrelated pairs around 0.49 and good matches around 0.76, so scores sit
 * in a narrow band and a "sensible-looking" 0.35 floor would never fire. Measured
 * with scripts/eval-retrieval.mjs — recalibrate if the embedding model changes.
 */
const SCORE_FLOOR = 0.55;
/**
 * The FAQ chunks are literally question-shaped, so they out-score everything on
 * any question — one query returned seven of eight slots as FAQ and crowded out
 * the property record holding the actual price. Capping per source is a cheap
 * diversity guarantee that keeps room for the data that answers the question.
 */
const MAX_PER_SOURCE = 3;

export function cosine(a: number[], b: number[]): number {
  const n = Math.min(a.length, b.length);
  let dot = 0;
  let magA = 0;
  let magB = 0;
  for (let i = 0; i < n; i++) {
    dot += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }
  if (magA === 0 || magB === 0) return 0;
  return dot / (Math.sqrt(magA) * Math.sqrt(magB));
}

/**
 * "What about the second one?" carries no retrievable content alone. Folding the
 * previous user turns into the embedded text resolves most follow-ups without
 * the latency of a separate query-rewrite model call.
 */
function embedText(query: string, history: ChatMessage[]): string {
  const priorUser = history
    .filter(m => m.role === 'user')
    .slice(-3, -1)
    .map(m => m.text)
    .join(' ');
  return priorUser ? `${priorUser}\n${query}`.slice(0, 2000) : query.slice(0, 2000);
}

export async function retrieve(query: string, history: ChatMessage[]): Promise<RetrievalResult> {
  const [index, queryVector] = await Promise.all([
    loadIndex(),
    embedOne(embedText(query, history), 'RETRIEVAL_QUERY'),
  ]);

  if (index.length === 0) return { chunks: [], empty: true };

  const scored: ScoredChunk[] = index
    .map(chunk => {
      const { embedding, ...rest } = chunk;
      return { ...rest, score: cosine(queryVector, embedding) };
    })
    .sort((a, b) => b.score - a.score);

  const eligible = scored.filter(c => c.score >= SCORE_FLOOR);
  const perSource = new Map<string, number>();
  const picked: ScoredChunk[] = [];
  const overflow: ScoredChunk[] = [];

  for (const chunk of eligible) {
    if (picked.length >= TOP_K) break;
    const used = perSource.get(chunk.source) ?? 0;
    if (used >= MAX_PER_SOURCE) {
      overflow.push(chunk);
      continue;
    }
    perSource.set(chunk.source, used + 1);
    picked.push(chunk);
  }
  // Backfill from the capped sources rather than returning a short context.
  for (const chunk of overflow) {
    if (picked.length >= TOP_K) break;
    picked.push(chunk);
  }

  return { chunks: picked, empty: picked.length === 0 };
}

/**
 * Always in context regardless of retrieval, so the bot can never be confused
 * about what the portfolio is or how to reach a human. Small and stable — the
 * ideal prefix for provider-side prompt caching.
 */
export async function pinnedFacts(): Promise<string> {
  const portfolio = await getPortfolio();
  const lines = portfolio.map(
    p => `- ${p.title} (id: ${p.id}) — ${p.location}. ${p.memberPrice}. AQI ${p.aqi}, ${p.noise} dB, ${p.commute}.`
  );
  return [
    'THE PORTFOLIO (all currently listed sanctuaries):',
    ...lines,
    '',
    `CONTACT: WhatsApp ${BUSINESS.phone} · ${BUSINESS.email}`,
    `WhatsApp link for a general enquiry: ${WHATSAPP.generic}`,
    'The adviser call is free and the team responds within 24 hours. Booking page: /adviser-call',
  ].join('\n');
}

export function formatContext(chunks: ScoredChunk[]): string {
  if (chunks.length === 0) return '(no matching reference material was found)';
  return chunks
    .map((c, i) => `[${i + 1}] ${c.title}${c.url ? ` (${c.url})` : ''}\n${c.text}`)
    .join('\n\n');
}
