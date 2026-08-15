/**
 * Shared contracts for the Groot RAG stack.
 *
 * Everything here is plain data — no Firestore types, no server-only imports —
 * so both the API route and the client component can depend on it.
 */

/** A retrievable unit of knowledge. One fact-cluster, not one document. */
export interface KbChunk {
  /** Stable, deterministic id — `${source}:${key}`. Doubles as the Firestore doc id. */
  id: string;
  /** The text the model reads. Self-contained: always names its subject. */
  text: string;
  /** Human label used in citations, e.g. "MODCON Agartha — Pricing". */
  title: string;
  source: KbSource;
  /** On-site path the reader can open, e.g. "/sanctuaries/agartha". */
  url?: string;
  /** Set when the chunk belongs to a specific property. */
  propertyId?: string;
  /** sha256 of `text` — lets indexing skip unchanged chunks. */
  contentHash: string;
}

export type KbSource = 'property' | 'journal' | 'map' | 'layout' | 'contact' | 'faq';

/** A chunk plus its similarity to the query. */
export interface ScoredChunk extends KbChunk {
  score: number;
}

/** What `retrieve()` hands the prompt builder. */
export interface RetrievalResult {
  chunks: ScoredChunk[];
  /** True when nothing cleared the relevance floor — the refuse-and-hand-off path. */
  empty: boolean;
}

/* ------------------------------------------------------------------ */
/* Chat wire protocol — NDJSON, one JSON object per line               */
/* ------------------------------------------------------------------ */

export type ChatRole = 'user' | 'model';

export interface ChatMessage {
  role: ChatRole;
  text: string;
}

/** Request body for POST /api/chat */
export interface ChatRequest {
  messages: ChatMessage[];
  userName?: string;
  /** Echoed back so the server can append to an existing transcript. */
  conversationId?: string;
}

/** Server → client events. Each is serialised on its own line. */
export type ChatEvent =
  | { type: 'token'; text: string }
  | { type: 'action'; action: ToolName; ok: boolean; data: ActionPayload }
  | { type: 'sources'; items: SourceRef[] }
  | { type: 'done'; conversationId: string }
  | { type: 'error'; text: string };

export interface SourceRef {
  title: string;
  url?: string;
}

/** Rendered by the client as a card with a real button. */
export interface ActionPayload {
  /** Short confirmation line, e.g. "Site visit requested for MODCON Agartha." */
  message: string;
  /** Optional call-to-action rendered as a button. */
  ctaLabel?: string;
  ctaHref?: string;
}

export type ToolName =
  | 'book_site_visit'
  | 'capture_lead'
  | 'subscribe_newsletter'
  | 'get_brochure'
  | 'whatsapp_handoff';

/* ------------------------------------------------------------------ */
/* Stored transcripts                                                  */
/* ------------------------------------------------------------------ */

export interface StoredAction {
  tool: ToolName;
  ok: boolean;
  /** Sanitised args — never raw model output. */
  args: Record<string, string>;
  at: string;
}

export interface ConversationDoc {
  startedAt: string;
  updatedAt: string;
  userName?: string;
  uid?: string;
  messages: Array<ChatMessage & { at: string }>;
  actions: StoredAction[];
  leadIds: string[];
  /** 'ok' | 'degraded' (LLM unreachable) | 'refused' (no context found) */
  status: 'ok' | 'degraded' | 'refused';
  turns: number;
}
