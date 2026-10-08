/**
 * Add the Financial District bare-shell office (lease) to `properties` as a DRAFT.
 *
 *   npx tsx --env-file=.env.local scripts/add-fd-office.ts
 *
 * Idempotent: fixed doc id, and an existing doc is never overwritten (an admin
 * may already have edited it). It stays a draft until Transaction and
 * Approvals are filled in from the admin and it is switched to Live there.
 */
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

const ID = 'fd-office-5000';

initializeApp({
  credential: cert({
    projectId: process.env.FIREBASE_PROJECT_ID!,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL!,
    privateKey: process.env.FIREBASE_PRIVATE_KEY!.replace(/\\n/g, '\n'),
  }),
});

const GALLERY = [3, 1, 2, 4].map(n => `/gallery/fd-office/${n}.webp`);

async function main() {
  const ref = getFirestore().collection('properties').doc(ID);
  if ((await ref.get()).exists) {
    console.log(`↷ ${ID} already exists — leaving it untouched`);
    return;
  }
  await ref.set({
    title: 'Bare-Shell Office Space, Financial District',
    location: 'Financial District · Hyderabad',
    category: 'commercial',
    stage: 'completed',
    investment: false,
    status: 'draft',
    memberPrice: '₹60 / SFT / month · negotiable',
    plotRange: '5,000 SFT',
    plots: 1,
    image: GALLERY[0],
    plotImages: GALLERY,
    tagline: 'A blank canvas in the Financial District, built your way.',
    description:
      'A 5,000 sq ft bare-shell office floor in a prime Financial District location, offered on a long-term lease. The structure is complete and the interiors are untouched, so a tenant can build the workspace exactly to their own layout and brand: open-plan, cabins, or a mix. Floor-to-ceiling glazing brings in natural light and city views across the floor plate, and the fire sprinkler network is already in place. Rent is ₹60 per sq ft per month, negotiable for the right long-term tenant.',
    commercialType: 'office',
    dealType: 'lease',
    rentPerSqFt: 60,
    fitout: 'bare-shell',
    lockInPeriod: 'Long-term lease',
    features: [
      'Bare Shell · Ready for Custom Fit-Out',
      'Floor-to-Ceiling Glazing',
      'Column-Grid Open Floor Plate',
      'Fire Sprinkler Network Installed',
      'Long-Term Lease',
      'Rent Negotiable',
    ],
    order: 10,
    createdAt: FieldValue.serverTimestamp(),
  });
  console.log(`✓ added ${ID} as a draft — finish Transaction + Approvals in the admin, then publish`);
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
