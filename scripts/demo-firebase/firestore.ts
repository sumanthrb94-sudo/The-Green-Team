/**
 * Demo stand-in for `firebase/firestore` — an in-memory document store with the
 * same call signatures App.tsx uses (doc/collection/query/orderBy/getDoc/getDocs/
 * setDoc/addDoc/updateDoc/deleteDoc/onSnapshot/serverTimestamp).
 *
 * Seeded with representative sanctuary, lead, newsletter and user records so the
 * admin dashboard has something real to render in documentation screenshots.
 *
 * Only loaded when Vite runs with `--config vite.demo.config.ts`.
 */

type Doc = Record<string, any>;

const ts = (iso: string) => ({ seconds: Math.floor(new Date(iso).getTime() / 1000), nanoseconds: 0 });

const store: Record<string, Map<string, Doc>> = {
  properties: new Map<string, Doc>([
    [
      'prop-dates-county',
      {
        title: 'Dates County — Phase II',
        location: 'Kandukur, Srisailam Highway',
        lat: 17.1854,
        lng: 78.5623,
        aqi: 21,
        noise: 24,
        commute: '42 min',
        valuation: '₹38L',
        memberPrice: '₹32L',
        image: '/gallery/dates-county/project-highlight.jpg',
        tagline: 'Date-palm agroforestry plots with managed permaculture',
        description:
          'Phase II release of the Planet Green date-palm estate — 180 plots wrapped around a 9-acre amenity core, drip-irrigated and farm-managed on the owner’s behalf.',
        plots: 180,
        plotRange: '267 – 605 sq yd',
        amenityAcres: '9',
        architect: 'Planet Green Studio',
        features: ['Managed farm plots', 'Drip irrigation grid', 'Clubhouse + temple', 'Gated with 24×7 security'],
        pricePerSqYd: 11800,
        status: 'live',
        order: 1,
        createdAt: ts('2026-05-18T05:30:00Z'),
      },
    ],
    [
      'prop-syl-tower-c',
      {
        title: 'SYL Residences — Tower C',
        location: 'Tukkuguda, ORR Exit-14',
        lat: 17.1994,
        lng: 78.5241,
        aqi: 28,
        noise: 31,
        commute: '35 min',
        valuation: '₹96L',
        memberPrice: '₹88L',
        image: '/gallery/syl/1776279343905.webp',
        tagline: '3BHK sky residences facing the reserve forest edge',
        description:
          'Unreleased Tower C inventory held for pre-investor members ahead of the public launch. Draft until MODCON confirms the price band.',
        plots: 64,
        plotRange: '1,845 – 2,410 sq ft',
        amenityAcres: '3.2',
        architect: 'MODCON Design Cell',
        features: ['Forest-edge orientation', 'Sky lounge', 'EV-ready parking', 'Rainwater harvesting'],
        pricePerSqYd: 0,
        status: 'draft',
        order: 2,
        createdAt: ts('2026-07-02T11:15:00Z'),
      },
    ],
  ]),

  leads: new Map<string, Doc>([
    ['lead-1', { name: 'Aarav Mehta', email: 'aarav.mehta@example.in', phone: '+91 98490 11234', intent: 'Site visit — Agartha', source: 'property_detail', createdAt: ts('2026-08-12T10:04:00Z') }],
    ['lead-2', { name: 'Divya Rao', email: 'divya.rao@example.in', phone: '+91 91000 55871', intent: 'Pre-investor Gold enquiry', source: 'preinvestor-gold', createdAt: ts('2026-08-11T15:47:00Z') }],
    ['lead-3', { name: 'Karthik Reddy', email: 'karthik.r@example.in', phone: '+91 99490 77120', intent: 'Plot availability — Dates County', source: 'chatbot', createdAt: ts('2026-08-10T08:22:00Z') }],
    ['lead-4', { name: 'Nikhil Varma', email: 'nikhil.varma@example.in', intent: 'New Sign-up', source: 'signup', createdAt: ts('2026-08-09T19:03:00Z') }],
    ['lead-5', { name: 'Sana Fatima', email: 'sana.f@example.in', phone: '+91 90300 41288', intent: 'SYL Residences — 3BHK', source: 'map_popup', createdAt: ts('2026-08-08T12:41:00Z') }],
    ['lead-6', { name: 'Rohit Sharma', email: 'rohit.s@example.in', intent: 'Brochure download', source: 'sanctuary_card', createdAt: ts('2026-08-06T07:16:00Z') }],
  ]),

  newsletter: new Map<string, Doc>([
    ['nl-1', { email: 'aarav.mehta@example.in', source: 'modal', createdAt: ts('2026-08-12T10:02:00Z') }],
    ['nl-2', { email: 'priya.nair@example.in', source: 'inline', createdAt: ts('2026-08-11T09:38:00Z') }],
    ['nl-3', { email: 'vikram.j@example.in', source: 'mobile_quick', createdAt: ts('2026-08-09T21:10:00Z') }],
    ['nl-4', { email: 'meera.kapoor@example.in', source: 'modal', createdAt: ts('2026-08-07T14:55:00Z') }],
    ['nl-5', { email: 'anand.t@example.in', source: 'inline', createdAt: ts('2026-08-05T06:29:00Z') }],
  ]),

  users: new Map<string, Doc>([
    [
      'demo-admin-uid',
      {
        uid: 'demo-admin-uid',
        email: 'sumanthbolla97@gmail.com',
        displayName: 'Sumanth B · Admin',
        name: 'Sumanth B',
        occupation: 'Founder, The Green Team',
        city: 'Hyderabad',
        lat: 17.4401,
        lng: 78.3489,
        locationAccuracy: 18,
        firstSignIn: ts('2025-11-04T09:12:00Z'),
        lastSeen: ts('2026-08-13T06:30:00Z'),
      },
    ],
    [
      'demo-member-uid',
      {
        uid: 'demo-member-uid',
        email: 'aarav.mehta@example.in',
        displayName: 'Aarav Mehta',
        name: 'Aarav Mehta',
        occupation: 'Product Designer',
        city: 'Hyderabad',
        lat: 17.4239,
        lng: 78.4738,
        locationAccuracy: 26,
        firstSignIn: ts('2026-06-21T13:02:00Z'),
        lastSeen: ts('2026-08-12T10:01:00Z'),
      },
    ],
    [
      'demo-user-divya',
      {
        uid: 'demo-user-divya',
        email: 'divya.rao@example.in',
        displayName: 'Divya Rao',
        name: 'Divya Rao',
        occupation: 'Cardiologist',
        city: 'Secunderabad',
        lat: 17.4399,
        lng: 78.4983,
        locationAccuracy: 41,
        firstSignIn: ts('2026-07-30T17:20:00Z'),
        lastSeen: ts('2026-08-11T15:45:00Z'),
      },
    ],
    [
      'demo-user-karthik',
      {
        uid: 'demo-user-karthik',
        email: 'karthik.r@example.in',
        displayName: 'Karthik Reddy',
        name: 'Karthik Reddy',
        occupation: 'Founder, LogiFleet',
        city: 'Gachibowli',
        lat: 17.4401,
        lng: 78.3489,
        locationAccuracy: 33,
        firstSignIn: ts('2026-08-10T08:19:00Z'),
        lastSeen: ts('2026-08-10T08:25:00Z'),
      },
    ],
  ]),
};

type Listener = { path: string; cb: (snap: any) => void; sort?: { field: string; dir: string } };
const listeners: Listener[] = [];

let idSeq = 0;
const nextId = () => `demo-${Date.now().toString(36)}-${++idSeq}`;

function coll(path: string): Map<string, Doc> {
  if (!store[path]) store[path] = new Map();
  return store[path];
}

function snapshotOf(path: string, sort?: { field: string; dir: string }) {
  let entries = [...coll(path).entries()];
  if (sort) {
    const dir = sort.dir === 'asc' ? 1 : -1;
    entries.sort(([, a], [, b]) => {
      const av = a[sort.field]?.seconds ?? a[sort.field] ?? 0;
      const bv = b[sort.field]?.seconds ?? b[sort.field] ?? 0;
      return av === bv ? 0 : av > bv ? dir : -dir;
    });
  }
  return {
    empty: entries.length === 0,
    size: entries.length,
    docs: entries.map(([id, data]) => ({ id, exists: () => true, data: () => ({ ...data }) })),
  };
}

function notify(path: string) {
  listeners.filter(l => l.path === path).forEach(l => l.cb(snapshotOf(path, l.sort)));
}

// ── Reference builders ──────────────────────────────────────────────────────
export function getFirestore(_app?: unknown) {
  return { __demo: true as const };
}

export function collection(_db: unknown, path: string) {
  return { __kind: 'collection' as const, path };
}

export function doc(_db: unknown, path: string, id: string) {
  return { __kind: 'doc' as const, path, id };
}

export function query(ref: { path: string }, ...constraints: any[]) {
  const sort = constraints.find(c => c?.__kind === 'orderBy');
  return { __kind: 'query' as const, path: ref.path, sort };
}

export function orderBy(field: string, dir: 'asc' | 'desc' = 'asc') {
  return { __kind: 'orderBy' as const, field, dir };
}

export function where() {
  return { __kind: 'where' as const };
}

export function limit() {
  return { __kind: 'limit' as const };
}

export function serverTimestamp() {
  return ts(new Date().toISOString());
}

// ── Reads ───────────────────────────────────────────────────────────────────
export function getDoc(ref: { path: string; id: string }) {
  const data = coll(ref.path).get(ref.id);
  return Promise.resolve({
    id: ref.id,
    exists: () => Boolean(data),
    data: () => (data ? { ...data } : undefined),
  });
}

export function getDocs(ref: { path: string; sort?: { field: string; dir: string } }) {
  return Promise.resolve(snapshotOf(ref.path, ref.sort));
}

export function onSnapshot(
  ref: { path: string; sort?: { field: string; dir: string } },
  cb: (snap: any) => void,
  _err?: (e: Error) => void
) {
  const entry: Listener = { path: ref.path, cb, sort: ref.sort };
  listeners.push(entry);
  setTimeout(() => cb(snapshotOf(ref.path, ref.sort)), 0);
  return () => {
    const i = listeners.indexOf(entry);
    if (i >= 0) listeners.splice(i, 1);
  };
}

// ── Writes ──────────────────────────────────────────────────────────────────
export function setDoc(ref: { path: string; id: string }, data: Doc, options?: { merge?: boolean }) {
  const c = coll(ref.path);
  c.set(ref.id, options?.merge ? { ...(c.get(ref.id) ?? {}), ...data } : { ...data });
  notify(ref.path);
  return Promise.resolve();
}

export function addDoc(ref: { path: string }, data: Doc) {
  const id = nextId();
  coll(ref.path).set(id, { ...data });
  notify(ref.path);
  return Promise.resolve({ id, path: `${ref.path}/${id}` });
}

export function updateDoc(ref: { path: string; id: string }, data: Doc) {
  const c = coll(ref.path);
  c.set(ref.id, { ...(c.get(ref.id) ?? {}), ...data });
  notify(ref.path);
  return Promise.resolve();
}

export function deleteDoc(ref: { path: string; id: string }) {
  coll(ref.path).delete(ref.id);
  notify(ref.path);
  return Promise.resolve();
}
