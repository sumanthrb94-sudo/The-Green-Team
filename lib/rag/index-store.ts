import 'server-only';
import { adminDb } from '@/lib/firebase/admin';
import type { KbChunk } from './types';

/**
 * Persistence + caching for the embedded knowledge index.
 *
 * The index lives in Firestore rather than in a build artifact because admins
 * edit property copy and pricing in the dashboard — a build-time index would
 * force a redeploy to refresh, which is exactly the staleness this replaces.
 */

const COLLECTION = 'kb_chunks';
const CACHE_TTL_MS = 10 * 60 * 1000;
const WRITE_BATCH = 400; // Firestore caps a batch at 500 ops

export interface IndexedChunk extends KbChunk {
  embedding: number[];
}

let cache: { chunks: IndexedChunk[]; loadedAt: number } | null = null;
let inflight: Promise<IndexedChunk[]> | null = null;

/**
 * Serverless containers are reused across requests, so the first request into a
 * cold container pays one collection read and every later request in its
 * lifetime pays nothing. Concurrent cold requests share a single read.
 */
export async function loadIndex(force = false): Promise<IndexedChunk[]> {
  const fresh = cache && Date.now() - cache.loadedAt < CACHE_TTL_MS;
  if (fresh && !force) return cache!.chunks;
  if (inflight && !force) return inflight;

  inflight = (async () => {
    const snap = await adminDb().collection(COLLECTION).get();
    const chunks = snap.docs
      .map(d => {
        const data = d.data();
        const embedding = data.embedding;
        if (!Array.isArray(embedding) || embedding.length === 0) return null;
        return {
          id: d.id,
          text: String(data.text ?? ''),
          title: String(data.title ?? ''),
          source: data.source,
          url: data.url ?? undefined,
          propertyId: data.propertyId ?? undefined,
          contentHash: String(data.contentHash ?? ''),
          embedding: embedding as number[],
        } as IndexedChunk;
      })
      .filter((c): c is IndexedChunk => c !== null && c.text.length > 0);

    cache = { chunks, loadedAt: Date.now() };
    return chunks;
  })();

  try {
    return await inflight;
  } finally {
    inflight = null;
  }
}

export function invalidateIndexCache(): void {
  cache = null;
}

/** id → contentHash, so indexing can skip chunks whose text has not changed. */
export async function listIndexedHashes(): Promise<Map<string, string>> {
  const snap = await adminDb().collection(COLLECTION).select('contentHash').get();
  const map = new Map<string, string>();
  for (const doc of snap.docs) map.set(doc.id, String(doc.data().contentHash ?? ''));
  return map;
}

export async function writeChunks(chunks: IndexedChunk[]): Promise<void> {
  const db = adminDb();
  for (let i = 0; i < chunks.length; i += WRITE_BATCH) {
    const batch = db.batch();
    for (const chunk of chunks.slice(i, i + WRITE_BATCH)) {
      const { id, ...rest } = chunk;
      batch.set(db.collection(COLLECTION).doc(id), {
        ...rest,
        url: rest.url ?? null,
        propertyId: rest.propertyId ?? null,
        updatedAt: new Date().toISOString(),
      });
    }
    await batch.commit();
  }
  invalidateIndexCache();
}

/** Removes chunks whose source content no longer exists. */
export async function deleteChunks(ids: string[]): Promise<void> {
  if (ids.length === 0) return;
  const db = adminDb();
  for (let i = 0; i < ids.length; i += WRITE_BATCH) {
    const batch = db.batch();
    for (const id of ids.slice(i, i + WRITE_BATCH)) {
      batch.delete(db.collection(COLLECTION).doc(id));
    }
    await batch.commit();
  }
  invalidateIndexCache();
}

export async function indexSize(): Promise<number> {
  const snap = await adminDb().collection(COLLECTION).count().get();
  return snap.data().count;
}
