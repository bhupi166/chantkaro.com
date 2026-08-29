import { useTranslation } from 'react-i18next';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';

export function OfflineIndicator() {
  const { t } = useTranslation();
  const online = useOnlineStatus();
  if (online) return null;
  return (
    <div
      role="status"
      className="w-full bg-[color:var(--color-gold-300)] px-4 py-1.5 text-center text-xs font-medium text-[color:var(--color-ink-900)]"
    >
      {t('offline.banner')}
    </div>
  );
}
