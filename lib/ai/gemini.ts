import 'server-only';

/**
 * The only module that talks to Gemini. Everything else in the RAG stack goes
 * through `embedOne` / `embedBatch` / `streamGenerate`, so the wire format,
 * the key, and the retry policy live in exactly one place.
 *
 * Bare fetch against the REST API rather than an SDK: the surface we need is
 * three endpoints, and the SDK would pull a dependency into a serverless bundle
 * for no gain.
 */

const BASE = 'https://generativelanguage.googleapis.com/v1beta';
/**
 * Embeddings are a single short round-trip. Generation is not: gemini-3.7-flash
 * reasons before emitting, and a tool-calling turn can sit silent well past 30s
 * before the first token — the abort covers the whole stream, so this ceiling
 * has to clear the slowest turn, not the average one. Kept under the route's
 * 60s maxDuration so the request fails cleanly rather than being killed.
 */
const EMBED_TIMEOUT_MS = 30_000;
const GENERATE_TIMEOUT_MS = 55_000;
const RETRY_DELAY_MS = 1200;
const MAX_ATTEMPTS = 4;
/** A free-tier quota window is ~60s; waiting longer than this means something else is wrong. */
const MAX_RETRY_WAIT_MS = 70_000;
/** Everything else — 400, 401, 403, 404 — is a bug or a bad key; retrying just burns latency. */
const RETRYABLE_STATUS = new Set([429, 500, 502, 503, 504]);
/**
 * Well under the API's 100 ceiling: on the free tier each item in a batch counts
 * against the per-minute request quota, so smaller batches fail sooner and
 * recover inside one quota window instead of losing a whole run.
 */
const EMBED_BATCH_SIZE = 25;

/**
 * Not the newest model on purpose: the newest carries the tightest free-tier
 * quota and exhausts within a day of real testing, while a model one generation
 * back answers this workload just as well with far more headroom.
 */
export const GEMINI_MODEL = process.env.GEMINI_MODEL ?? 'gemini-3.6-flash';
/** Tried in order when the one above is out of quota, overloaded, or retired. */
export const GEMINI_FALLBACK_MODELS = (
  process.env.GEMINI_FALLBACK_MODELS ?? 'gemini-3.5-flash,gemini-flash-lite-latest'
)
  .split(',')
  .map(m => m.trim())
  .filter(Boolean);
const GENERATION_CHAIN = [GEMINI_MODEL, ...GEMINI_FALLBACK_MODELS];
/**
 * Step down rather than fail. 404 is in here because Google retires model ids
 * for new projects without warning — a dead id in the chain should cost one
 * round-trip, not the whole conversation.
 */
const CAPACITY_STATUS = new Set([429, 404, 503]);

export const GEMINI_EMBED_MODEL = process.env.GEMINI_EMBED_MODEL ?? 'gemini-embedding-2';
export const EMBED_DIMS = 768;

export type EmbedTaskType = 'RETRIEVAL_DOCUMENT' | 'RETRIEVAL_QUERY';

export class GeminiError extends Error {
  /** HTTP status, or 0 when the request never produced a response. */
  status: number;
  /** True when the same call has a real chance of succeeding later. */
  retryable: boolean;

  constructor(message: string, status: number, retryable: boolean) {
    super(message);
    this.name = 'GeminiError';
    this.status = status;
    this.retryable = retryable;
  }
}

export function hasGeminiKey(): boolean {
  return !!process.env.GEMINI_API_KEY?.trim();
}

function apiKey(): string {
  const key = process.env.GEMINI_API_KEY?.trim();
  if (!key) {
    throw new GeminiError('GEMINI_API_KEY is not configured — the assistant cannot reach Gemini', 0, false);
  }
  return key;
}

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/** Fresh per attempt, so a retry gets its own full 30s rather than the leftovers. */
function attemptSignal(timeoutMs: number, caller?: AbortSignal): AbortSignal {
  const timeout = AbortSignal.timeout(timeoutMs);
  return caller ? AbortSignal.any([caller, timeout]) : timeout;
}

/**
 * Free-tier quota errors carry the wait the server actually wants, either as a
 * structured RetryInfo or inside the message. Honouring it is the difference
 * between an index build that completes and one that dies on chunk 100.
 */
async function errorDetail(res: Response): Promise<{ message: string; retryAfterMs: number }> {
  const headerHint = Number(res.headers.get('retry-after')) * 1000;
  let text = '';
  try {
    text = await res.text();
  } catch {
    return { message: res.statusText || 'no detail', retryAfterMs: headerHint || 0 };
  }

  let message = text.slice(0, 300) || res.statusText || 'no detail';
  let retryAfterMs = headerHint || 0;
  try {
    const parsed = JSON.parse(text) as {
      error?: { message?: string; details?: Array<{ retryDelay?: string }> };
    };
    if (parsed.error?.message) message = parsed.error.message;
    const structured = parsed.error?.details?.find(d => d.retryDelay)?.retryDelay;
    const seconds = structured
      ? parseFloat(structured)
      : parseFloat(message.match(/retry in ([\d.]+)s/i)?.[1] ?? '');
    if (Number.isFinite(seconds) && seconds > 0) retryAfterMs = seconds * 1000;
  } catch {
    /* body was not JSON */
  }
  return { message, retryAfterMs };
}

/**
 * Returns a response whose body is still unread, so the streaming caller can
 * take it over.
 */
async function post(
  path: string,
  body: unknown,
  timeoutMs: number,
  callerSignal?: AbortSignal,
  opts?: { maxAttempts?: number }
): Promise<Response> {
  const key = apiKey();
  const payload = JSON.stringify(body);
  const maxAttempts = opts?.maxAttempts ?? MAX_ATTEMPTS;
  let lastError: GeminiError | undefined;
  let waitMs = RETRY_DELAY_MS;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    if (attempt > 0) await sleep(waitMs);

    let res: Response;
    try {
      res = await fetch(`${BASE}${path}`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-goog-api-key': key },
        body: payload,
        signal: attemptSignal(timeoutMs, callerSignal),
      });
    } catch (err) {
      if (callerSignal?.aborted) throw new GeminiError('Gemini request cancelled by caller', 0, false);
      const timedOut = err instanceof Error && err.name === 'TimeoutError';
      throw new GeminiError(
        timedOut
          ? `Gemini did not respond within ${timeoutMs / 1000}s`
          : `Gemini request failed: ${err instanceof Error ? err.message : String(err)}`,
        0,
        true
      );
    }

    if (res.ok) return res;

    const retryable = RETRYABLE_STATUS.has(res.status);
    const { message, retryAfterMs } = await errorDetail(res);
    lastError = new GeminiError(`Gemini ${res.status} on ${path}: ${message}`, res.status, retryable);
    if (!retryable) throw lastError;
    // Server-suggested wait wins; otherwise back off exponentially.
    waitMs = Math.min(Math.max(retryAfterMs, RETRY_DELAY_MS * 2 ** attempt), MAX_RETRY_WAIT_MS);
  }

  throw lastError!;
}

/* ------------------------------------------------------------------ */
/* Embeddings                                                          */
/* ------------------------------------------------------------------ */

interface BatchEmbedResponse {
  embeddings?: Array<{ values?: number[] }>;
}

/**
 * Batches run sequentially: indexing is a background job, and firing dozens of
 * 100-item requests at once is the fastest way to earn a 429.
 */
export async function embedBatch(texts: string[], taskType: EmbedTaskType): Promise<number[][]> {
  if (texts.length === 0) return [];

  const out: number[][] = [];
  for (let i = 0; i < texts.length; i += EMBED_BATCH_SIZE) {
    const slice = texts.slice(i, i + EMBED_BATCH_SIZE);
    const res = await post(
      `/models/${GEMINI_EMBED_MODEL}:batchEmbedContents`,
      {
        requests: slice.map(text => ({
          model: `models/${GEMINI_EMBED_MODEL}`,
          content: { parts: [{ text }] },
          taskType,
          outputDimensionality: EMBED_DIMS,
        })),
      },
      EMBED_TIMEOUT_MS
    );

    const data = (await res.json()) as BatchEmbedResponse;
    const embeddings = data.embeddings;
    if (!Array.isArray(embeddings) || embeddings.length !== slice.length) {
      throw new GeminiError(
        `Gemini returned ${embeddings?.length ?? 0} embeddings for ${slice.length} inputs`,
        0,
        false
      );
    }
    // A short vector would silently poison every cosine score it touches.
    for (const item of embeddings) {
      const values = item?.values;
      if (!Array.isArray(values) || values.length === 0) {
        throw new GeminiError('Gemini returned an empty embedding vector', 0, false);
      }
      out.push(values);
    }
  }
  return out;
}

export async function embedOne(text: string, taskType: EmbedTaskType): Promise<number[]> {
  const [vector] = await embedBatch([text], taskType);
  return vector;
}

/* ------------------------------------------------------------------ */
/* Generation                                                          */
/* ------------------------------------------------------------------ */

export interface GeminiTool {
  functionDeclarations: Array<{ name: string; description: string; parameters: unknown }>;
}

export interface GeminiTurn {
  role: 'user' | 'model';
  parts: unknown[];
}

export type GeminiPart =
  | { type: 'text'; text: string }
  | { type: 'functionCall'; id?: string; name: string; args: Record<string, unknown>; raw: unknown };

interface WirePart {
  text?: string;
  thought?: boolean;
  functionCall?: { name?: string; args?: Record<string, unknown>; id?: string };
}

interface SseChunk {
  candidates?: Array<{ content?: { parts?: WirePart[] } }>;
}

function* partsFromLine(line: string): Generator<GeminiPart> {
  const trimmed = line.trim();
  // Blank separators and ':' keep-alive comments carry nothing.
  if (!trimmed.startsWith('data:')) return;
  const payload = trimmed.slice(5).trim();
  if (!payload || payload === '[DONE]') return;

  let chunk: SseChunk;
  try {
    chunk = JSON.parse(payload) as SseChunk;
  } catch {
    return;
  }

  for (const part of chunk.candidates?.[0]?.content?.parts ?? []) {
    if (part.functionCall?.name) {
      // `raw` is the untouched part because Gemini 3 hangs a `thoughtSignature`
      // off it that must be echoed back verbatim on the model turn, or the
      // follow-up call carrying the tool result is rejected.
      yield {
        type: 'functionCall',
        id: part.functionCall.id,
        name: part.functionCall.name,
        args: part.functionCall.args ?? {},
        raw: part,
      };
    } else if (part.text && part.thought !== true) {
      yield { type: 'text', text: part.text };
    }
  }
}

export async function* streamGenerate(opts: {
  system: string;
  contents: GeminiTurn[];
  tools?: GeminiTool[];
  maxOutputTokens?: number;
  signal?: AbortSignal;
}): AsyncGenerator<GeminiPart> {
  const body: Record<string, unknown> = {
    systemInstruction: { parts: [{ text: opts.system }] },
    contents: opts.contents,
  };
  if (opts.tools?.length) body.tools = opts.tools;
  if (opts.maxOutputTokens) body.generationConfig = { maxOutputTokens: opts.maxOutputTokens };

  /**
   * The newest model has the tightest free-tier quota, and a person waiting on a
   * reply cannot afford the ~45s the API asks us to wait out. So a quota or
   * capacity error steps down the chain instead of retrying in place: a slightly
   * smaller model answering now beats the best model answering never.
   */
  let res: Response | undefined;
  let lastError: GeminiError | undefined;

  for (const model of GENERATION_CHAIN) {
    try {
      res = await post(
        `/models/${model}:streamGenerateContent?alt=sse`,
        body,
        GENERATE_TIMEOUT_MS,
        opts.signal,
        { maxAttempts: 1 }
      );
      break;
    } catch (err) {
      if (!(err instanceof GeminiError) || !CAPACITY_STATUS.has(err.status)) throw err;
      lastError = err;
      console.warn(`[gemini] ${model} unavailable (${err.status}) — stepping down`);
    }
  }

  if (!res) throw lastError ?? new GeminiError('No Gemini model available', 503, true);
  if (!res.body) throw new GeminiError('Gemini returned a response with no stream body', 0, true);

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      let newline = buffer.indexOf('\n');
      while (newline !== -1) {
        const line = buffer.slice(0, newline);
        buffer = buffer.slice(newline + 1);
        yield* partsFromLine(line);
        newline = buffer.indexOf('\n');
      }
    }
    yield* partsFromLine(buffer);
  } finally {
    // Releases the socket when the consumer breaks out early.
    reader.cancel().catch(() => {});
  }
}
