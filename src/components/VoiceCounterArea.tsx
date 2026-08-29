import { useState } from 'react';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';
import type { PracticeStats } from '@/lib/types';

interface VoiceCounterAreaProps {
  phrase: string;
  stats: PracticeStats;
  onMatches: (count: number) => void;
  onUndo: () => void;
  onUseTapModeInstead: () => void;
}

export function VoiceCounterArea({
  phrase,
  stats,
  onMatches,
  onUndo,
  onUseTapModeInstead,
}: VoiceCounterAreaProps) {
  const [consented, setConsented] = useState(false);
  const [showTranscript, setShowTranscript] = useState(true);
  const { supported, status, transcript, errorMessage, start, pause, resume, stop } =
    useSpeechRecognition({
      phrase,
      onMatches,
    });

  if (!supported) {
    return (
      <FallbackNotice
        message="Voice Mode is not supported in this browser. You can keep practising with Tap Mode."
        onUseTapModeInstead={onUseTapModeInstead}
      />
    );
  }

  if (!consented) {
    return (
      <div className="card-surface mx-auto flex max-w-md flex-col gap-4 rounded-2xl p-6 text-center">
        <p className="text-sm font-semibold uppercase tracking-wide text-[color:var(--accent)]">
          Voice Mode · Beta
        </p>
        <p>
          Chant Karo needs microphone access to recognize and count your selected words. Voice Mode
          is optional. You can use Tap Mode without microphone access.
        </p>
        <p className="text-sm text-[color:var(--fg-muted)]">
          Chant Karo does not record, store or receive your voice. Your browser or device may
          process speech using its own recognition service. Please review your browser's privacy
          settings before using Voice Mode.
        </p>
        <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
          <button
            type="button"
            onClick={async () => {
              setConsented(true);
              await start();
            }}
            className="min-h-12 rounded-full bg-[color:var(--accent)] px-6 py-3 text-base font-semibold text-[color:var(--accent-contrast)]"
          >
            Allow Microphone & Start
          </button>
          <button
            type="button"
            onClick={onUseTapModeInstead}
            className="min-h-12 rounded-full border border-[color:var(--border)] px-6 py-3 text-base font-semibold"
          >
            Use Tap Mode Instead
          </button>
        </div>
      </div>
    );
  }

  if (status === 'denied') {
    return (
      <FallbackNotice
        message="Microphone access was not granted. You can allow it in your browser settings, or continue with Tap Mode."
        onUseTapModeInstead={onUseTapModeInstead}
      />
    );
  }

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="flex flex-col items-center gap-2">
        <span
          role="status"
          className={`inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium ${
            status === 'listening'
              ? 'bg-[color:var(--accent)] text-[color:var(--accent-contrast)]'
              : 'border border-[color:var(--border)]'
          }`}
        >
          <span
            aria-hidden
            className={`h-2 w-2 rounded-full ${status === 'listening' ? 'bg-white' : 'bg-[color:var(--fg-muted)]'}`}
          />
          {status === 'listening' ? 'Listening…' : status === 'paused' ? 'Paused' : 'Voice Mode'}
        </span>
        <span className="font-display text-6xl font-bold tabular-nums">{stats.sessionCount}</span>
        {stats.target != null && (
          <span className="text-sm text-[color:var(--fg-muted)]">of {stats.target}</span>
        )}
      </div>

      {errorMessage && (
        <p role="alert" className="text-sm text-red-600">
          Voice recognition had a problem ({errorMessage}). You can keep trying or switch to Tap
          Mode.
        </p>
      )}

      <div className="flex flex-wrap justify-center gap-3">
        {status === 'listening' ? (
          <ControlButton label="Pause" onClick={pause} />
        ) : (
          <ControlButton label="Resume" onClick={resume} />
        )}
        <ControlButton label="Undo" onClick={onUndo} disabled={stats.sessionCount === 0} />
        <ControlButton label="Stop" onClick={stop} />
        <ControlButton label="Use Tap Mode Instead" onClick={onUseTapModeInstead} />
      </div>

      <div className="w-full max-w-md">
        <button
          type="button"
          onClick={() => setShowTranscript((v) => !v)}
          className="text-xs text-[color:var(--fg-muted)] underline underline-offset-2"
        >
          {showTranscript ? 'Hide live captions' : 'Show live captions'}
        </button>
        {showTranscript && (
          <p
            aria-live="polite"
            className="mt-2 min-h-8 rounded-xl border border-[color:var(--border)] bg-[color:var(--bg-elevated)] px-3 py-2 text-sm text-[color:var(--fg-muted)]"
          >
            {transcript || '…'}
          </p>
        )}
      </div>
    </div>
  );
}

function FallbackNotice({
  message,
  onUseTapModeInstead,
}: {
  message: string;
  onUseTapModeInstead: () => void;
}) {
  return (
    <div className="card-surface mx-auto flex max-w-md flex-col gap-4 rounded-2xl p-6 text-center">
      <p>{message}</p>
      <button
        type="button"
        onClick={onUseTapModeInstead}
        className="mx-auto min-h-12 rounded-full bg-[color:var(--accent)] px-6 py-3 text-base font-semibold text-[color:var(--accent-contrast)]"
      >
        Use Tap Mode Instead
      </button>
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
