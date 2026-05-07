'use client';

import { useEffect, useState } from 'react';
import { Item, seed } from './todo';

const STORAGE_KEY = 'todo-items';

export function useItems() {
  // SSR-safe: server and first client render use the seed. We hydrate from
  // localStorage in a useEffect to avoid hydration mismatches.
  const [items, setItems] = useState<Item[]>(seed);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Item[];
        setItems(parsed);
      } else {
        // Persist seed on first ever load so subsequent navigations are stable.
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
      }
    } catch (err) {
      // Surface the error rather than silently falling back.
      console.error('useItems: failed to read localStorage', err);
      throw err;
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items, hydrated]);

  return { items, setItems, hydrated };
}
