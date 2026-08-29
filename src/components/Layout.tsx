import { NavLink } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Logo } from './Logo';
import { OfflineIndicator } from './OfflineIndicator';

export function Layout({ children }: { children: ReactNode }) {
  const { t } = useTranslation();

  const NAV_LINKS = [
    { to: '/', label: t('nav.home') },
    { to: '/stats', label: t('nav.progress') },
    { to: '/settings', label: t('nav.settings') },
    { to: '/about', label: t('nav.about') },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-[color:var(--bg)] text-[color:var(--fg)]">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-[color:var(--accent)] focus:px-4 focus:py-2 focus:text-white"
      >
        {t('a11y.skipToContent')}
      </a>
      <header className="border-b border-[color:var(--border)]">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-2 px-3 py-3 sm:gap-4 sm:px-4">
          <NavLink to="/" aria-label={t('a11y.homeLinkLabel')} className="shrink-0">
            <Logo withWordmark wordmarkClassName="hidden sm:inline" />
          </NavLink>
          <nav
            aria-label={t('a11y.primaryNavLabel')}
            className="flex items-center gap-0.5 overflow-x-auto sm:gap-1"
          >
            {NAV_LINKS.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.to === '/'}
                className={({ isActive }) =>
                  `min-h-11 rounded-full px-2 py-2 text-sm font-medium whitespace-nowrap sm:px-3 ${
                    isActive
                      ? 'bg-[color:var(--accent)] text-[color:var(--accent-contrast)]'
                      : 'text-[color:var(--fg-muted)] hover:bg-[color:var(--bg-elevated)]'
                  }`
                }
              >
                {link.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>
      <OfflineIndicator />
      <main id="main-content" className="mx-auto w-full max-w-5xl flex-1 px-4 py-6">
        {children}
      </main>
      <Footer />
    </div>
  );
}

function Footer() {
  const { t } = useTranslation();
  return (
    <footer className="border-t border-[color:var(--border)] py-8 text-sm text-[color:var(--fg-muted)]">
      <div className="mx-auto flex max-w-5xl flex-col gap-4 px-4 sm:flex-row sm:items-center sm:justify-between">
        <p>{t('common.brandTagline')}</p>
        <nav aria-label={t('a11y.footerNavLabel')} className="flex flex-wrap gap-x-4 gap-y-2">
          <NavLink to="/about" className="hover:underline">
            {t('footer.about')}
          </NavLink>
          <NavLink to="/benefits" className="hover:underline">
            {t('footer.benefits')}
          </NavLink>
          <NavLink to="/privacy" className="hover:underline">
            {t('footer.privacy')}
          </NavLink>
          <NavLink to="/terms" className="hover:underline">
            {t('footer.terms')}
          </NavLink>
          <NavLink to="/contact" className="hover:underline">
            {t('footer.contact')}
          </NavLink>
        </nav>
      </div>
      <p className="mx-auto mt-4 max-w-5xl px-4 text-xs">
        {t('footer.copyright', { year: new Date().getFullYear() })}
      </p>
    </footer>
  );
}
