'use client';

export function LimitNudge({ count, limit, label }: { count: number; limit: number; label: string }) {
  const pct = count / limit;
  if (pct < 0.75) return null;
  const over = count >= limit;
  return (
    <div className={`flex items-start gap-2 text-[12px] leading-snug rounded-md px-2.5 py-1.5 mt-2 ${
      over ? 'bg-amber-500/10 text-amber-200' : 'bg-zinc-800/60 text-zinc-400'
    }`}>
      <span className="mt-[2px]">{over ? '!' : 'i'}</span>
      <span>
        {over
          ? `${count} / ${limit} ${label}. Is this one super important? Otherwise the limit is ${limit} — bump something else off first.`
          : `${count} / ${limit} ${label}. Getting close — keep it tight.`}
      </span>
    </div>
  );
}
