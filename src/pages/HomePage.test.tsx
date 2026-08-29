import { describe, expect, it, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { HomePage } from './HomePage';
import { AppDataProvider } from '@/state/AppDataContext';
import i18n, { loadLanguage } from '@/i18n';

function renderHome() {
  return render(
    <AppDataProvider>
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    </AppDataProvider>,
  );
}

describe('HomePage — Trans-rendered privacy link', () => {
  afterEach(async () => {
    await i18n.changeLanguage('en');
  });

  it('renders the Privacy Policy link with visible, non-empty text in English', () => {
    renderHome();
    const link = screen.getByRole('link', { name: /privacy policy/i });
    expect(link).toHaveAttribute('href', '/privacy');
    expect(link.textContent?.trim()).not.toBe('');
  });

  it('renders the link with translated, non-empty text once switched to Hindi', async () => {
    await loadLanguage('hi');
    await i18n.changeLanguage('hi');
    renderHome();
    // Regression guard: a Trans-index mismatch (see git history) silently
    // dropped the <a> entirely, leaving only the surrounding plain text.
    const links = screen
      .getAllByRole('link')
      .filter((el) => el.getAttribute('href') === '/privacy');
    expect(links).toHaveLength(1);
    expect(links[0].textContent?.trim()).not.toBe('');
  });
});
