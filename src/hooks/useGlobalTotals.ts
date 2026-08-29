import { useEffect, useState } from 'react';
import { fetchGlobalTotals } from '@/lib/globalTotalsClient';
import { getSyncConfig } from '@/lib/syncConfigClient';
import type { GlobalTotals } from '@/lib/types';

const MIN_REFRESH_MS = 10_000; // sanity floor even if the server ever sent something absurd

/**
 * Polls global totals at a server-adaptive interval (spec: 30-60s under
 * normal traffic, 2-5min elevated, 10-15min cost-protection) instead of a
 * fixed cadence, and surfaces whether anonymous submissions are currently
 * paused so the UI can show the "near real-time" / paused messaging.
 */
export function useGlobalTotals() {
  const [totals, setTotals] = useState<GlobalTotals | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'unavailable'>('loading');
  const [syncPaused, setSyncPaused] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    async function cycle() {
      const [result, config] = await Promise.all([fetchGlobalTotals(), getSyncConfig()]);
      if (cancelled) return;
      if (result) {
        setTotals(result);
        setStatus('ready');
      } else {
        setStatus((prev) => (prev === 'ready' ? prev : 'unavailable'));
      }
      setSyncPaused(config.submissionsPaused);
      const delayMs = Math.max(MIN_REFRESH_MS, config.totalsRefreshSeconds * 1000);
      timeoutId = setTimeout(() => void cycle(), delayMs);
    }

    void cycle();
    return () => {
      cancelled = true;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, []);

  return { totals, status, syncPaused };
}
