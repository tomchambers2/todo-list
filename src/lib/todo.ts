// Shared todo types, constants, helpers, and seed data.

// --- Types ---
export type Bucket = 'quick' | 'medium' | 'tasks';

export type Subtask = { id: string; title: string; done: boolean };

export type Item = {
  id: string;
  title: string;
  bucket: Bucket;
  createdAt: string;       // ISO
  date?: string | null;    // ISO date (yyyy-mm-dd) or null
  repeat?: string | null;  // "every monday", etc
  priority?: boolean;
  delegated?: boolean;
  subtasks?: Subtask[];
  totalLoggedSec?: number;
  completedAt?: string | null;
};

// --- Helpers ---
export const today = new Date();
export const iso = (d: Date) => d.toISOString().slice(0, 10);
export const daysAgo = (n: number) => {
  const d = new Date(today); d.setDate(d.getDate() - n); return d.toISOString();
};
export const daysAhead = (n: number) => {
  const d = new Date(today); d.setDate(d.getDate() + n); return iso(d);
};

export function ageInDays(createdAt: string) {
  return Math.floor((Date.now() - new Date(createdAt).getTime()) / 86400000);
}

export function fmtDuration(sec: number) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function fmtDate(d?: string | null) {
  if (!d) return null;
  const date = new Date(d + 'T00:00:00');
  const t = new Date(); t.setHours(0, 0, 0, 0);
  const diff = Math.round((date.getTime() - t.getTime()) / 86400000);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Tomorrow';
  if (diff === -1) return 'Yesterday';
  if (diff > 0 && diff < 7) return date.toLocaleDateString('en-GB', { weekday: 'short' });
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

// --- AI sorting (mocked, rule-based) ---
export function mockClassify(title: string): { bucket: Bucket; confidence: number; reason: string } {
  const t = title.toLowerCase();
  const quickSignals = ['email', 'reply', 'text', 'call', 'pay', 'send', 'cancel', 'book ', 'order', 'message'];
  const projectSignals = ['paint', 'build', 'redesign', 'plan a', 'organise the', 'launch', 'refurbish', 'holiday', 'project'];
  const mediumSignals = ['draft', 'write', 'sort', 'fix', 'set up', 'review', 'replace'];

  if (projectSignals.some(s => t.includes(s))) return { bucket: 'tasks', confidence: 0.78, reason: 'sounds like a multi-step project' };
  if (quickSignals.some(s => t.includes(s))) return { bucket: 'quick', confidence: 0.85, reason: 'looks like a fast win (<5 min)' };
  if (mediumSignals.some(s => t.includes(s))) return { bucket: 'medium', confidence: 0.72, reason: 'isolated ~30 min chunk' };
  if (t.split(' ').length > 6) return { bucket: 'medium', confidence: 0.6, reason: 'longer phrasing — likely medium' };
  return { bucket: 'quick', confidence: 0.55, reason: 'short — defaulting to quick' };
}

// --- Limits ---
export const LIMITS = { quick: 20, medium: 12, tasks: 5, subtasks: 5 } as const;

// --- Bucket meta ---
export const bucketMeta: Record<Bucket, { label: string; sub: string; defaultSchedule: string; accent: string; ring: string }> = {
  quick:  { label: 'Quick tasks',  sub: 'fast wins', defaultSchedule: '8–9am',  accent: 'text-emerald-300', ring: 'ring-emerald-500/20' },
  medium: { label: 'Medium tasks', sub: '~30 min isolated chunks', defaultSchedule: '10–11am', accent: 'text-sky-300', ring: 'ring-sky-500/20' },
  tasks:  { label: 'Tasks',        sub: 'projects, week+', defaultSchedule: '2–4pm', accent: 'text-violet-300', ring: 'ring-violet-500/20' },
};

// --- Seed data ---
export const seed: Item[] = [
  { id: 'q1', title: 'Reply to Anna about Saturday', bucket: 'quick', createdAt: daysAgo(0), date: iso(today), priority: true, totalLoggedSec: 0 },
  { id: 'q2', title: 'Pay council tax', bucket: 'quick', createdAt: daysAgo(1), date: iso(today), priority: true },
  { id: 'q3', title: 'Cancel old domain', bucket: 'quick', createdAt: daysAgo(2) },
  { id: 'q4', title: 'Book optician', bucket: 'quick', createdAt: daysAgo(3) },
  { id: 'q5', title: 'Update GP repeat prescription', bucket: 'quick', createdAt: daysAgo(4) },
  { id: 'q6', title: 'Send Tom B the photos', bucket: 'quick', createdAt: daysAgo(2) },
  { id: 'q7', title: 'Move £200 to savings', bucket: 'quick', createdAt: daysAgo(5) },
  { id: 'q8', title: 'Pick up parcel from post office', bucket: 'quick', createdAt: daysAgo(1) },
  { id: 'q9', title: 'Order new chain lube', bucket: 'quick', createdAt: daysAgo(6) },
  { id: 'q10', title: 'Defrost the freezer drawer', bucket: 'quick', createdAt: daysAgo(8) },
  { id: 'q11', title: 'Renew car insurance quote', bucket: 'quick', createdAt: daysAgo(3) },
  { id: 'q12', title: 'Text Mum about Sunday', bucket: 'quick', createdAt: daysAgo(0) },
  { id: 'q13', title: 'Sort out Spotify family plan', bucket: 'quick', createdAt: daysAgo(4) },
  { id: 'q14', title: 'Donate old jackets', bucket: 'quick', createdAt: daysAgo(7), delegated: true },
  { id: 'q15', title: 'Find a new dentist', bucket: 'quick', createdAt: daysAgo(9) },
  { id: 'q16', title: 'Sign birthday card', bucket: 'quick', createdAt: daysAgo(0) },
  { id: 'q17', title: 'Empty dishwasher', bucket: 'quick', createdAt: daysAgo(0), date: iso(today) },

  { id: 'm1', title: 'Sort the photo library backlog', bucket: 'medium', createdAt: daysAgo(2), date: iso(today), priority: true },
  { id: 'm2', title: 'Replace bike brake pads', bucket: 'medium', createdAt: daysAgo(5) },
  { id: 'm3', title: 'Tax return draft pass', bucket: 'medium', createdAt: daysAgo(1), date: daysAhead(2) },
  { id: 'm4', title: 'Rewire the desk cables properly', bucket: 'medium', createdAt: daysAgo(10) },
  { id: 'm5', title: 'Write up Q1 retro notes', bucket: 'medium', createdAt: daysAgo(23) },

  {
    id: 't1', title: 'Paint the living room', bucket: 'tasks', createdAt: daysAgo(6), priority: true,
    subtasks: [
      { id: 't1s1', title: 'Pick final colour swatch', done: true },
      { id: 't1s2', title: 'Buy paint + supplies', done: true },
      { id: 't1s3', title: 'Move furniture, lay sheets', done: false },
      { id: 't1s4', title: 'First coat — back wall', done: false },
      { id: 't1s5', title: 'Second coat + trim', done: false },
    ],
  },
  {
    id: 't2', title: 'Build trail cam v2', bucket: 'tasks', createdAt: daysAgo(11),
    subtasks: [
      { id: 't2s1', title: 'Order PIR sensor', done: true },
      { id: 't2s2', title: 'Solder power circuit', done: false },
      { id: 't2s3', title: 'Flash firmware', done: false },
      { id: 't2s4', title: 'Build weatherproof case', done: false },
    ],
  },
  {
    id: 't3', title: 'Spring garden refresh', bucket: 'tasks', createdAt: daysAgo(4),
    subtasks: [
      { id: 't3s1', title: 'Clear dead growth from bed 2', done: false },
      { id: 't3s2', title: 'Top-dress with compost', done: false },
      { id: 't3s3', title: 'Plant out tomatoes', done: false },
    ],
  },
  {
    id: 't4', title: 'Holiday booking — Lisbon', bucket: 'tasks', createdAt: daysAgo(2), date: daysAhead(7),
    subtasks: [
      { id: 't4s1', title: 'Compare flight options', done: true },
      { id: 't4s2', title: 'Pick neighbourhood', done: false },
      { id: 't4s3', title: 'Book Airbnb', done: false },
    ],
  },
];
