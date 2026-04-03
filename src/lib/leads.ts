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
  intent?: string;
  source: 'membership';
  createdAt: { seconds: number } | null;
}

export interface NewsletterEntry {
  id: string;
  email: string;
  source: 'modal' | 'inline';
  createdAt: { seconds: number } | null;
}

export async function saveLead(data: { name: string; email: string; intent?: string }) {
  return addDoc(collection(db, 'leads'), {
    ...data,
    source: 'membership',
    createdAt: serverTimestamp(),
  });
}

export async function saveNewsletter(email: string, source: 'modal' | 'inline') {
  return addDoc(collection(db, 'newsletter'), {
    email,
    source,
    createdAt: serverTimestamp(),
  });
}

export async function getLeads(): Promise<Lead[]> {
  const q = query(collection(db, 'leads'), orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as Lead));
}

export async function getNewsletterSubs(): Promise<NewsletterEntry[]> {
  const q = query(collection(db, 'newsletter'), orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as NewsletterEntry));
}
