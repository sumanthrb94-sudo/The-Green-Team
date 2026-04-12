import {
  collection,
  addDoc,
  getDocs,
  serverTimestamp,
  query,
  orderBy,
} from 'firebase/firestore';
import { db } from './firebase';

export interface Lead {
  id: string;
  name: string;
  email: string;
  phone?: string;
  intent?: string;
  source: 'membership';
  createdAt: { seconds: number } | null;
}

export interface NewsletterEntry {
  id: string;
  email: string;
  source: 'modal' | 'inline' | 'mobile_quick';
  createdAt: { seconds: number } | null;
}

export async function saveLead(data: { name: string; email: string; phone?: string; intent?: string }) {
  if (!db) return new Promise(r => setTimeout(r, 600));
  return addDoc(collection(db, 'leads'), {
    ...data,
    source: 'membership',
    createdAt: serverTimestamp(),
  });
}

export async function saveNewsletter(email: string, source: 'modal' | 'inline') {
  if (!db) return new Promise(r => setTimeout(r, 600));
  return addDoc(collection(db, 'newsletter'), {
    email,
    source,
    createdAt: serverTimestamp(),
  });
}

export async function getLeads(): Promise<Lead[]> {
  if (!db) return [];
  const q = query(collection(db, 'leads'), orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as Lead));
}

export async function getNewsletterSubs(): Promise<NewsletterEntry[]> {
  if (!db) return [];
  const q = query(collection(db, 'newsletter'), orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as NewsletterEntry));
}

import { onSnapshot } from 'firebase/firestore';

export function subscribeLeads(callback: (leads: Lead[]) => void): () => void {
  if (!db) return () => {};
  const q = query(collection(db, 'leads'), orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() } as Lead)));
  });
}

export function subscribeNewsletter(callback: (subs: NewsletterEntry[]) => void): () => void {
  if (!db) return () => {};
  const q = query(collection(db, 'newsletter'), orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() } as NewsletterEntry)));
  });
}
