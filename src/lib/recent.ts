import { CHANTS } from '@/data/chants';
import { AFFIRMATIONS } from '@/data/affirmations';
import { CHILDREN_AFFIRMATIONS } from '@/data/childrenAffirmations';
import { PARENTS_AFFIRMATIONS } from '@/data/parentsAffirmations';
import { PROFESSIONAL_AFFIRMATIONS } from '@/data/professionalAffirmations';
import { localizedOptionTitle } from './practiceLocalization';
import type { PracticeCategory, PracticeOption, PracticeSelection, ProfileData } from './types';

export interface RecentEntry {
  selection: PracticeSelection;
  label: string;
  script?: string;
}

export function resolveRecentSelections(
  profile: ProfileData,
  category: PracticeCategory,
  language: string,
  limit = 5,
): RecentEntry[] {
  const prefix = `${category}:`;
  // Suggested options can come from any of the affirmation catalogs (the
  // general list, or the children/parents/professional pages), all of
  // which share the same "affirmation" category and recent-key namespace.
  const catalog: PracticeOption[] =
    category === 'chant'
      ? CHANTS
      : [
          ...AFFIRMATIONS,
          ...CHILDREN_AFFIRMATIONS,
          ...PARENTS_AFFIRMATIONS,
          ...Object.values(PROFESSIONAL_AFFIRMATIONS).flat(),
        ];
  const customList = category === 'chant' ? profile.customChants : profile.customAffirmations;

  const entries: RecentEntry[] = [];
  for (const key of profile.recentPracticeKeys) {
    if (!key.startsWith(prefix)) continue;
    const rest = key.slice(prefix.length);
    const option = catalog.find((o) => o.id === rest);
    if (option) {
      const label = localizedOptionTitle(option, language);
      entries.push({
        selection: {
          category,
          optionId: option.id,
          displayText: label,
          displayScript: option.script,
        },
        label,
        script: option.script,
      });
      continue;
    }
    const custom = customList.find((c) => c.id === rest);
    if (custom) {
      entries.push({
        selection: { category, customId: custom.id, displayText: custom.text },
        label: custom.text,
      });
      continue;
    }
    entries.push({ selection: { category, displayText: rest }, label: rest });
  }
  return entries.slice(0, limit);
}
