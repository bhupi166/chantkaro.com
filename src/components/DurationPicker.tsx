import { useState } from 'react';
import { useTranslation } from 'react-i18next';

const PRESET_MINUTES = [1, 2, 5, 10];
export const MIN_DURATION_SECONDS = 60;
export const MAX_DURATION_SECONDS = 30 * 60;

interface DurationPickerProps {
  value: number | null;
  onChange: (seconds: number | null) => void;
}

const PRESET_LABEL_KEYS: Record<number, string> = {
  1: 'timer.oneMinute',
  2: 'timer.twoMinutes',
  5: 'timer.fiveMinutes',
  10: 'timer.tenMinutes',
};

export function DurationPicker({ value, onChange }: DurationPickerProps) {
  const { t } = useTranslation();
  const presetSeconds = PRESET_MINUTES.map((m) => m * 60);
  const isPreset = value != null && presetSeconds.includes(value);
  const [customOpen, setCustomOpen] = useState(value != null && !isPreset);
  const [minutesInput, setMinutesInput] = useState(
    value != null ? String(Math.floor(value / 60)) : '',
  );
  const [secondsInput, setSecondsInput] = useState(value != null ? String(value % 60) : '');
  const [error, setError] = useState<string | null>(null);

  function applyCustom(minutesStr: string, secondsStr: string) {
    if (!minutesStr && !secondsStr) {
      setError(null);
      onChange(null);
      return;
    }
    const minutes = minutesStr === '' ? 0 : Number(minutesStr);
    const seconds = secondsStr === '' ? 0 : Number(secondsStr);
    if (
      !Number.isFinite(minutes) ||
      !Number.isFinite(seconds) ||
      minutes < 0 ||
      seconds < 0 ||
      seconds > 59
    ) {
      setError(t('timer.durationInvalid'));
      onChange(null);
      return;
    }
    const total = Math.floor(minutes) * 60 + Math.floor(seconds);
    if (total < MIN_DURATION_SECONDS) {
      setError(t('timer.durationTooShort'));
      onChange(null);
      return;
    }
    if (total > MAX_DURATION_SECONDS) {
      setError(t('timer.durationTooLong'));
      onChange(null);
      return;
    }
    setError(null);
    onChange(total);
  }

  return (
    <fieldset>
      <legend className="mb-2 text-sm font-medium text-[color:var(--fg-muted)]">
        {t('timer.selectDuration')}
      </legend>
      <div className="flex flex-wrap gap-2" role="group" aria-label={t('timer.selectDuration')}>
        {PRESET_MINUTES.map((minutes) => (
          <DurationButton
            key={minutes}
            label={t(PRESET_LABEL_KEYS[minutes])}
            selected={!customOpen && value === minutes * 60}
            onClick={() => {
              setCustomOpen(false);
              setError(null);
              onChange(minutes * 60);
            }}
          />
        ))}
        <DurationButton
          label={t('target.custom')}
          selected={customOpen}
          onClick={() => {
            setCustomOpen(true);
            applyCustom(minutesInput, secondsInput);
          }}
        />
      </div>
      {customOpen && (
        <div className="mt-3 flex flex-wrap items-end gap-3">
          <div>
            <label
              htmlFor="duration-minutes"
              className="mb-1 block text-xs text-[color:var(--fg-muted)]"
            >
              {t('timer.minutesLabel')}
            </label>
            <input
              id="duration-minutes"
              type="number"
              inputMode="numeric"
              min={0}
              max={30}
              placeholder="0"
              value={minutesInput}
              onChange={(e) => {
                setMinutesInput(e.target.value);
                applyCustom(e.target.value, secondsInput);
              }}
              className="w-24 rounded-xl border border-[color:var(--border)] bg-[color:var(--bg-elevated)] px-3 py-2 text-base"
            />
          </div>
          <div>
            <label
              htmlFor="duration-seconds"
              className="mb-1 block text-xs text-[color:var(--fg-muted)]"
            >
              {t('timer.secondsLabel')}
            </label>
            <input
              id="duration-seconds"
              type="number"
              inputMode="numeric"
              min={0}
              max={59}
              placeholder="0"
              value={secondsInput}
              onChange={(e) => {
                setSecondsInput(e.target.value);
                applyCustom(minutesInput, e.target.value);
              }}
              className="w-24 rounded-xl border border-[color:var(--border)] bg-[color:var(--bg-elevated)] px-3 py-2 text-base"
            />
          </div>
        </div>
      )}
      {error && (
        <p role="alert" className="mt-2 text-sm text-red-600">
          {error}
        </p>
      )}
    </fieldset>
  );
}

function DurationButton({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`min-h-11 rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
        selected
          ? 'border-[color:var(--accent)] bg-[color:var(--accent)] text-[color:var(--accent-contrast)]'
          : 'border-[color:var(--border)] bg-[color:var(--bg-elevated)] text-[color:var(--fg)]'
      }`}
    >
      {label}
    </button>
  );
}
