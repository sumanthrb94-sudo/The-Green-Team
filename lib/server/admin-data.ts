import 'server-only';
import { Timestamp } from 'firebase-admin/firestore';
import { adminDb } from '@/lib/firebase/admin';
import { demoEnabled, DEMO_LEADS, DEMO_NEWSLETTER, DEMO_USERS, DEMO_PROPERTIES } from './demo-data';

/** Serialized (RSC-safe) admin views over the live Firestore collections. */

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
  lat?: number;
  lng?: number;
  locationAccuracy?: number;
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
  if (demoEnabled()) return DEMO_LEADS;
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
}

export async function fetchNewsletter(): Promise<AdminNewsletterEntry[]> {
  if (demoEnabled()) return DEMO_NEWSLETTER;
  const snap = await adminDb().collection('newsletter').orderBy('createdAt', 'desc').get();
  return snap.docs.map(d => {
    const x = d.data();
    return { id: d.id, email: x.email, source: x.source ?? 'unknown', createdAt: iso(x.createdAt) };
  });
}

export async function fetchUsers(): Promise<AdminUser[]> {
  if (demoEnabled()) return DEMO_USERS;
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
        lat: typeof x.lat === 'number' ? x.lat : undefined,
        lng: typeof x.lng === 'number' ? x.lng : undefined,
        locationAccuracy: typeof x.locationAccuracy === 'number' ? x.locationAccuracy : undefined,
        photoURL: x.photoURL ?? undefined,
        firstSignIn: iso(x.firstSignIn),
        lastSeen: iso(x.lastSeen),
      };
    })
    .sort((a, b) => (b.lastSeen ?? '').localeCompare(a.lastSeen ?? ''));
}

export async function fetchProperties(): Promise<AdminProperty[]> {
  if (demoEnabled()) return DEMO_PROPERTIES;
  const snap = await adminDb().collection('properties').get();
  return snap.docs
    .map(d => {
      const x = d.data();
      return { ...x, id: d.id, createdAt: iso(x.createdAt) } as AdminProperty;
    })
    .sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? ''));
}
