import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ConfirmDialog } from './ConfirmDialog';
import { DurationPicker } from './DurationPicker';
import { useWakeLock } from '@/hooks/useWakeLock';
import { playCompletionSound } from '@/lib/sound';
import { vibrate } from '@/lib/vibration';

const READY_SECONDS = 5;

type Phase = 'ready' | 'running' | 'paused' | 'completed';

interface TimerCounterAreaProps {
  /** The duration (seconds) chosen on the practice-setup screen. */
  durationSeconds: number;
  completionSoundEnabled: boolean;
  vibrationEnabled: boolean;
  onExitHome: () => void;
}

function formatClock(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function TimerCounterArea({
  durationSeconds,
  completionSoundEnabled,
  vibrationEnabled,
  onExitHome,
}: TimerCounterAreaProps) {
  const { t } = useTranslation();
  const [duration, setDuration] = useState(durationSeconds);
  const [phase, setPhase] = useState<Phase>('ready');
  const [readyCount, setReadyCount] = useState(READY_SECONDS);
  const [remaining, setRemaining] = useState(durationSeconds);
  const [stopOpen, setStopOpen] = useState(false);
  const [pickingNewDuration, setPickingNewDuration] = useState(false);
  const endAtRef = useRef<number | null>(null);
  const playedCompletionRef = useRef(false);

  // The screen must not sleep during the ready countdown or an active/paused
  // timer — only once the session is actually finished.
  useWakeLock(phase !== 'completed');

  // Ready countdown: "Get Ready", then 5→1 (one full second each), then the
  // real timer starts — this 5s lead-in is never deducted from `duration`.
  useEffect(() => {
    if (phase !== 'ready') return;
    if (readyCount <= 1) {
      const id = setTimeout(() => {
        endAtRef.current = Date.now() + duration * 1000;
        setPhase('running');
      }, 1000);
      return () => clearTimeout(id);
    }
    const id = setTimeout(() => setReadyCount((c) => c - 1), 1000);
    return () => clearTimeout(id);
  }, [phase, readyCount, duration]);

  // The running timer is anchored to a wall-clock end time (not a naive
  // "subtract 1 every tick") so it can't drift if the browser throttles a
  // backgrounded tab's timers.
  useEffect(() => {
    if (phase !== 'running') return;
    const id = setInterval(() => {
      const msLeft = (endAtRef.current ?? Date.now()) - Date.now();
      const secondsLeft = Math.max(0, Math.ceil(msLeft / 1000));
      setRemaining(secondsLeft);
      if (secondsLeft <= 0) setPhase('completed');
    }, 200);
    return () => clearInterval(id);
  }, [phase]);

  // Completion feedback — sound + vibration, guaranteed exactly once per session.
  useEffect(() => {
    if (phase !== 'completed' || playedCompletionRef.current) return;
    playedCompletionRef.current = true;
    if (completionSoundEnabled) playCompletionSound();
    if (vibrationEnabled) vibrate([200, 100, 200]);
  }, [phase, completionSoundEnabled, vibrationEnabled]);

  const pause = useCallback(() => {
    setPhase((p) => {
      if (p !== 'running') return p;
      endAtRef.current = null;
      return 'paused';
    });
  }, []);

  const resume = useCallback(() => {
    setPhase((p) => {
      if (p !== 'paused') return p;
      endAtRef.current = Date.now() + remaining * 1000;
      return 'running';
    });
  }, [remaining]);

  const restart = useCallback((newDurationSeconds: number) => {
    setDuration(newDurationSeconds);
    setRemaining(newDurationSeconds);
    setReadyCount(READY_SECONDS);
    playedCompletionRef.current = false;
    endAtRef.current = null;
    setPickingNewDuration(false);
    setPhase('ready');
  }, []);

  if (phase === 'ready') {
    return (
      <div role="status" aria-live="assertive" className="flex flex-col items-center gap-4 py-16">
        <p className="text-lg font-medium text-[color:var(--fg-muted)]">{t('timer.getReady')}</p>
        <span className="font-display text-8xl font-bold tabular-nums text-[color:var(--accent)]">
          {readyCount}
        </span>
      </div>
    );
  }

  if (phase === 'completed') {
    return (
      <div className="flex flex-col items-center gap-6 text-center">
        <div className="card-surface flex flex-col items-center gap-2 rounded-2xl p-8">
          <p className="font-display text-2xl font-semibold">{t('timer.completedTitle')}</p>
          <p className="text-[color:var(--fg-muted)]">{t('timer.completedSubtitle')}</p>
        </div>

        {pickingNewDuration ? (
          <div className="card-surface w-full max-w-sm rounded-2xl p-5">
            <DurationPicker
              value={duration}
              onChange={(seconds) => {
                if (seconds) restart(seconds);
              }}
            />
          </div>
        ) : (
          <div className="flex flex-wrap justify-center gap-3">
            <PrimaryButton label={t('timer.practiceAgain')} onClick={() => restart(duration)} />
            <ControlButton
              label={t('timer.selectAnotherDuration')}
              onClick={() => setPickingNewDuration(true)}
            />
            <ControlButton label={t('timer.returnHome')} onClick={onExitHome} />
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-6">
      <div
        role="timer"
        aria-live="off"
        aria-label={t('timer.remainingTimeLabel', { time: formatClock(remaining) })}
        className="flex flex-col items-center gap-2"
      >
        <span className="font-display text-7xl font-bold tabular-nums">
          {formatClock(remaining)}
        </span>
        <span role="status" className="text-sm text-[color:var(--fg-muted)]">
          {phase === 'paused' ? t('timer.paused') : t('timer.inProgress')}
        </span>
      </div>

      <div className="flex flex-wrap justify-center gap-3">
        {phase === 'running' ? (
          <ControlButton label={t('practice.pause')} onClick={pause} />
        ) : (
          <ControlButton label={t('practice.resume')} onClick={resume} />
        )}
        <ControlButton label={t('timer.stop')} onClick={() => setStopOpen(true)} />
      </div>

      <ConfirmDialog
        open={stopOpen}
        title={t('timer.stopDialogTitle')}
        description={t('timer.stopDialogDescription')}
        confirmLabel={t('timer.stopConfirmLabel')}
        destructive
        onConfirm={() => {
          setStopOpen(false);
          onExitHome();
        }}
        onCancel={() => setStopOpen(false)}
      />
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

function PrimaryButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="min-h-11 rounded-full bg-[color:var(--accent)] px-5 py-2.5 text-sm font-semibold text-[color:var(--accent-contrast)]"
    >
      {label}
    </button>
  );
}
