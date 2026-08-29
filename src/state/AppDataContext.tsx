import { createContext, useContext, useEffect, useMemo, useReducer, type ReactNode } from 'react';
import { loadAppData, saveAppData } from '@/lib/storage';
import type { AppData, ProfileData } from '@/lib/types';
import { appDataReducer, type AppDataAction } from './appDataReducer';

interface AppDataContextValue {
  data: AppData;
  activeProfile: ProfileData;
  dispatch: (action: AppDataAction) => void;
}

const AppDataContext = createContext<AppDataContextValue | null>(null);

export function AppDataProvider({ children }: { children: ReactNode }) {
  const [data, dispatch] = useReducer(appDataReducer, undefined, loadAppData);

  useEffect(() => {
    saveAppData(data);
  }, [data]);

  const activeProfile = useMemo(
    () => data.profiles.find((p) => p.id === data.activeProfileId) ?? data.profiles[0],
    [data],
  );

  const value = useMemo(() => ({ data, activeProfile, dispatch }), [data, activeProfile]);

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}

export function useAppData(): AppDataContextValue {
  const ctx = useContext(AppDataContext);
  if (!ctx) throw new Error('useAppData must be used within AppDataProvider');
  return ctx;
}
