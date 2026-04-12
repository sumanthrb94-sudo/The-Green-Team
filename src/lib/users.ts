import {
  doc, setDoc, getDoc, getDocs,
  collection, serverTimestamp,
} from 'firebase/firestore';
import { db } from './firebase';

export interface UserProfile {
  uid: string;
  email: string | null;
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

import { onSnapshot } from 'firebase/firestore';

export function subscribeUsers(callback: (users: UserProfile[]) => void): () => void {
  if (!db) return () => {};
  return onSnapshot(collection(db, 'users'), (snap) => {
    callback(snap.docs.map(d => d.data() as UserProfile));
  });
}
