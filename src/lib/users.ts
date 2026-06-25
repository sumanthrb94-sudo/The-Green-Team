import {
  doc, setDoc, getDoc, getDocs,
  collection, query, where, limit, serverTimestamp,
} from 'firebase/firestore';
import { db } from './firebase';

export interface UserProfile {
  uid: string;
  email: string | null;
  phone?: string | null;
  displayName: string | null;
  photoURL: string | null;
  name?: string;
  occupation?: string;
  city?: string;
  lat?: number;
  lng?: number;
  locationAccuracy?: number;
  firstSignIn?: { seconds: number } | null;
  lastSeen?: { seconds: number } | null;
}

export async function upsertUserProfile(uid: string, data: Partial<UserProfile>): Promise<boolean> {
  if (!db) return false;
  const ref = doc(db, 'users', uid);
  const snap = await getDoc(ref);
  const isNew = !snap.exists();
  if (isNew) {
    await setDoc(ref, { ...data, firstSignIn: serverTimestamp(), lastSeen: serverTimestamp() });
  } else {
    await setDoc(ref, { ...data, lastSeen: serverTimestamp() }, { merge: true });
  }
  return isNew;
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  if (!db) return null;
  const snap = await getDoc(doc(db, 'users', uid));
  return snap.exists() ? (snap.data() as UserProfile) : null;
}

export async function getAllUsers(): Promise<UserProfile[]> {
  if (!db) return [];
  const snap = await getDocs(collection(db, 'users'));
  return snap.docs.map(d => d.data() as UserProfile);
}

// ─── Duplicate-prevention helpers ──────────────────────────────────────
// Used by the post-sign-in profile capture step so a single human can't
// end up with two `users` records — one from the Google/email rail and
// another from the phone-OTP rail.

const normalizeEmail = (e: string) => e.trim().toLowerCase();

/** Normalize India-default phone to E.164 (+91XXXXXXXXXX). */
export function normalizePhone(raw: string): string {
  const trimmed = raw.trim().replace(/\s/g, '');
  if (trimmed.startsWith('+')) return '+' + trimmed.slice(1).replace(/\D/g, '');
  const digits = trimmed.replace(/\D/g, '');
  if (digits.length === 10) return '+91' + digits;
  if (digits.startsWith('91') && digits.length > 10) return '+' + digits;
  return digits ? '+' + digits : '';
}

export async function findUserByEmail(email: string): Promise<UserProfile | null> {
  if (!db || !email) return null;
  const q = query(collection(db, 'users'), where('email', '==', normalizeEmail(email)), limit(1));
  const snap = await getDocs(q);
  return snap.empty ? null : (snap.docs[0].data() as UserProfile);
}

export async function findUserByPhone(phone: string): Promise<UserProfile | null> {
  if (!db || !phone) return null;
  const q = query(collection(db, 'users'), where('phone', '==', normalizePhone(phone)), limit(1));
  const snap = await getDocs(q);
  return snap.empty ? null : (snap.docs[0].data() as UserProfile);
}
