import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { RepetitionTarget } from '@/lib/types';

const PRESETS: RepetitionTarget[] = [11, 21, 51, 108, 1008];

interface TargetPickerProps {
  value: RepetitionTarget;
  onChange: (target: RepetitionTarget) => void;
}

export function TargetPicker({ value, onChange }: TargetPickerProps) {
  const { t } = useTranslation();
  const isPreset = value == null || PRESETS.includes(value);
  const [customOpen, setCustomOpen] = useState(!isPreset);
  const [customValue, setCustomValue] = useState(isPreset ? '' : String(value));

  return (
    <fieldset>
      <legend className="mb-2 text-sm font-medium text-[color:var(--fg-muted)]">
        {t('target.legend')}
      </legend>
      <div className="flex flex-wrap gap-2" role="group" aria-label={t('target.groupLabel')}>
        <TargetButton
          label={t('target.noTarget')}
          selected={value == null}
          onClick={() => onChange(null)}
        />
        {PRESETS.map((preset) => (
          <TargetButton
            key={preset}
            label={String(preset)}
            selected={value === preset}
            onClick={() => onChange(preset)}
          />
        ))}
        <TargetButton
          label={t('target.custom')}
          selected={customOpen}
          onClick={() => {
            setCustomOpen(true);
            if (customValue) onChange(Number(customValue));
          }}
        />
      </div>
      {customOpen && (
        <div className="mt-3">
          <label htmlFor="custom-target" className="sr-only">
            {t('target.customNumberLabel')}
          </label>
          <input
            id="custom-target"
            type="number"
            inputMode="numeric"
            min={1}
            max={100000}
            placeholder={t('target.enterNumberPlaceholder')}
            className="w-40 rounded-xl border border-[color:var(--border)] bg-[color:var(--bg-elevated)] px-3 py-2 text-base"
            value={customValue}
            onChange={(e) => {
              const v = e.target.value;
              setCustomValue(v);
              const n = Number(v);
              if (v && Number.isFinite(n) && n > 0) onChange(Math.floor(n));
            }}
          />
        </div>
      )}
    </fieldset>
  );
}

function TargetButton({
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
