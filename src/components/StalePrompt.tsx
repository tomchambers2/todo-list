'use client';

import { Item, ageInDays } from '@/lib/todo';

export function StalePrompt({ item, onPromote, onDelete }: { item: Item; onPromote: () => void; onDelete: () => void }) {
  return (
    <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 px-3 py-2.5 text-[13px] text-amber-100/90">
      <div className="text-amber-200/90 mb-2">
        This has sat here for {ageInDays(item.createdAt)} days. Is it still important?
      </div>
      <div className="flex gap-2">
        <button onClick={onPromote} className="px-2.5 py-1 rounded bg-amber-400/20 hover:bg-amber-400/30 text-amber-100">
          Promote to top
        </button>
        <button onClick={onDelete} className="px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300">
          Drop it
        </button>
      </div>
    </div>
  );
}
