import { useEffect, useState } from 'react';
import { fetchGlobalTotals } from '@/lib/globalTotalsClient';
import type { GlobalTotals } from '@/lib/types';

const REFRESH_MS = 60_000;

export function useGlobalTotals() {
  const [totals, setTotals] = useState<GlobalTotals | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'unavailable'>('loading');

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const result = await fetchGlobalTotals();
      if (cancelled) return;
      if (result) {
        setTotals(result);
        setStatus('ready');
      } else {
        setStatus((prev) => (prev === 'ready' ? prev : 'unavailable'));
      }
    };
    void load();
    const interval = setInterval(load, REFRESH_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  return { totals, status };
}
