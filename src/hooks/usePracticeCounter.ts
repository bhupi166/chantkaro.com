import { useCallback, useMemo } from 'react';
import { useAppData } from '@/state/AppDataContext';
import { globalTotalsClient } from '@/lib/globalTotalsClient';
import { vibrate } from '@/lib/vibration';
import {
  createEmptyStats,
  isTargetReached,
  practiceKey,
  progressPercent,
  rolledOverForToday,
} from '@/lib/practice';
import type { CountingMode, PracticeSelection, RepetitionTarget } from '@/lib/types';

export function usePracticeCounter(selection: PracticeSelection) {
  const { activeProfile, dispatch } = useAppData();
  const key = useMemo(() => practiceKey(selection), [selection]);
  const stats = useMemo(
    () => rolledOverForToday(activeProfile.stats[key] ?? createEmptyStats()),
    [activeProfile.stats, key],
  );

  const tap = useCallback((mode: CountingMode = 'tap') => {
    dispatch({ type: 'TAP', key, category: selection.category });
    // Anonymous contribution is fire-and-forget and independent of the
    // personal count above; it is never retracted by a later Undo, since a
    // sent increment cannot be traced back to this device.
    globalTotalsClient.record(selection.category, activeProfile.contributeToGlobalTotals, mode);
    if (activeProfile.vibrationEnabled) vibrate(12);
  }, [
    dispatch,
    key,
    selection.category,
    activeProfile.contributeToGlobalTotals,
    activeProfile.vibrationEnabled,
  ]);

  const undo = useCallback(() => {
    dispatch({ type: 'UNDO', key, category: selection.category });
  }, [dispatch, key, selection.category]);

  const resetSession = useCallback(() => {
    dispatch({ type: 'RESET_SESSION', key });
  }, [dispatch, key]);

  const setTarget = useCallback(
    (target: RepetitionTarget) => {
      dispatch({ type: 'SET_TARGET', key, target });
    },
    [dispatch, key],
  );

  return {
    key,
    stats,
    tap,
    undo,
    resetSession,
    setTarget,
    percent: progressPercent(stats),
    isComplete: isTargetReached(stats),
  };
}
