import { NextRequest } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { streamGenerate, hasGeminiKey } from '@/lib/ai/gemini';
import { TOOL_DECLARATIONS, executeTool } from '@/lib/ai/tools';
import { buildSystemPrompt } from '@/lib/ai/persona';
import { retrieve, pinnedFacts, formatContext } from '@/lib/rag/retrieve';
import { GROOT_FALLBACK } from '@/lib/data/groot';
import { SITE_URL, WHATSAPP } from '@/lib/data/contact';
import type {
  ChatEvent,
  ChatMessage,
  ConversationDoc,
  StoredAction,
  ToolName,
} from '@/lib/rag/types';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const MAX_TOOL_ROUNDS = 3;
const MAX_HISTORY = 12;
const MAX_CHARS = 1200;
const RATE_LIMIT = { max: 20, windowMs: 10 * 60 * 1000 };

/**
 * Burst protection for a public, unauthenticated LLM endpoint. This is
 * per-container, so it bounds a single abusive source hitting a warm instance
 * rather than providing a global guarantee — the tighter cap that matters for
 * cost is MAX_TOOL_ROUNDS plus the history and length caps below.
 */
const hits = new Map<string, number[]>();

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter(t => now - t < RATE_LIMIT.windowMs);
  recent.push(now);
  hits.set(ip, recent);
  if (hits.size > 5000) hits.clear();
  return recent.length > RATE_LIMIT.max;
}

/**
 * Rejects cross-origin callers without guessing which hostname the site is
 * served on. The primary test is origin-host === request-host, which is true for
 * every same-origin fetch on any domain — apex, www, a preview URL or a future
 * rebrand. An earlier version compared against SITE_URL alone and 403'd every
 * visitor on www.thegreenteam.in.
 */
function allowedOrigin(req: NextRequest): boolean {
  const origin = req.headers.get('origin');
  if (!origin) return true; // same-origin fetches and server-side callers omit it

  let originHost: string;
  try {
    originHost = new URL(origin).host.toLowerCase();
  } catch {
    return false;
  }

  const selfHost = req.headers.get('host')?.toLowerCase();
  if (selfHost && originHost === selfHost) return true;

  let siteHost = '';
  try {
    siteHost = new URL(SITE_URL).host.toLowerCase();
  } catch {
    /* SITE_URL is a constant; this cannot realistically throw */
  }
  const bare = siteHost.replace(/^www\./, '');

  return (
    originHost === bare ||
    originHost === `www.${bare}` ||
    originHost.endsWith('.vercel.app') ||
    originHost.startsWith('localhost') ||
    originHost.startsWith('127.0.0.1')
  );
}

export async function POST(req: NextRequest) {
  if (!allowedOrigin(req)) {
    return Response.json(
      { error: 'forbidden', message: GROOT_FALLBACK, href: WHATSAPP.generic },
      { status: 403 }
    );
  }

  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    'unknown';

  if (rateLimited(ip)) {
    return Response.json(
      {
        error: 'rate_limited',
        message: 'That is a lot of questions in a short window. An adviser can pick this up on WhatsApp right away.',
        href: WHATSAPP.generic,
      },
      { status: 429 }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: 'bad_request', message: GROOT_FALLBACK }, { status: 400 });
  }

  const raw = (body ?? {}) as Record<string, unknown>;
  const history: ChatMessage[] = (Array.isArray(raw.messages) ? raw.messages : [])
    .slice(-MAX_HISTORY)
    .map(m => {
      const msg = m as Record<string, unknown>;
      return {
        role: msg.role === 'model' ? ('model' as const) : ('user' as const),
        text: String(msg.text ?? '').slice(0, MAX_CHARS),
      };
    })
    .filter(m => m.text.length > 0);

  const userName = typeof raw.userName === 'string' ? raw.userName.slice(0, 80) : undefined;
  const conversationId =
    typeof raw.conversationId === 'string' && /^[A-Za-z0-9_-]{6,64}$/.test(raw.conversationId)
      ? raw.conversationId
      : undefined;

  const question = [...history].reverse().find(m => m.role === 'user')?.text ?? '';
  if (!question) return Response.json({ error: 'no_question', message: GROOT_FALLBACK }, { status: 400 });

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const emit = (event: ChatEvent) => {
        controller.enqueue(encoder.encode(JSON.stringify(event) + '\n'));
      };

      const answerParts: string[] = [];
      const actions: StoredAction[] = [];
      const leadIds: string[] = [];
      let status: ConversationDoc['status'] = 'ok';

      try {
        const [retrieval, pinned] = await Promise.all([retrieve(question, history), pinnedFacts()]);
        if (retrieval.empty) status = 'refused';

        if (!hasGeminiKey()) throw new Error('missing GEMINI_API_KEY');

        const system = buildSystemPrompt({
          pinned,
          context: formatContext(retrieval.chunks),
          userName,
          noContext: retrieval.empty,
        });

        const contents = history.map(m => ({
          role: m.role === 'model' ? ('model' as const) : ('user' as const),
          parts: [{ text: m.text }] as unknown[],
        }));

        for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
          const modelParts: unknown[] = [];
          const calls: Array<{ id?: string; name: string; args: Record<string, unknown> }> = [];
          let textBuffer = '';

          const flushText = () => {
            if (textBuffer) {
              modelParts.push({ text: textBuffer });
              textBuffer = '';
            }
          };

          for await (const part of streamGenerate({
            system,
            contents,
            tools: [TOOL_DECLARATIONS],
          })) {
            if (part.type === 'text') {
              textBuffer += part.text;
              answerParts.push(part.text);
              emit({ type: 'token', text: part.text });
            } else {
              flushText();
              // `raw` carries Gemini 3.x thoughtSignature — it must be echoed
              // back verbatim on the model turn or the follow-up call errors.
              modelParts.push(part.raw);
              calls.push({ id: part.id, name: part.name, args: part.args });
            }
          }
          flushText();

          if (calls.length === 0) break;

          contents.push({ role: 'model', parts: modelParts });

          const responses: unknown[] = [];
          for (const call of calls) {
            const result = await executeTool(call.name as ToolName, call.args);
            emit({
              type: 'action',
              action: call.name as ToolName,
              ok: result.ok,
              data: result.payload,
            });
            actions.push({
              tool: call.name as ToolName,
              ok: result.ok,
              args: result.storedArgs,
              at: new Date().toISOString(),
            });
            if (result.leadId) leadIds.push(result.leadId);
            responses.push({
              functionResponse: { name: call.name, id: call.id, response: result.forModel },
            });
          }
          contents.push({ role: 'user', parts: responses });
        }

        if (retrieval.chunks.length > 0) {
          const seen = new Set<string>();
          const items = retrieval.chunks
            .filter(c => c.url && !seen.has(c.url) && seen.add(c.url))
            .slice(0, 3)
            .map(c => ({ title: c.title, url: c.url }));
          if (items.length > 0) emit({ type: 'sources', items });
        }
      } catch (err) {
        // The chat must still convert when the provider is unreachable: answer
        // from retrieval alone and put a human one tap away.
        status = 'degraded';
        console.error('[chat] falling back:', err instanceof Error ? err.message : err);
        const fallbackText = answerParts.length > 0 ? '' : GROOT_FALLBACK;
        if (fallbackText) {
          answerParts.push(fallbackText);
          emit({ type: 'token', text: fallbackText });
        }
        emit({
          type: 'action',
          action: 'whatsapp_handoff',
          ok: true,
          data: {
            message: 'An adviser can answer this directly.',
            ctaLabel: 'Continue on WhatsApp',
            ctaHref: WHATSAPP.generic,
          },
        });
      }

      let savedId = conversationId ?? '';
      try {
        savedId = await persist({
          conversationId,
          history,
          answer: answerParts.join(''),
          actions,
          leadIds,
          status,
          userName,
        });
      } catch (err) {
        console.error('[chat] transcript write failed:', err);
      }

      emit({ type: 'done', conversationId: savedId });
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'application/x-ndjson; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Accel-Buffering': 'no',
    },
  });
}

async function persist(opts: {
  conversationId?: string;
  history: ChatMessage[];
  answer: string;
  actions: StoredAction[];
  leadIds: string[];
  status: ConversationDoc['status'];
  userName?: string;
}): Promise<string> {
  const now = new Date().toISOString();
  const db = adminDb();
  const turn = [...opts.history].reverse().find(m => m.role === 'user');

  const newMessages = [
    ...(turn ? [{ role: turn.role, text: turn.text, at: now }] : []),
    ...(opts.answer ? [{ role: 'model' as const, text: opts.answer, at: now }] : []),
  ];

  if (opts.conversationId) {
    const ref = db.collection('conversations').doc(opts.conversationId);
    const snap = await ref.get();
    if (snap.exists) {
      const prev = snap.data() as ConversationDoc;
      await ref.set(
        {
          updatedAt: now,
          messages: [...(prev.messages ?? []), ...newMessages].slice(-60),
          actions: [...(prev.actions ?? []), ...opts.actions],
          leadIds: Array.from(new Set([...(prev.leadIds ?? []), ...opts.leadIds])),
          status: opts.status,
          turns: (prev.turns ?? 0) + 1,
          ...(opts.userName ? { userName: opts.userName } : {}),
        },
        { merge: true }
      );
      return opts.conversationId;
    }
  }

  const ref = db.collection('conversations').doc();
  const doc: ConversationDoc = {
    startedAt: now,
    updatedAt: now,
    messages: newMessages,
    actions: opts.actions,
    leadIds: opts.leadIds,
    status: opts.status,
    turns: 1,
    ...(opts.userName ? { userName: opts.userName } : {}),
  };
  await ref.set(doc);
  return ref.id;
}
