'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const tabs = [
  { href: '/plan', label: 'Plan' },
  { href: '/do', label: 'Do' },
];

export function TodoNav() {
  const pathname = usePathname();
  return (
    <nav className="flex items-center gap-1 bg-zinc-900/60 border border-zinc-800 rounded-full p-1">
      {tabs.map(t => {
        const active = pathname === t.href;
        return (
          <Link
            key={t.href}
            href={t.href}
            className={`relative px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              active ? 'bg-white text-zinc-900' : 'text-zinc-400 hover:text-zinc-100'
            }`}
          >
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}
