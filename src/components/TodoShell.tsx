'use client';

import { LIMITS } from '@/lib/todo';
import { TodoNav } from './TodoNav';

export function TodoShell({ children }: { children: React.ReactNode }) {
  const today = new Date();
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="max-w-5xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">Personal todo</div>
            <h1 className="text-2xl font-semibold tracking-tight mt-1">
              {today.toLocaleDateString('en-GB', { weekday: 'long' })}
              <span className="text-zinc-500 font-normal"> · {today.toLocaleDateString('en-GB', { day: 'numeric', month: 'long' })}</span>
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <TodoNav />
          </div>
        </div>

        {children}

        <footer className="mt-16 pt-6 border-t border-zinc-900 text-[11px] text-zinc-600 flex justify-between">
          <span>Visual prototype · seeded data only</span>
          <span>limits: quick {LIMITS.quick} · medium {LIMITS.medium} · tasks {LIMITS.tasks} · subtasks {LIMITS.subtasks}</span>
        </footer>
      </div>
    </div>
  );
}
