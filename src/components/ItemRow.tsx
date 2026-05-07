'use client';

import { Item, ageInDays, fmtDate } from '@/lib/todo';
import { StalePrompt } from './StalePrompt';

export function ItemRow({
  item,
  onComplete,
  onDelegate,
  onPromote,
  onDelete,
  showSubtasks,
}: {
  item: Item;
  onComplete: (id: string) => void;
  onDelegate: (id: string) => void;
  onPromote: (id: string) => void;
  onDelete: (id: string) => void;
  showSubtasks?: boolean;
}) {
  const stale = ageInDays(item.createdAt) > 21;
  const dateLabel = fmtDate(item.date);
  const isToday = dateLabel === 'Today';
  const subDone = item.subtasks?.filter(s => s.done).length ?? 0;
  const subTotal = item.subtasks?.length ?? 0;

  return (
    <div className="group rounded-lg border border-zinc-800/80 bg-zinc-900/40 hover:bg-zinc-900/70 transition-colors px-3.5 py-3">
      <div className="flex items-start gap-3">
        <button
          onClick={() => onComplete(item.id)}
          className="mt-[3px] w-4 h-4 rounded-full border border-zinc-600 hover:border-emerald-400 hover:bg-emerald-400/10 transition-colors flex-shrink-0"
          aria-label="Complete"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            {item.priority && <span className="text-[10px] font-semibold uppercase tracking-wider text-amber-300">priority</span>}
            <div className="text-[14.5px] text-zinc-100 leading-snug">{item.title}</div>
          </div>
          <div className="flex items-center gap-3 mt-1.5 text-[11.5px] text-zinc-500">
            {dateLabel && (
              <span className={isToday ? 'text-zinc-200' : ''}>{dateLabel}</span>
            )}
            {item.repeat && <span>↻ {item.repeat}</span>}
            {subTotal > 0 && <span>{subDone}/{subTotal} subtasks</span>}
            {item.delegated && <span className="text-violet-300">delegated to AI</span>}
            {stale && !item.priority && <span className="text-amber-300/80">{ageInDays(item.createdAt)}d old</span>}
          </div>
          {showSubtasks && item.subtasks && (
            <ul className="mt-2.5 space-y-1.5">
              {item.subtasks.map(s => (
                <li key={s.id} className="flex items-center gap-2 text-[13px]">
                  <span className={`w-3 h-3 rounded-full border ${s.done ? 'bg-emerald-400/60 border-emerald-400/60' : 'border-zinc-600'}`} />
                  <span className={s.done ? 'text-zinc-500 line-through' : 'text-zinc-300'}>{s.title}</span>
                </li>
              ))}
            </ul>
          )}
          {stale && !item.priority && (
            <div className="mt-2.5">
              <StalePrompt item={item} onPromote={() => onPromote(item.id)} onDelete={() => onDelete(item.id)} />
            </div>
          )}
        </div>
        <button
          onClick={() => onDelegate(item.id)}
          title="Delegate to AI"
          className="opacity-0 group-hover:opacity-100 transition-opacity text-[11px] text-violet-300/80 hover:text-violet-200 px-2 py-1 rounded hover:bg-violet-500/10 flex-shrink-0"
        >
          delegate →
        </button>
      </div>
    </div>
  );
}
