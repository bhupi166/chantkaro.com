import { useEffect, useRef } from 'react';

/**
 * Keeps the screen awake while `active` is true, using the Screen Wake
 * Lock API where supported (Chrome/Edge/Android, Safari 16.4+). Degrades
 * silently everywhere else — Timer Mode still works, the screen may just
 * sleep on unsupported browsers. The OS releases the lock automatically
 * whenever the tab is backgrounded, so it's re-acquired on visibilitychange
 * for as long as `active` stays true.
 */
export function useWakeLock(active: boolean) {
  const lockRef = useRef<WakeLockSentinel | null>(null);

  useEffect(() => {
    if (!active || typeof navigator === 'undefined' || !('wakeLock' in navigator)) return;

    let cancelled = false;

    async function acquire() {
      try {
        const lock = await navigator.wakeLock.request('screen');
        if (cancelled) {
          void lock.release();
          return;
        }
        lockRef.current = lock;
      } catch {
        /* denied, unsupported in this context, or tab not visible — fine either way */
      }
    }

    void acquire();

    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible' && !lockRef.current) void acquire();
    };
    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', onVisibilityChange);
      void lockRef.current?.release();
      lockRef.current = null;
    };
  }, [active]);
}
