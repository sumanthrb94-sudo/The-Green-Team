import 'server-only';
import type { AdminLead, AdminNewsletterEntry, AdminUser, AdminProperty } from './admin-data';

/**
 * Fictional records for documentation screenshots. Active ONLY when
 * NODE_ENV=development AND DEMO_DATA=1 — production builds ignore this file's
 * flag entirely, so real client data never appears in committed screenshots
 * and fake data can never appear in production.
 */
export const demoEnabled = () =>
  process.env.NODE_ENV === 'development' && process.env.DEMO_DATA === '1';

const days = (n: number) => new Date(Date.now() - n * 86400e3).toISOString();

export const DEMO_LEADS: AdminLead[] = [
  { id: 'l1', name: 'Aarav Mehta', email: 'aarav.mehta@example.in', phone: '+91 98490 11234', intent: 'Site visit — Agartha', source: 'property_detail', status: 'site-visit', createdAt: days(1) },
  { id: 'l2', name: 'Divya Rao', email: 'divya.rao@example.in', phone: '+91 91000 55871', intent: 'Director at MedCore | Budget: ₹2 Cr – ₹5 Cr', source: 'membership', status: 'contacted', createdAt: days(2) },
  { id: 'l3', name: 'Karthik Reddy', email: 'karthik.r@example.in', phone: '+91 99490 77120', intent: 'Plot availability — Dates County', source: 'chatbot', status: 'new', createdAt: days(4) },
  { id: 'l4', name: 'Nikhil Varma', email: 'nikhil.varma@example.in', intent: 'New Sign-up', source: 'signup', status: 'new', createdAt: days(5) },
  { id: 'l5', name: 'Sana Fatima', email: 'sana.f@example.in', phone: '+91 90300 41288', intent: 'SYL Residences — 3BHK villament', source: 'map_popup', status: 'contacted', createdAt: days(6) },
  { id: 'l6', name: 'Rohit Sharma', email: 'rohit.s@example.in', intent: 'Founder at LogiFleet | Budget: ₹1 Cr – ₹2 Cr', source: 'membership', status: 'closed', createdAt: days(9) },
  { id: 'l7', name: 'Meera Kapoor', email: 'meera.k@example.in', phone: '+91 98661 20455', intent: 'Pre-investor Gold enquiry', source: 'preinvestor-gold', status: 'new', createdAt: days(12) },
  { id: 'l8', name: 'Anand Teja', email: 'anand.t@example.in', intent: 'Brochure — Agartha', source: 'property_detail', status: 'closed', createdAt: days(16) },
];

export const DEMO_NEWSLETTER: AdminNewsletterEntry[] = [
  { id: 'n1', email: 'aarav.mehta@example.in', source: 'modal', createdAt: days(1) },
  { id: 'n2', email: 'priya.nair@example.in', source: 'inline', createdAt: days(3) },
  { id: 'n3', email: 'vikram.j@example.in', source: 'mobile_quick', createdAt: days(5) },
  { id: 'n4', email: 'meera.kapoor@example.in', source: 'modal', createdAt: days(8) },
  { id: 'n5', email: 'anand.t@example.in', source: 'inline', createdAt: days(11) },
  { id: 'n6', email: 'sana.f@example.in', source: 'footer', createdAt: days(14) },
];

export const DEMO_USERS: AdminUser[] = [
  { id: 'u1', email: 'aarav.mehta@example.in', displayName: 'Aarav Mehta', name: 'Aarav Mehta', occupation: 'Product Designer', city: 'Hyderabad', lat: 17.4239, lng: 78.4738, locationAccuracy: 26, firstSignIn: days(50), lastSeen: days(1) },
  { id: 'u2', email: 'divya.rao@example.in', displayName: 'Divya Rao', name: 'Divya Rao', occupation: 'Cardiologist', city: 'Secunderabad', lat: 17.4399, lng: 78.4983, locationAccuracy: 41, firstSignIn: days(30), lastSeen: days(2) },
  { id: 'u3', email: 'karthik.r@example.in', displayName: 'Karthik Reddy', name: 'Karthik Reddy', occupation: 'Founder, LogiFleet', city: 'Gachibowli', lat: 17.4401, lng: 78.3489, locationAccuracy: 33, firstSignIn: days(12), lastSeen: days(4) },
  { id: 'u4', email: 'sana.f@example.in', displayName: 'Sana Fatima', name: 'Sana Fatima', occupation: 'Architect', city: 'Jubilee Hills', firstSignIn: days(7), lastSeen: days(6) },
];

export const DEMO_PROPERTIES: AdminProperty[] = [
  {
    id: 'p1',
    title: 'Dates County — Phase II',
    location: 'Kandukur, Srisailam Highway',
    memberPrice: '₹32 L',
    image: '/gallery/dates-county/project-highlight.jpg',
    aqi: 21,
    noise: 24,
    commute: '42 min to Airport corridor',
    status: 'live',
    createdAt: days(20),
  },
  {
    id: 'p2',
    title: 'SYL Residences — Tower C',
    location: 'Tukkuguda, ORR Exit-14',
    memberPrice: '₹88 L',
    image: '/gallery/syl/1776279343905.webp',
    aqi: 28,
    noise: 31,
    commute: '35 min to Financial District',
    status: 'draft',
    createdAt: days(6),
  },
];
