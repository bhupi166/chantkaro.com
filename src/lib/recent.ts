import { CHANTS } from '@/data/chants';
import { AFFIRMATIONS } from '@/data/affirmations';
import type { PracticeCategory, PracticeSelection, ProfileData } from './types';

export interface RecentEntry {
  selection: PracticeSelection;
  label: string;
  script?: string;
}

export function resolveRecentSelections(
  profile: ProfileData,
  category: PracticeCategory,
  limit = 5,
): RecentEntry[] {
  const prefix = `${category}:`;
  const catalog = category === 'chant' ? CHANTS : AFFIRMATIONS;
  const customList = category === 'chant' ? profile.customChants : profile.customAffirmations;

  const entries: RecentEntry[] = [];
  for (const key of profile.recentPracticeKeys) {
    if (!key.startsWith(prefix)) continue;
    const rest = key.slice(prefix.length);
    const option = catalog.find((o) => o.id === rest);
    if (option) {
      entries.push({
        selection: {
          category,
          optionId: option.id,
          displayText: option.title,
          displayScript: option.script,
        },
        label: option.title,
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
