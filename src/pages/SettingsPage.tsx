import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppData } from '@/state/AppDataContext';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { clearAppData, exportAppDataJson, importAppDataJson } from '@/lib/storage';
import { supportsVibration } from '@/lib/vibration';
import type { ThemePreference, UiLanguage } from '@/lib/types';

export function SettingsPage() {
  const { t } = useTranslation();
  const { data, activeProfile, dispatch } = useAppData();
  const [newProfileName, setNewProfileName] = useState('');
  const [clearOpen, setClearOpen] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [importOk, setImportOk] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleExport() {
    const json = exportAppDataJson(data);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chant-karo-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  async function handleImportFile(file: File) {
    setImportError(null);
    setImportOk(false);
    const text = await file.text();
    const result = importAppDataJson(text);
    if (!result.ok || !result.data) {
      setImportError(
        result.error === 'invalid-json'
          ? t('settings.importErrorInvalidJson')
          : t('settings.importErrorInvalidBackup'),
      );
      return;
    }
    dispatch({ type: 'IMPORT_DATA', data: result.data });
    setImportOk(true);
  }

  function handleClearConfirmed() {
    const fresh = clearAppData();
    dispatch({ type: 'IMPORT_DATA', data: fresh });
    setClearOpen(false);
  }

  return (
    <div className="flex flex-col gap-8">
      <h1 className="font-display text-2xl font-semibold">{t('settings.title')}</h1>

      <Section title={t('settings.profilesTitle')}>
        <p className="text-sm text-[color:var(--fg-muted)]">{t('settings.profilesDescription')}</p>
        <ul className="mt-3 flex flex-wrap gap-2">
          {data.profiles.map((p) => (
            <li key={p.id}>
              <button
                type="button"
                onClick={() => dispatch({ type: 'SWITCH_PROFILE', profileId: p.id })}
                aria-pressed={p.id === data.activeProfileId}
                className={`min-h-11 rounded-full border px-4 py-2 text-sm font-medium ${
                  p.id === data.activeProfileId
                    ? 'border-[color:var(--accent)] bg-[color:var(--accent)] text-[color:var(--accent-contrast)]'
                    : 'border-[color:var(--border)] bg-[color:var(--bg-elevated)]'
                }`}
              >
                {p.name}
              </button>
            </li>
          ))}
        </ul>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <label htmlFor="new-profile" className="sr-only">
            {t('settings.newProfilePlaceholder')}
          </label>
          <input
            id="new-profile"
            value={newProfileName}
            onChange={(e) => setNewProfileName(e.target.value)}
            placeholder={t('settings.newProfilePlaceholder')}
            className="min-h-11 rounded-xl border border-[color:var(--border)] bg-[color:var(--bg-elevated)] px-3 py-2 text-sm"
          />
          <button
            type="button"
            onClick={() => {
              if (!newProfileName.trim()) return;
              dispatch({ type: 'CREATE_PROFILE', name: newProfileName });
              setNewProfileName('');
            }}
            className="min-h-11 rounded-full border border-[color:var(--border)] px-4 py-2 text-sm font-medium"
          >
            {t('settings.addProfile')}
          </button>
          {data.profiles.length > 1 && (
            <button
              type="button"
              onClick={() => dispatch({ type: 'DELETE_PROFILE', profileId: activeProfile.id })}
              className="min-h-11 rounded-full border border-[color:var(--border)] px-4 py-2 text-sm font-medium text-red-600"
            >
              {t('settings.deleteProfile')}
            </button>
          )}
        </div>
      </Section>

      <Section title={t('settings.contributionTitle')}>
        <ToggleRow
          label={t('settings.contributeToggleLabel')}
          checked={activeProfile.contributeToGlobalTotals}
          onChange={(checked) =>
            dispatch({ type: 'UPDATE_SETTINGS', patch: { contributeToGlobalTotals: checked } })
          }
        />
        <p className="mt-2 text-sm text-[color:var(--fg-muted)]">
          {t('settings.contributionDescription')}
        </p>
      </Section>

      <Section title={t('settings.practiceFeelTitle')}>
        {supportsVibration() && (
          <ToggleRow
            label={t('settings.vibrationLabel')}
            checked={activeProfile.vibrationEnabled}
            onChange={(checked) =>
              dispatch({ type: 'UPDATE_SETTINGS', patch: { vibrationEnabled: checked } })
            }
          />
        )}
        <ToggleRow
          label={t('settings.soundLabel')}
          checked={activeProfile.soundEnabled}
          onChange={(checked) =>
            dispatch({ type: 'UPDATE_SETTINGS', patch: { soundEnabled: checked } })
          }
        />
        <ToggleRow
          label={t('settings.completionSoundLabel')}
          checked={activeProfile.completionSoundEnabled !== false}
          onChange={(checked) =>
            dispatch({ type: 'UPDATE_SETTINGS', patch: { completionSoundEnabled: checked } })
          }
        />
      </Section>

      <Section title={t('settings.appearanceTitle')}>
        <div className="flex flex-col gap-4 sm:flex-row">
          <div>
            <label htmlFor="theme-select" className="mb-1 block text-sm font-medium">
              {t('settings.themeLabel')}
            </label>
            <select
              id="theme-select"
              value={activeProfile.theme}
              onChange={(e) =>
                dispatch({
                  type: 'UPDATE_SETTINGS',
                  patch: { theme: e.target.value as ThemePreference },
                })
              }
              className="min-h-11 rounded-xl border border-[color:var(--border)] bg-[color:var(--bg-elevated)] px-3 py-2 text-sm"
            >
              <option value="system">{t('settings.themeSystem')}</option>
              <option value="light">{t('settings.themeLight')}</option>
              <option value="dark">{t('settings.themeDark')}</option>
            </select>
          </div>
          <div>
            <label htmlFor="lang-select" className="mb-1 block text-sm font-medium">
              {t('settings.languageLabel')}
            </label>
            <select
              id="lang-select"
              value={activeProfile.uiLanguage}
              onChange={(e) =>
                dispatch({
                  type: 'UPDATE_SETTINGS',
                  patch: { uiLanguage: e.target.value as UiLanguage },
                })
              }
              className="min-h-11 rounded-xl border border-[color:var(--border)] bg-[color:var(--bg-elevated)] px-3 py-2 text-sm"
            >
              <option value="en">{t('settings.languageEnglish')}</option>
              <option value="hi">{t('settings.languageHindi')}</option>
              <option value="pa">{t('settings.languagePunjabi')}</option>
            </select>
          </div>
        </div>
        <div className="mt-4">
          <ToggleRow
            label={t('settings.dailyColorThemeLabel')}
            checked={Boolean(activeProfile.dailyColorTheme)}
            onChange={(checked) =>
              dispatch({ type: 'UPDATE_SETTINGS', patch: { dailyColorTheme: checked } })
            }
          />
          <p className="mt-2 text-sm text-[color:var(--fg-muted)]">
            {t('settings.dailyColorThemeDescription')}
          </p>
        </div>
      </Section>

      <Section title={t('settings.dataTitle')}>
        <p className="text-sm text-[color:var(--fg-muted)]">{t('settings.dataDescription')}</p>
        <div className="mt-3 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handleExport}
            className="min-h-11 rounded-full border border-[color:var(--border)] px-4 py-2 text-sm font-medium"
          >
            {t('settings.exportButton')}
          </button>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="min-h-11 rounded-full border border-[color:var(--border)] px-4 py-2 text-sm font-medium"
          >
            {t('settings.importButton')}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void handleImportFile(file);
              e.target.value = '';
            }}
          />
          <button
            type="button"
            onClick={() => setClearOpen(true)}
            className="min-h-11 rounded-full border border-[color:var(--border)] px-4 py-2 text-sm font-medium text-red-600"
          >
            {t('settings.clearButton')}
          </button>
        </div>
        {importError && (
          <p role="alert" className="mt-2 text-sm text-red-600">
            {importError}
          </p>
        )}
        {importOk && (
          <p role="status" className="mt-2 text-sm text-green-700">
            {t('settings.importSuccess')}
          </p>
        )}
      </Section>

      <ConfirmDialog
        open={clearOpen}
        title={t('settings.clearDialogTitle')}
        description={t('settings.clearDialogDescription')}
        confirmLabel={t('settings.clearConfirmLabel')}
        destructive
        onConfirm={handleClearConfirmed}
        onCancel={() => setClearOpen(false)}
      />
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="card-surface rounded-2xl p-6">
      <h2 className="font-display text-lg font-semibold">{title}</h2>
      <div className="mt-3">{children}</div>
    </section>
  );
}

function ToggleRow({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex min-h-11 cursor-pointer items-center justify-between gap-4 py-1">
      <span>{label}</span>
      <input
        type="checkbox"
        role="switch"
        aria-checked={checked}
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-6 w-11 cursor-pointer appearance-none rounded-full bg-[color:var(--border)] transition-colors checked:bg-[color:var(--accent)] relative before:absolute before:left-0.5 before:top-0.5 before:h-5 before:w-5 before:rounded-full before:bg-white before:transition-transform checked:before:translate-x-5"
      />
    </label>
  );
}
