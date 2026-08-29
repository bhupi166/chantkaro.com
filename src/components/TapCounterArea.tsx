import { useEffect, useRef, useState } from 'react';
import { CircularProgress } from './CircularProgress';
import { ConfirmDialog } from './ConfirmDialog';
import { playTapSound } from '@/lib/sound';
import type { PracticeStats } from '@/lib/types';

interface TapCounterAreaProps {
  stats: PracticeStats;
  percent: number | null;
  isComplete: boolean;
  soundEnabled: boolean;
  onTap: () => void;
  onUndo: () => void;
  onResetConfirmed: () => void;
}

function prefersReducedMotion(): boolean {
  return (
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

export function TapCounterArea({
  stats,
  percent,
  isComplete,
  soundEnabled,
  onTap,
  onUndo,
  onResetConfirmed,
}: TapCounterAreaProps) {
  const [paused, setPaused] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [showCompletion, setShowCompletion] = useState(false);
  const wasCompleteRef = useRef(isComplete);

  useEffect(() => {
    if (isComplete && !wasCompleteRef.current) {
      setShowCompletion(true);
    }
    wasCompleteRef.current = isComplete;
  }, [isComplete]);

  function handleTapAreaClick() {
    if (paused) return;
    onTap();
    if (soundEnabled) playTapSound();
  }

  return (
    <div className="flex flex-col items-center gap-6">
      <button
        type="button"
        onClick={handleTapAreaClick}
        disabled={paused}
        aria-label={`Tap to count. Current count ${stats.sessionCount}${stats.target ? ` of ${stats.target}` : ''}.`}
        className={`flex select-none items-center justify-center rounded-full transition-transform active:scale-[0.98] ${
          paused ? 'opacity-50' : ''
        }`}
        style={{ WebkitTapHighlightColor: 'transparent' }}
      >
        <CircularProgress percent={percent}>
          <div className="flex flex-col items-center">
            <span className="font-display text-6xl font-bold tabular-nums">
              {stats.sessionCount}
            </span>
            {stats.target != null && (
              <span className="text-sm text-[color:var(--fg-muted)]">of {stats.target}</span>
            )}
            <span className="mt-2 text-xs text-[color:var(--fg-muted)]">
              {paused ? 'Paused — tap Resume' : 'Tap here'}
            </span>
          </div>
        </CircularProgress>
      </button>

      {showCompletion && (
        <div
          role="status"
          className={`card-surface max-w-sm rounded-2xl p-4 text-center ${
            prefersReducedMotion() ? '' : 'animate-[fadeIn_400ms_ease-out]'
          }`}
        >
          <p className="font-medium">
            You completed your selected target. Continue if it feels right.
          </p>
          <button
            type="button"
            onClick={() => setShowCompletion(false)}
            className="mt-2 text-sm underline underline-offset-2"
          >
            Dismiss
          </button>
        </div>
      )}

      <div className="grid w-full max-w-md grid-cols-3 gap-3 text-center">
        <StatBlock label="Today" value={stats.todayCount} />
        <StatBlock label="Session" value={stats.sessionCount} />
        <StatBlock label="Lifetime" value={stats.lifetimeCount} />
      </div>

      <div
        className="flex flex-wrap justify-center gap-3"
        onClick={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
      >
        <ControlButton label={paused ? 'Resume' : 'Pause'} onClick={() => setPaused((p) => !p)} />
        <ControlButton label="Undo" onClick={onUndo} disabled={stats.sessionCount === 0} />
        <ControlButton label="Reset" onClick={() => setResetOpen(true)} />
      </div>

      <ConfirmDialog
        open={resetOpen}
        title="Reset this session?"
        description="This clears your current session count back to zero. Your today and lifetime totals are not affected."
        confirmLabel="Reset Session"
        destructive
        onConfirm={() => {
          onResetConfirmed();
          setResetOpen(false);
        }}
        onCancel={() => setResetOpen(false)}
      />
    </div>
  );
}

function StatBlock({ label, value }: { label: string; value: number }) {
  return (
    <div className="card-surface rounded-xl p-3">
      <div className="text-xs text-[color:var(--fg-muted)]">{label}</div>
      <div className="font-display text-lg font-semibold tabular-nums">{value}</div>
    </div>
  );
}

function ControlButton({
  label,
  onClick,
  disabled,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="min-h-11 rounded-full border border-[color:var(--border)] bg-[color:var(--bg-elevated)] px-4 py-2 text-sm font-medium disabled:opacity-40"
    >
      {label}
    </button>
  );
}
