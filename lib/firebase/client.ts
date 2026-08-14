/**
 * Firebase client SDK — browser side. The config values are public client
 * identifiers (they ship in every browser bundle); env vars override them so
 * a different project can be pointed at without a code change.
 */
import { initializeApp, getApps } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? 'AIzaSyAZxHDQFoThcPM-RHN5ZNAttn2vewHsciE',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? 'thegreenteam-17cfc.firebaseapp.com',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? 'thegreenteam-17cfc',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ?? 'thegreenteam-17cfc.firebasestorage.app',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? '167305715523',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID ?? '1:167305715523:web:c4f4ac7083405a4bf2d9f6',
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID ?? 'G-LJ6RM1GV6S',
};

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);

export const googleProvider = (() => {
  const p = new GoogleAuthProvider();
  p.addScope('profile');
  p.addScope('email');
  p.setCustomParameters({ prompt: 'select_account' });
  return p;
})();
