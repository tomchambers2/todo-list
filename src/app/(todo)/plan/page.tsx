'use client';

import { useMemo, useRef, useState } from 'react';
import { Bucket, Item, LIMITS, bucketMeta, iso, mockClassify, today } from '@/lib/todo';
import { useItems } from '@/lib/use-items';
import { ItemRow } from '@/components/ItemRow';
import { LimitNudge } from '@/components/LimitNudge';

export default function PlanPage() {
  const { items, setItems } = useItems();
  const [draft, setDraft] = useState('');
  const [sorting, setSorting] = useState(false);
  const [lastSorted, setLastSorted] = useState<{ title: string; bucket: Bucket; reason: string } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleAdd() {
    const title = draft.trim();
    if (!title) return;
    setSorting(true);
    setLastSorted(null);
    window.setTimeout(() => {
      const c = mockClassify(title);
      const newItem: Item = {
        id: 'n' + Date.now().toString(36),
        title,
        bucket: c.bucket,
        createdAt: new Date().toISOString(),
        subtasks: c.bucket === 'tasks' ? [] : undefined,
      };
      setItems(prev => [newItem, ...prev]);
      setDraft('');
      setSorting(false);
      setLastSorted({ title, bucket: c.bucket, reason: c.reason });
      inputRef.current?.focus();
    }, 700);
  }

  const counts = useMemo(() => {
    const active = items.filter(i => !i.completedAt);
    return {
      quick: active.filter(i => i.bucket === 'quick').length,
      medium: active.filter(i => i.bucket === 'medium').length,
      tasks: active.filter(i => i.bucket === 'tasks').length,
    };
  }, [items]);

  function complete(id: string) {
    setItems(prev => prev.map(i => i.id === id ? { ...i, completedAt: new Date().toISOString() } : i));
  }
  function delegate(id: string) {
    setItems(prev => prev.map(i => i.id === id ? { ...i, delegated: true } : i));
  }
  function promote(id: string) {
    setItems(prev => prev.map(i => i.id === id ? { ...i, priority: true, createdAt: new Date().toISOString() } : i));
  }
  function deleteItem(id: string) {
    setItems(prev => prev.filter(i => i.id !== id));
  }

  function sortForPlan(arr: Item[]) {
    const todayStr = iso(today);
    return [...arr]
      .filter(i => !i.completedAt)
      .filter(i => !i.date || i.date <= todayStr)
      .sort((a, b) => {
        const aToday = a.date === todayStr ? 1 : 0;
        const bToday = b.date === todayStr ? 1 : 0;
        const aPri = a.priority ? 1 : 0;
        const bPri = b.priority ? 1 : 0;
        const aScore = aToday * 2 + aPri;
        const bScore = bToday * 2 + bPri;
        if (aScore !== bScore) return bScore - aScore;
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      });
  }

  const planByBucket = useMemo(() => ({
    quick: sortForPlan(items.filter(i => i.bucket === 'quick')),
    medium: sortForPlan(items.filter(i => i.bucket === 'medium')),
    tasks: sortForPlan(items.filter(i => i.bucket === 'tasks')),
  }), [items]);

  return (
    <>
      <section className="mb-6">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 px-4 py-3.5">
          <div className="flex items-center gap-3">
            <div className="text-zinc-500 text-sm">+</div>
            <input
              ref={inputRef}
              value={draft}
              onChange={e => setDraft(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleAdd(); }}
              placeholder="Add anything — paint living room, reply to Anna, draft Q1 retro..."
              className="flex-1 bg-transparent text-[15px] placeholder:text-zinc-600 focus:outline-none"
            />
            {sorting && <span className="text-[12px] text-zinc-400 italic">AI sorting…</span>}
            {!sorting && draft.trim() && (
              <button onClick={handleAdd}
                className="text-[12px] px-2.5 py-1 rounded-md bg-zinc-100 text-zinc-900 font-medium hover:bg-white">
                Add
              </button>
            )}
          </div>
          {lastSorted && (
            <div className="mt-3 flex items-center gap-2 text-[12.5px] text-zinc-400">
              <span>&ldquo;{lastSorted.title}&rdquo; →</span>
              <span className={`font-medium ${bucketMeta[lastSorted.bucket].accent}`}>{bucketMeta[lastSorted.bucket].label}</span>
              <span className="text-zinc-600">· {lastSorted.reason}</span>
            </div>
          )}
        </div>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
      {(['quick', 'medium', 'tasks'] as Bucket[]).map(bucket => {
        const meta = bucketMeta[bucket];
        const list = planByBucket[bucket];
        const count = counts[bucket];
        const limit = LIMITS[bucket];
        return (
          <div key={bucket} className={`rounded-2xl border border-zinc-800 bg-zinc-900/30 p-4 ring-1 ${meta.ring}`}>
            <div className="flex items-baseline justify-between mb-1">
              <h2 className={`text-[13px] font-semibold uppercase tracking-wider ${meta.accent}`}>{meta.label}</h2>
              <span className="text-[11px] text-zinc-500">{count}/{limit}</span>
            </div>
            <p className="text-[11.5px] text-zinc-500 mb-3">{meta.sub} · default {meta.defaultSchedule}</p>

            <LimitNudge count={count} limit={limit} label={meta.label.toLowerCase()} />

            <div className="space-y-2 mt-3">
              {list.length === 0 && (
                <div className="text-[13px] text-zinc-600 italic px-1 py-3">Nothing here. Nice.</div>
              )}
              {list.map(item => (
                <ItemRow
                  key={item.id}
                  item={item}
                  onComplete={complete}
                  onDelegate={delegate}
                  onPromote={promote}
                  onDelete={deleteItem}
                  showSubtasks={bucket === 'tasks'}
                />
              ))}
            </div>

            {bucket === 'tasks' && (
              <div className="mt-3 text-[11px] text-zinc-500">
                Subtask limit per project: {LIMITS.subtasks}
              </div>
            )}
          </div>
        );
      })}
      </div>
    </>
  );
}
