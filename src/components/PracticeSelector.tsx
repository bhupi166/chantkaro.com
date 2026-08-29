import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppData } from '@/state/AppDataContext';
import { resolveRecentSelections } from '@/lib/recent';
import { practiceKey } from '@/lib/practice';
import { TargetPicker } from './TargetPicker';
import type {
  PracticeCategory,
  PracticeMode,
  PracticeOption,
  PracticeSelection,
  RepetitionTarget,
} from '@/lib/types';
import { TRADITION_LABELS } from '@/data/chants';

interface PracticeSelectorProps {
  category: PracticeCategory;
  heading: string;
  supportingText: string;
  customLabel: string;
  customPlaceholder: string;
  privacyText: string;
  options: PracticeOption[];
  featuredIds?: string[];
  showTraditionFilter?: boolean;
  contentNote?: string;
}

export function PracticeSelector({
  category,
  heading,
  supportingText,
  customLabel,
  customPlaceholder,
  privacyText,
  options,
  featuredIds,
  showTraditionFilter = false,
  contentNote,
}: PracticeSelectorProps) {
  const navigate = useNavigate();
  const { activeProfile, dispatch } = useAppData();
  const [search, setSearch] = useState('');
  const [tradition, setTradition] = useState<string>('all');
  const [browseAll, setBrowseAll] = useState(!featuredIds);
  const [customText, setCustomText] = useState('');
  const [selection, setSelection] = useState<PracticeSelection | null>(null);
  const [target, setTarget] = useState<RepetitionTarget>(null);
  const [mode, setMode] = useState<PracticeMode>('tap');

  const traditions = useMemo(() => {
    if (!showTraditionFilter) return [];
    const set = new Set(options.map((o) => o.tradition));
    return Array.from(set);
  }, [options, showTraditionFilter]);

  const filtered = useMemo(() => {
    let list = options;
    if (!browseAll && featuredIds) {
      list = featuredIds
        .map((id) => options.find((o) => o.id === id))
        .filter((o): o is PracticeOption => !!o);
    }
    if (tradition !== 'all') list = list.filter((o) => o.tradition === tradition);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (o) => o.title.toLowerCase().includes(q) || o.script?.toLowerCase().includes(q),
      );
    }
    return list;
  }, [options, browseAll, featuredIds, tradition, search]);

  const recents = useMemo(
    () => resolveRecentSelections(activeProfile, category, 5),
    [activeProfile, category],
  );

  function chooseOption(option: PracticeOption) {
    setSelection({
      category,
      optionId: option.id,
      displayText: option.title,
      displayScript: option.script,
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
    setSelection({ category, displayText: text });
  }

  function begin() {
    if (!selection) return;
    dispatch({ type: 'SET_ACTIVE_PRACTICE', selection, mode });
    const key = practiceKey(selection);
    dispatch({ type: 'SET_TARGET', key, target });
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
          Search
        </label>
        <input
          id="practice-search"
          type="search"
          placeholder="Search"
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
            {browseAll ? 'Show Suggested' : 'Browse All'}
          </button>
        )}
      </div>

      {showTraditionFilter && (
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by tradition">
          <FilterChip
            label="All"
            selected={tradition === 'all'}
            onClick={() => setTradition('all')}
          />
          {traditions.map((t) => (
            <FilterChip
              key={t}
              label={TRADITION_LABELS[t] ?? t}
              selected={tradition === t}
              onClick={() => setTradition(t)}
            />
          ))}
        </div>
      )}

      {recents.length > 0 && (
        <div>
          <h2 className="mb-2 text-sm font-semibold text-[color:var(--fg-muted)]">Recently used</h2>
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
              <span className="font-medium">{option.title}</span>
              {option.script && (
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
          Use This Text
        </button>
      </div>

      {selection && (
        <div className="card-surface sticky bottom-4 flex flex-col gap-4 rounded-2xl p-5">
          <div>
            <p className="text-sm text-[color:var(--fg-muted)]">Selected</p>
            <p className="font-display text-lg font-semibold">{selection.displayText}</p>
          </div>
          <TargetPicker value={target} onChange={setTarget} />
          <fieldset>
            <legend className="mb-2 text-sm font-medium text-[color:var(--fg-muted)]">
              How will you count?
            </legend>
            <div className="flex gap-2">
              <ModeButton
                label="Tap Mode"
                selected={mode === 'tap'}
                onClick={() => setMode('tap')}
              />
              <ModeButton
                label="Voice Mode (Beta)"
                selected={mode === 'voice'}
                onClick={() => setMode('voice')}
              />
            </div>
          </fieldset>
          <button
            type="button"
            onClick={begin}
            className="min-h-12 rounded-full bg-[color:var(--accent)] px-6 py-3 text-base font-semibold text-[color:var(--accent-contrast)]"
          >
            Begin Practice
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
