import { useCallback, useEffect, useRef, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAppData } from '@/state/AppDataContext';
import { usePracticeCounter } from '@/hooks/usePracticeCounter';
import { useFullscreen } from '@/hooks/useFullscreen';
import { globalTotalsClient } from '@/lib/globalTotalsClient';
import { TapCounterArea } from '@/components/TapCounterArea';
import { VoiceCounterArea } from '@/components/VoiceCounterArea';
import type { PracticeMode } from '@/lib/types';

export function PracticePage() {
  const navigate = useNavigate();
  const { activeProfile, dispatch } = useAppData();
  const selection = activeProfile.lastActivePractice;
  const [mode, setMode] = useState<PracticeMode>(activeProfile.lastMode ?? 'tap');
  const containerRef = useRef<HTMLDivElement>(null);
  const {
    toggle: toggleFullscreen,
    isFullscreen,
    supported: fullscreenSupported,
  } = useFullscreen(() => containerRef.current);

  const counter = usePracticeCounter(selection ?? { category: 'chant', displayText: '' });

  useEffect(() => {
    globalTotalsClient.start();
    return () => {
      globalTotalsClient.flushPendingNow();
    };
  }, []);

  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') globalTotalsClient.flushPendingNow();
    };
    window.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('pagehide', onVisibility);
    return () => {
      window.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('pagehide', onVisibility);
    };
  }, []);

  const handleVoiceMatches = useCallback(
    (count: number) => {
      for (let i = 0; i < count; i++) counter.tap();
    },
    [counter],
  );

  if (!selection) {
    return <Navigate to="/choose" replace />;
  }

  return (
    <div ref={containerRef} className="flex flex-col items-center gap-8 bg-[color:var(--bg)] py-4">
      {!activeProfile.hasSeenContributionNotice && activeProfile.contributeToGlobalTotals && (
        <div role="status" className="card-surface w-full max-w-xl rounded-2xl p-4 text-sm">
          <p>
            Anonymous contribution is on. Only numerical increments and the activity type are added
            to the global community total. Your words, voice, identity and personal history remain
            private. You can turn this off anytime in Settings.
          </p>
          <div className="mt-3 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() =>
                dispatch({ type: 'UPDATE_SETTINGS', patch: { hasSeenContributionNotice: true } })
              }
              className="min-h-9 rounded-full bg-[color:var(--accent)] px-4 py-1.5 text-sm font-semibold text-[color:var(--accent-contrast)]"
            >
              Got it
            </button>
            <button
              type="button"
              onClick={() =>
                dispatch({
                  type: 'UPDATE_SETTINGS',
                  patch: { hasSeenContributionNotice: true, contributeToGlobalTotals: false },
                })
              }
              className="min-h-9 rounded-full border border-[color:var(--border)] px-4 py-1.5 text-sm font-medium"
            >
              Keep My Counts Private
            </button>
          </div>
        </div>
      )}

      <div className="flex flex-col items-center gap-1 text-center">
        <p className="text-xs font-medium uppercase tracking-wide text-[color:var(--fg-muted)]">
          {selection.category === 'chant' ? 'Chant / Prayer' : 'Affirmation'}
        </p>
        <h1 className="font-display text-2xl font-semibold">{selection.displayText}</h1>
        {selection.displayScript && (
          <p className="text-lg text-[color:var(--fg-muted)]">{selection.displayScript}</p>
        )}
      </div>

      {mode === 'tap' ? (
        <TapCounterArea
          stats={counter.stats}
          percent={counter.percent}
          isComplete={counter.isComplete}
          soundEnabled={activeProfile.soundEnabled}
          onTap={counter.tap}
          onUndo={counter.undo}
          onResetConfirmed={counter.resetSession}
        />
      ) : (
        <VoiceCounterArea
          phrase={selection.displayText}
          stats={counter.stats}
          onMatches={handleVoiceMatches}
          onUndo={counter.undo}
          onUseTapModeInstead={() => setMode('tap')}
        />
      )}

      <div className="flex flex-wrap justify-center gap-3">
        <SecondaryButton label="Change Practice" onClick={() => navigate('/choose')} />
        <SecondaryButton label="Settings" onClick={() => navigate('/settings')} />
        {fullscreenSupported && (
          <SecondaryButton
            label={isFullscreen ? 'Exit Full Screen' : 'Full Screen'}
            onClick={() => void toggleFullscreen()}
          />
        )}
      </div>
    </div>
  );
}

function SecondaryButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="min-h-11 rounded-full border border-[color:var(--border)] bg-[color:var(--bg-elevated)] px-4 py-2 text-sm font-medium"
    >
      {label}
    </button>
  );
}
