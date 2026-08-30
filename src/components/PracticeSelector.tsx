import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAppData } from '@/state/AppDataContext';
import { resolveRecentSelections } from '@/lib/recent';
import { practiceKey } from '@/lib/practice';
import { localizedOptionTitle } from '@/lib/practiceLocalization';
import { TargetPicker } from './TargetPicker';
import { DurationPicker } from './DurationPicker';
import type {
  PracticeCategory,
  PracticeMode,
  PracticeOption,
  PracticeSelection,
  RepetitionTarget,
} from '@/lib/types';

interface PracticeSelectorProps {
  category: PracticeCategory;
  /** i18next keys — resolved here so every call site just names its copy. */
  headingKey: string;
  supportingTextKey: string;
  customLabelKey: string;
  customPlaceholderKey: string;
  privacyTextKey: string;
  options: PracticeOption[];
  featuredIds?: string[];
  showTraditionFilter?: boolean;
  contentNoteKey?: string;
  /** Interpolation values for headingKey/supportingTextKey, if needed. */
  headingValues?: Record<string, string>;
  supportingTextValues?: Record<string, string>;
}

export function PracticeSelector({
  category,
  headingKey,
  supportingTextKey,
  customLabelKey,
  customPlaceholderKey,
  privacyTextKey,
  options,
  featuredIds,
  showTraditionFilter = false,
  contentNoteKey,
  headingValues,
  supportingTextValues,
}: PracticeSelectorProps) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { activeProfile, dispatch } = useAppData();
  const [search, setSearch] = useState('');
  const [tradition, setTradition] = useState<string>('all');
  const [browseAll, setBrowseAll] = useState(!featuredIds);
  const [customText, setCustomText] = useState('');
  const [selection, setSelection] = useState<PracticeSelection | null>(null);
  const [target, setTarget] = useState<RepetitionTarget>(null);
  const [mode, setMode] = useState<PracticeMode>('tap');
  const [durationSeconds, setDurationSeconds] = useState<number | null>(null);

  const heading = t(headingKey, headingValues);
  const supportingText = t(supportingTextKey, supportingTextValues);
  const customLabel = t(customLabelKey);
  const customPlaceholder = t(customPlaceholderKey);
  const privacyText = t(privacyTextKey);
  const contentNote = contentNoteKey ? t(contentNoteKey) : undefined;

  const traditions = useMemo(() => {
    if (!showTraditionFilter) return [];
    const set = new Set(options.map((o) => o.tradition));
    return Array.from(set);
  }, [options, showTraditionFilter]);

  const filtered = useMemo(() => {
    let list = options;
    // The small "Suggested" teaser set only makes sense across all
    // traditions at once — once someone picks a specific tradition they
    // clearly want everything in it, not just whichever items happened to
    // make the teaser cut.
    if (!browseAll && tradition === 'all' && featuredIds) {
      list = featuredIds
        .map((id) => options.find((o) => o.id === id))
        .filter((o): o is PracticeOption => !!o);
    }
    if (tradition !== 'all') list = list.filter((o) => o.tradition === tradition);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (o) =>
          o.title.toLowerCase().includes(q) ||
          o.script?.toLowerCase().includes(q) ||
          localizedOptionTitle(o, i18n.language).toLowerCase().includes(q),
      );
    }
    return list;
  }, [options, browseAll, featuredIds, tradition, search, i18n.language]);

  const recents = useMemo(
    () => resolveRecentSelections(activeProfile, category, i18n.language, 5),
    [activeProfile, category, i18n.language],
  );

  function chooseOption(option: PracticeOption) {
    setSelection({
      category,
      optionId: option.id,
      displayText: localizedOptionTitle(option, i18n.language),
      displayScript: option.category === 'chant' ? option.script : undefined,
    });
  }

  function chooseRecent(entry: PracticeSelection) {
    setSelection(entry);
  }

  function useCustomText() {
    const text = customText.trim();
    if (!text) return;
    dispatch({ type: 'ADD_CUSTOM_PRACTICE', category, text });
    // The reducer generates the id internally; find it back is unnecessary —
    // we key off displayText for custom selections that were just entered
    // by leaving customId unset, which the practice key derives from text.
    // Custom text is the user's own words and is never translated.
    setSelection({ category, displayText: text });
  }

  const canBegin = !!selection && (mode !== 'timer' || !!durationSeconds);

  function begin() {
    if (!canBegin || !selection) return;
    if (mode === 'timer') {
      dispatch({
        type: 'SET_ACTIVE_PRACTICE',
        selection,
        mode,
        timerDurationSeconds: durationSeconds ?? undefined,
      });
    } else {
      dispatch({ type: 'SET_ACTIVE_PRACTICE', selection, mode });
      const key = practiceKey(selection);
      dispatch({ type: 'SET_TARGET', key, target });
    }
    navigate('/practice');
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-semibold">{heading}</h1>
        <p className="mt-1 text-[color:var(--fg-muted)]">{supportingText}</p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <label htmlFor="practice-search" className="sr-only">
          {t('practiceSelector.searchLabel')}
        </label>
        <input
          id="practice-search"
          type="search"
          placeholder={t('practiceSelector.searchLabel')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="min-h-11 flex-1 rounded-xl border border-[color:var(--border)] bg-[color:var(--bg-elevated)] px-4 py-2 text-base"
        />
        {featuredIds && (
          <button
            type="button"
            onClick={() => setBrowseAll((v) => !v)}
            className="min-h-11 rounded-full border border-[color:var(--border)] px-4 py-2 text-sm font-medium"
          >
            {browseAll ? t('practiceSelector.showSuggested') : t('practiceSelector.browseAll')}
          </button>
        )}
      </div>

      {showTraditionFilter && (
        <div
          className="flex flex-wrap gap-2"
          role="group"
          aria-label={t('practiceSelector.filterByTraditionLabel')}
        >
          <FilterChip
            label={t('practiceSelector.allTraditions')}
            selected={tradition === 'all'}
            onClick={() => setTradition('all')}
          />
          {traditions.map((tr) => (
            <FilterChip
              key={tr}
              label={t(`traditions.${tr}`, tr)}
              selected={tradition === tr}
              onClick={() => setTradition(tr)}
            />
          ))}
        </div>
      )}

      {recents.length > 0 && (
        <div>
          <h2 className="mb-2 text-sm font-semibold text-[color:var(--fg-muted)]">
            {t('practiceSelector.recentlyUsed')}
          </h2>
          <div className="flex flex-wrap gap-2">
            {recents.map((r, i) => (
              <button
                key={i}
                type="button"
                onClick={() => chooseRecent(r.selection)}
                className="min-h-11 rounded-full border border-[color:var(--border)] bg-[color:var(--bg-elevated)] px-4 py-2 text-sm"
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>
      )}

      <ul className="grid gap-2 sm:grid-cols-2" aria-label={heading}>
        {filtered.map((option) => (
          <li key={option.id}>
            <button
              type="button"
              onClick={() => chooseOption(option)}
              aria-pressed={selection?.optionId === option.id}
              className={`flex min-h-11 w-full flex-col items-start rounded-xl border px-4 py-3 text-left transition-colors ${
                selection?.optionId === option.id
                  ? 'border-[color:var(--accent)] bg-[color:var(--bg-elevated)]'
                  : 'border-[color:var(--border)] bg-[color:var(--bg-elevated)]'
              }`}
            >
              <span className="font-medium">{localizedOptionTitle(option, i18n.language)}</span>
              {option.category === 'chant' && option.script && (
                <span lang={option.scriptLang} className="text-sm text-[color:var(--fg-muted)]">
                  {option.script}
                </span>
              )}
            </button>
          </li>
        ))}
      </ul>

      {contentNote && <p className="text-xs text-[color:var(--fg-muted)]">{contentNote}</p>}

      <div className="card-surface rounded-2xl p-5">
        <label htmlFor="custom-practice" className="font-medium">
          {customLabel}
        </label>
        <textarea
          id="custom-practice"
          rows={2}
          placeholder={customPlaceholder}
          value={customText}
          onChange={(e) => setCustomText(e.target.value)}
          className="mt-2 w-full rounded-xl border border-[color:var(--border)] bg-[color:var(--bg)] px-4 py-2 text-base"
        />
        <p className="mt-2 text-xs text-[color:var(--fg-muted)]">{privacyText}</p>
        <button
          type="button"
          onClick={useCustomText}
          disabled={!customText.trim()}
          className="mt-3 min-h-11 rounded-full bg-[color:var(--accent)] px-5 py-2.5 text-sm font-semibold text-[color:var(--accent-contrast)] disabled:opacity-50"
        >
          {t('practiceSelector.useThisText')}
        </button>
      </div>

      {selection && (
        <div className="card-surface sticky bottom-4 flex flex-col gap-4 rounded-2xl p-5">
          <div>
            <p className="text-sm text-[color:var(--fg-muted)]">{t('practiceSelector.selected')}</p>
            <p className="font-display text-lg font-semibold">{selection.displayText}</p>
          </div>
          {mode === 'timer' ? (
            <DurationPicker value={durationSeconds} onChange={setDurationSeconds} />
          ) : (
            <TargetPicker value={target} onChange={setTarget} />
          )}
          <fieldset>
            <legend className="mb-2 text-sm font-medium text-[color:var(--fg-muted)]">
              {t('practiceSelector.howWillYouCount')}
            </legend>
            <div className="flex flex-wrap gap-2">
              <ModeButton
                label={t('practiceSelector.tapMode')}
                selected={mode === 'tap'}
                onClick={() => setMode('tap')}
              />
              <ModeButton
                label={t('practiceSelector.voiceModeBeta')}
                selected={mode === 'voice'}
                onClick={() => setMode('voice')}
              />
              <ModeButton
                label={t('practiceSelector.timerMode')}
                selected={mode === 'timer'}
                onClick={() => setMode('timer')}
              />
            </div>
          </fieldset>
          <button
            type="button"
            onClick={begin}
            disabled={!canBegin}
            className="min-h-12 rounded-full bg-[color:var(--accent)] px-6 py-3 text-base font-semibold text-[color:var(--accent-contrast)] disabled:opacity-50"
          >
            {t('practiceSelector.beginPractice')}
          </button>
        </div>
      )}
    </div>
  );
}

function FilterChip({
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
      className={`min-h-9 rounded-full border px-3 py-1.5 text-sm ${
        selected
          ? 'border-[color:var(--accent)] bg-[color:var(--accent)] text-[color:var(--accent-contrast)]'
          : 'border-[color:var(--border)] bg-[color:var(--bg-elevated)]'
      }`}
    >
      {label}
    </button>
  );
}

function ModeButton({
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
      className={`min-h-11 flex-1 rounded-xl border px-4 py-2 text-sm font-medium ${
        selected
          ? 'border-[color:var(--accent)] bg-[color:var(--accent)] text-[color:var(--accent-contrast)]'
          : 'border-[color:var(--border)] bg-[color:var(--bg-elevated)]'
      }`}
    >
      {label}
    </button>
  );
}
