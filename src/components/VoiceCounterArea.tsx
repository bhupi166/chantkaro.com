import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';
import { VOICE_RECOGNITION_LOCALE, type SupportedLanguage } from '@/i18n';
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
  const { t, i18n } = useTranslation();
  const [consented, setConsented] = useState(false);
  const [showTranscript, setShowTranscript] = useState(true);
  const voiceLang =
    VOICE_RECOGNITION_LOCALE[i18n.language as SupportedLanguage] ?? VOICE_RECOGNITION_LOCALE.en;
  const { supported, status, transcript, errorMessage, start, pause, resume, stop } =
    useSpeechRecognition({ phrase, lang: voiceLang, onMatches });

  if (!supported) {
    return (
      <FallbackNotice
        message={t('voice.unsupportedMessage')}
        onUseTapModeInstead={onUseTapModeInstead}
      />
    );
  }

  if (!consented) {
    return (
      <div className="card-surface mx-auto flex max-w-md flex-col gap-4 rounded-2xl p-6 text-center">
        <p className="text-sm font-semibold uppercase tracking-wide text-[color:var(--accent)]">
          {t('voice.betaLabel')}
        </p>
        <p>{t('voice.micPermissionExplain')}</p>
        <p className="text-sm text-[color:var(--fg-muted)]">{t('voice.privacyNotice')}</p>
        <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
          <button
            type="button"
            onClick={async () => {
              setConsented(true);
              await start();
            }}
            className="min-h-12 rounded-full bg-[color:var(--accent)] px-6 py-3 text-base font-semibold text-[color:var(--accent-contrast)]"
          >
            {t('voice.allowAndStart')}
          </button>
          <button
            type="button"
            onClick={onUseTapModeInstead}
            className="min-h-12 rounded-full border border-[color:var(--border)] px-6 py-3 text-base font-semibold"
          >
            {t('voice.useTapModeInstead')}
          </button>
        </div>
      </div>
    );
  }

  if (status === 'denied') {
    return (
      <FallbackNotice
        message={t('voice.deniedMessage')}
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
          {status === 'listening'
            ? t('voice.listening')
            : status === 'paused'
              ? t('voice.paused')
              : t('voice.voiceModeLabel')}
        </span>
        <span className="font-display text-6xl font-bold tabular-nums">{stats.sessionCount}</span>
        {stats.target != null && (
          <span className="text-sm text-[color:var(--fg-muted)]">
            {t('practice.of', { target: stats.target })}
          </span>
        )}
      </div>

      {errorMessage && (
        <p role="alert" className="text-sm text-red-600">
          {t('voice.errorMessage', { error: errorMessage })}
        </p>
      )}

      <div className="flex flex-wrap justify-center gap-3">
        {status === 'listening' ? (
          <ControlButton label={t('practice.pause')} onClick={pause} />
        ) : (
          <ControlButton label={t('practice.resume')} onClick={resume} />
        )}
        <ControlButton
          label={t('practice.undo')}
          onClick={onUndo}
          disabled={stats.sessionCount === 0}
        />
        <ControlButton label={t('voice.stop')} onClick={stop} />
        <ControlButton label={t('voice.useTapModeInstead')} onClick={onUseTapModeInstead} />
      </div>

      <div className="w-full max-w-md">
        <button
          type="button"
          onClick={() => setShowTranscript((v) => !v)}
          className="text-xs text-[color:var(--fg-muted)] underline underline-offset-2"
        >
          {showTranscript ? t('voice.hideLiveCaptions') : t('voice.showLiveCaptions')}
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
  const { t } = useTranslation();
  return (
    <div className="card-surface mx-auto flex max-w-md flex-col gap-4 rounded-2xl p-6 text-center">
      <p>{message}</p>
      <button
        type="button"
        onClick={onUseTapModeInstead}
        className="mx-auto min-h-12 rounded-full bg-[color:var(--accent)] px-6 py-3 text-base font-semibold text-[color:var(--accent-contrast)]"
      >
        {t('voice.useTapModeInstead')}
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
