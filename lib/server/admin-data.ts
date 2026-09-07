import 'server-only';
import { unstable_cache } from 'next/cache';
import { Timestamp } from 'firebase-admin/firestore';
import { adminDb } from '@/lib/firebase/admin';
import { requireAdmin } from '@/lib/server/session';
import type { ConversationDoc, ToolName } from '@/lib/rag/types';
import { demoEnabled, DEMO_LEADS, DEMO_NEWSLETTER, DEMO_USERS, DEMO_PROPERTIES } from './demo-data';

/**
 * Serialized (RSC-safe) admin views over the live Firestore collections.
 *
 * Every reader here calls requireAdmin() FIRST. This is the real authorization
 * boundary — not the admin layout. In the App Router a layout and its child
 * page render concurrently, so a layout that swaps in an auth wall does NOT
 * stop the child page's data fetch: the page still executes and its result is
 * streamed to the client in the RSC flight payload, visible to `curl` even
 * though the browser hides it. Gating at the data source means admin PII can
 * never leave the server without a verified admin session, regardless of what
 * any current or future page component does.
 *
 * Each reader is a thin authorised wrapper around a cached query. The order
 * matters and is not negotiable: requireAdmin() runs on every call, OUTSIDE the
 * cache, and only the Firestore read is cached. Putting the auth check inside
 * would let the first admin's result be served to whoever asked next.
 *
 * The cache is deliberately short. A Firestore round trip from the serverless
 * region costs roughly 350ms, and clicking between admin tabs paid it every
 * time — the dashboard paid it four times. Thirty seconds of staleness is
 * invisible to someone working a lead list and turns every repeat navigation
 * into a local read.
 */
const CACHE_SECONDS = 30;

/** Cache one query, keyed by name, revalidated on a short clock. */
const cached = <T,>(key: string, fn: () => Promise<T>) =>
  unstable_cache(fn, [`admin:${key}`], { revalidate: CACHE_SECONDS, tags: [`admin:${key}`, 'admin'] });

export type LeadStatus = 'new' | 'contacted' | 'site-visit' | 'closed';

export interface AdminLead {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  intent?: string;
  source: string;
  status: LeadStatus;
  createdAt: string | null;
}

export interface AdminNewsletterEntry {
  id: string;
  email: string;
  source: string;
  createdAt: string | null;
}

export interface AdminUser {
  id: string;
  email?: string;
  displayName?: string;
  name?: string;
  occupation?: string;
  city?: string;
  photoURL?: string;
  firstSignIn: string | null;
  lastSeen: string | null;
}

export interface AdminProperty {
  id: string;
  title: string;
  location: string;
  memberPrice: string;
  image: string;
  aqi: number;
  noise: number;
  commute: string;
  status: 'live' | 'draft';
  createdAt: string | null;
  [k: string]: unknown;
}

const iso = (v: unknown): string | null => (v instanceof Timestamp ? v.toDate().toISOString() : null);

export async function fetchLeads(): Promise<AdminLead[]> {
  await requireAdmin();
  if (demoEnabled()) return DEMO_LEADS;
  return cached<AdminLead[]>('leads', async () => {
  const snap = await adminDb().collection('leads').orderBy('createdAt', 'desc').get();
  return snap.docs.map(d => {
    const x = d.data();
    return {
      id: d.id,
      name: x.name ?? 'Unknown',
      email: x.email,
      phone: x.phone,
      intent: x.intent,
      source: x.source ?? 'unspecified',
      status: (x.status as LeadStatus) ?? 'new',
      createdAt: iso(x.createdAt),
    };
  });
  })();
}

export async function fetchNewsletter(): Promise<AdminNewsletterEntry[]> {
  await requireAdmin();
  if (demoEnabled()) return DEMO_NEWSLETTER;
  return cached<AdminNewsletterEntry[]>('newsletter', async () => {
  const snap = await adminDb().collection('newsletter').orderBy('createdAt', 'desc').get();
  return snap.docs.map(d => {
    const x = d.data();
    return { id: d.id, email: x.email, source: x.source ?? 'unknown', createdAt: iso(x.createdAt) };
  });
  })();
}

export async function fetchUsers(): Promise<AdminUser[]> {
  await requireAdmin();
  if (demoEnabled()) return DEMO_USERS;
  return cached<AdminUser[]>('users', async () => {
  const snap = await adminDb().collection('users').get();
  return snap.docs
    .map(d => {
      const x = d.data();
      return {
        id: d.id,
        email: x.email ?? undefined,
        displayName: x.displayName ?? undefined,
        name: x.name ?? undefined,
        occupation: x.occupation ?? undefined,
        city: x.city ?? undefined,
        photoURL: x.photoURL ?? undefined,
        firstSignIn: iso(x.firstSignIn),
        lastSeen: iso(x.lastSeen),
      };
    })
    .sort((a, b) => (b.lastSeen ?? '').localeCompare(a.lastSeen ?? ''));
  })();
}

export async function fetchProperties(): Promise<AdminProperty[]> {
  await requireAdmin();
  if (demoEnabled()) return DEMO_PROPERTIES;
  return cached<AdminProperty[]>('properties', async () => {
  const snap = await adminDb().collection('properties').get();
  return snap.docs
    .map(d => {
      const x = d.data();
      return { ...x, id: d.id, createdAt: iso(x.createdAt) } as AdminProperty;
    })
    .sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? ''));
  })();
}

export type AdminConversation = ConversationDoc & { id: string };

/** The chat writer may stamp times as Timestamps or as ISO strings; both must leave here as strings. */
const isoOr = (v: unknown, fallback: string): string =>
  v instanceof Timestamp ? v.toDate().toISOString() : typeof v === 'string' ? v : fallback;

export async function getConversations(limit = 100): Promise<AdminConversation[]> {
  await requireAdmin();
  return cached<AdminConversation[]>(`conversations:${limit}`, async () => {
  if (demoEnabled()) return []; // no fictional transcripts exist, and demo runs without Firestore credentials
  const snap = await adminDb().collection('conversations').orderBy('updatedAt', 'desc').limit(limit).get();
  return snap.docs.map(d => {
    const x = d.data();
    const startedAt = isoOr(x.startedAt, '');
    const messages: Record<string, unknown>[] = Array.isArray(x.messages) ? x.messages : [];
    const actions: Record<string, unknown>[] = Array.isArray(x.actions) ? x.actions : [];
    return {
      id: d.id,
      startedAt,
      updatedAt: isoOr(x.updatedAt, startedAt),
      userName: x.userName ?? undefined,
      uid: x.uid ?? undefined,
      messages: messages.map(m => ({
        role: m.role === 'model' ? ('model' as const) : ('user' as const),
        text: typeof m.text === 'string' ? m.text : '',
        at: isoOr(m.at, startedAt),
      })),
      actions: actions.map(a => ({
        tool: a.tool as ToolName,
        ok: a.ok !== false,
        args: (a.args ?? {}) as Record<string, string>,
        at: isoOr(a.at, startedAt),
      })),
      leadIds: Array.isArray(x.leadIds) ? (x.leadIds as string[]) : [],
      status: (x.status as ConversationDoc['status']) ?? 'ok',
      turns: typeof x.turns === 'number' ? x.turns : messages.filter(m => m.role === 'user').length,
    };
  });
  })();
}

export interface AdminReview {
  id: string;
  name: string;
  rating: number;
  text: string;
  status: string;
  propertyId?: string;
  createdAt: string | null;
}

/** The moderation queue. Same shape the page rendered inline before — moved
 *  here so it sits behind the same auth gate and the same cache as everything
 *  else, instead of being the one tab that still paid a round trip per click. */
export async function fetchReviews(): Promise<AdminReview[]> {
  await requireAdmin();
  return cached<AdminReview[]>('reviews', async () => {
    const snap = await adminDb().collection('reviews').orderBy('createdAt', 'desc').get();
    return snap.docs.map(d => {
      const v = d.data();
      return {
        id: d.id,
        name: String(v.name ?? 'Anonymous'),
        rating: Number(v.rating ?? 0),
        text: String(v.text ?? ''),
        status: String(v.status ?? 'pending'),
        propertyId: v.propertyId ? String(v.propertyId) : undefined,
        createdAt: iso(v.createdAt),
      };
    });
  })();
}
