'use client';

import { useEffect, useMemo, useState } from 'react';
import { Bucket, Item, fmtDuration, iso, today } from '@/lib/todo';
import { useItems } from '@/lib/use-items';

// Schedule (24h):
//   08–09  quick tasks
//   09–17  work (no personal todo)
//   17–22  medium tasks, then projects when medium is empty
//   else   off hours
type Slot = { allowed: Bucket[] | 'work' | 'off'; label: string };

function slotForHour(h: number): Slot {
  if (h >= 8 && h < 9)  return { allowed: ['quick'],            label: 'Quick tasks · 8–9' };
  if (h >= 9 && h < 17) return { allowed: 'work',               label: 'Work · 9–5' };
  if (h >= 17 && h < 22) return { allowed: ['medium', 'tasks'], label: 'Medium · 5–10' };
  return { allowed: 'off', label: 'Off hours' };
}

function sortWithin(items: Item[]): Item[] {
  const todayStr = iso(today);
  return [...items].sort((a, b) => {
    const aPri = a.priority ? 1 : 0;
    const bPri = b.priority ? 1 : 0;
    if (aPri !== bPri) return bPri - aPri;
    const aToday = a.date === todayStr ? 1 : 0;
    const bToday = b.date === todayStr ? 1 : 0;
    if (aToday !== bToday) return bToday - aToday;
    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
  });
}

function pickNow(items: Item[], slot: Slot): Item | null {
  if (slot.allowed === 'work' || slot.allowed === 'off') return null;
  const todayStr = iso(today);
  const eligible = items
    .filter(i => !i.completedAt)
    .filter(i => !i.date || i.date <= todayStr);
  for (const bucket of slot.allowed) {
    const inBucket = sortWithin(eligible.filter(i => i.bucket === bucket));
    if (inBucket.length > 0) return inBucket[0];
  }
  return null;
}

export default function DoPage() {
  const { items, setItems } = useItems();
  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [picking, setPicking] = useState(false);
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setElapsed(e => e + 1), 1000);
    return () => clearInterval(id);
  }, [running]);

  const slot = useMemo(() => slotForHour(now ? now.getHours() : 8), [now]);
  const current = useMemo(() => pickNow(items, slot), [items, slot]);
  const nextSub = current?.bucket === 'tasks' ? current.subtasks?.find(s => !s.done) : undefined;
  const projects = useMemo(
    () => items.filter(i => i.bucket === 'tasks' && !i.completedAt && i.id !== current?.id),
    [items, current]
  );

  function reset() { setRunning(false); setElapsed(0); setPicking(false); }

  function done() {
    if (!current) return;
    if (current.bucket === 'tasks' && nextSub) {
      setItems(prev => prev.map(i =>
        i.id !== current.id ? i : { ...i, subtasks: i.subtasks?.map(s => s.id === nextSub.id ? { ...s, done: true } : s) }
      ));
    } else {
      setItems(prev => prev.map(i => i.id === current.id
        ? { ...i, completedAt: new Date().toISOString(), totalLoggedSec: (i.totalLoggedSec ?? 0) + elapsed }
        : i));
    }
    reset();
  }

  function sendToMedium() {
    if (!current || current.bucket === 'medium') return;
    setItems(prev => prev.map(i => i.id === current.id ? { ...i, bucket: 'medium', subtasks: undefined } : i));
    reset();
  }

  function sendToProject(projectId: string) {
    if (!current) return;
    setItems(prev => {
      const filtered = prev.filter(i => i.id !== current.id);
      return filtered.map(i => {
        if (i.id !== projectId) return i;
        const newSub = { id: `${current.id}-sub`, title: current.title, done: false };
        return { ...i, subtasks: [...(i.subtasks ?? []), newSub] };
      });
    });
    reset();
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex items-center justify-center px-6">
      {!current ? (
        <div className="text-center">
          <div className="text-[11px] uppercase tracking-[0.22em] text-zinc-600 mb-3">{slot.label}</div>
          <div className="text-zinc-500 text-lg">
            {slot.allowed === 'work' ? 'Work hours.' : slot.allowed === 'off' ? 'Off hours.' : 'Nothing here.'}
          </div>
        </div>
      ) : (
        <div className="w-full max-w-xl">
          <div className="text-center">
            <div className="text-[11px] uppercase tracking-[0.22em] text-zinc-600 mb-3">{slot.label}</div>
            {current.bucket === 'tasks' && (
              <div className="text-zinc-500 text-[13px] mb-2">{current.title}</div>
            )}
            <h1 className="text-4xl font-semibold tracking-tight leading-tight">
              {current.bucket === 'tasks'
                ? (nextSub?.title ?? 'Wrap the project')
                : current.title}
            </h1>
          </div>

          <div className="mt-12 flex flex-col items-center gap-6">
            <div className="text-6xl font-mono tabular-nums tracking-tight text-zinc-200">
              {fmtDuration(elapsed)}
            </div>
            <div className="flex items-center gap-3">
              {!running ? (
                <button onClick={() => setRunning(true)}
                  className="px-8 py-3 rounded-full bg-emerald-400 text-zinc-950 font-semibold hover:bg-emerald-300">
                  Start
                </button>
              ) : (
                <button onClick={() => setRunning(false)}
                  className="px-8 py-3 rounded-full bg-zinc-800 text-zinc-100 font-semibold hover:bg-zinc-700">
                  Pause
                </button>
              )}
              <button onClick={done}
                className="px-8 py-3 rounded-full bg-zinc-100 text-zinc-900 font-semibold hover:bg-white">
                Done
              </button>
            </div>
          </div>

          <div className="mt-16 flex items-center justify-center gap-4 text-[12px] text-zinc-500">
            {current.bucket !== 'medium' && (
              <button onClick={sendToMedium}
                className="hover:text-zinc-200 transition-colors">
                Send to Medium
              </button>
            )}
            <button onClick={() => setPicking(p => !p)}
              className="hover:text-zinc-200 transition-colors">
              Send to Project
            </button>
          </div>

          {picking && (
            <div className="mt-4 max-w-sm mx-auto rounded-lg border border-zinc-800 bg-zinc-900/60 p-2">
              {projects.length === 0 ? (
                <div className="text-[12px] text-zinc-500 px-3 py-2">No projects.</div>
              ) : (
                projects.map(p => (
                  <button key={p.id} onClick={() => sendToProject(p.id)}
                    className="w-full text-left px-3 py-2 rounded text-[13px] text-zinc-300 hover:bg-zinc-800/60">
                    {p.title}
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
