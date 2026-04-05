import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  serverTimestamp,
  query,
  orderBy,
} from 'firebase/firestore';
import { db } from './firebase';

export interface PropertyDoc {
  id: string;
  title: string;
  location: string;
  lat?: number;
  lng?: number;
  aqi: number;
  noise: number;
  commute: string;
  valuation: string;
  memberPrice: string;
  image: string;
  tagline?: string;
  description?: string;
  plots?: number;
  plotRange?: string;
  amenityAcres?: string;
  architect?: string;
  features?: string[];
  pricePerSqYd?: number;
  sitePlanSrc?: string;
  brochureUrl?: string;
  status: 'live' | 'draft';
  order?: number;
  createdAt?: { seconds: number } | null;
}

export type PropertyInput = Omit<PropertyDoc, 'id' | 'createdAt'>;

/** Real-time subscription — calls cb on every change */
export function subscribeProperties(cb: (props: PropertyDoc[]) => void): () => void {
  if (!db) return () => {};
  const q = query(collection(db, 'properties'), orderBy('createdAt', 'desc'));
  return onSnapshot(q, snap => {
    cb(snap.docs.map(d => ({ id: d.id, ...d.data() } as PropertyDoc)));
  });
}

export async function createProperty(data: PropertyInput) {
  return addDoc(collection(db, 'properties'), {
    ...data,
    createdAt: serverTimestamp(),
  });
}

export async function updateProperty(id: string, data: Partial<PropertyInput>) {
  return updateDoc(doc(db, 'properties', id), data);
}

export async function deleteProperty(id: string) {
  return deleteDoc(doc(db, 'properties', id));
}
