import { useCallback, useEffect, useState } from 'react';

export function useFullscreen(target: () => HTMLElement | null) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const supported = typeof document !== 'undefined' && !!document.documentElement.requestFullscreen;

  useEffect(() => {
    const onChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, []);

  const toggle = useCallback(async () => {
    if (!supported) return;
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else {
        await target()?.requestFullscreen();
      }
    } catch {
      /* fullscreen may be blocked by the browser/user gesture policy */
    }
  }, [supported, target]);

  return { isFullscreen, toggle, supported };
}
