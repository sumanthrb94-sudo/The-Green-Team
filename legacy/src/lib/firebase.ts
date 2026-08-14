import { initializeApp, getApps } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getAnalytics, isSupported } from 'firebase/analytics';

const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId:     import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

// Guard: if env vars are missing (e.g. Vercel without vars set) don't crash the app
if (!firebaseConfig.apiKey) {
  console.warn('[Firebase] VITE_FIREBASE_* env vars not set — auth and Firestore disabled.');
}

const app = firebaseConfig.apiKey
  ? (getApps().length ? getApps()[0] : initializeApp(firebaseConfig))
  : null;

export const auth           = app ? getAuth(app) : null as any;
export const db             = app ? getFirestore(app) : null as any;
export const googleProvider = (() => {
  const p = new GoogleAuthProvider();
  p.addScope('profile');
  p.addScope('email');
  p.setCustomParameters({ prompt: 'select_account' });
  return p;
})();

if (app) {
  isSupported().then(yes => { if (yes) getAnalytics(app); });
}
