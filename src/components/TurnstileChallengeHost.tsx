import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { globalTotalsClient } from '@/lib/globalTotalsClient';

interface TurnstileRenderOptions {
  sitekey: string;
  callback: (token: string) => void;
  'error-callback'?: () => void;
  'expired-callback'?: () => void;
}

declare global {
  interface Window {
    turnstile?: {
      render: (container: HTMLElement, options: TurnstileRenderOptions) => string;
      remove: (widgetId: string) => void;
    };
  }
}

const TURNSTILE_SCRIPT_SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js';
let scriptLoadPromise: Promise<void> | null = null;

/** Loaded lazily — only once a challenge is actually needed, never on the normal, frictionless path. */
function loadTurnstileScript(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve();
  if (window.turnstile) return Promise.resolve();
  if (scriptLoadPromise) return scriptLoadPromise;
  scriptLoadPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = TURNSTILE_SCRIPT_SRC;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Turnstile'));
    document.head.appendChild(script);
  });
  return scriptLoadPromise;
}

/**
 * Mounted once near the practice UI. Registers itself with
 * globalTotalsClient as the "challenge solver" — invisible and inert until
 * the server actually flags a session as suspicious (see
 * worker/src/security.ts evaluateBatch), at which point it shows a small
 * Cloudflare Turnstile widget, resolves with the solved token, and gets out
 * of the way again. Personal counting is entirely unaffected either way.
 */
export function TurnstileChallengeHost() {
  const { t } = useTranslation();
  const [siteKey, setSiteKey] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const resolveRef = useRef<((token: string | null) => void) | null>(null);
  const widgetIdRef = useRef<string | null>(null);

  useEffect(() => {
    globalTotalsClient.setChallengeSolver(
      (key) =>
        new Promise<string | null>((resolve) => {
          resolveRef.current = resolve;
          setSiteKey(key);
        }),
    );
    return () => globalTotalsClient.setChallengeSolver(null);
  }, []);

  const settle = useCallback((token: string | null) => {
    resolveRef.current?.(token);
    resolveRef.current = null;
    setSiteKey(null);
  }, []);

  useEffect(() => {
    if (!siteKey || !containerRef.current) return;
    let cancelled = false;

    loadTurnstileScript()
      .then(() => {
        if (cancelled || !window.turnstile || !containerRef.current) return;
        widgetIdRef.current = window.turnstile.render(containerRef.current, {
          sitekey: siteKey,
          callback: (token) => settle(token),
          'error-callback': () => settle(null),
          'expired-callback': () => settle(null),
        });
      })
      .catch(() => settle(null));

    return () => {
      cancelled = true;
      if (widgetIdRef.current && window.turnstile) {
        try {
          window.turnstile.remove(widgetIdRef.current);
        } catch {
          /* widget already gone */
        }
      }
      widgetIdRef.current = null;
    };
  }, [siteKey, settle]);

  if (!siteKey) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={t('practice.verificationTitle')}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
    >
      <div className="card-surface w-full max-w-sm rounded-2xl p-5 text-center">
        <p className="font-medium">{t('practice.verificationTitle')}</p>
        <p className="mt-1 text-sm text-[color:var(--fg-muted)]">{t('practice.verificationBody')}</p>
        <div ref={containerRef} className="mt-4 flex justify-center" />
        <button
          type="button"
          onClick={() => settle(null)}
          className="mt-4 text-sm underline underline-offset-2"
        >
          {t('practice.verificationCancel')}
        </button>
      </div>
    </div>
  );
}
