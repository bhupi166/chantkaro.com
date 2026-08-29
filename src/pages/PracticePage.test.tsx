import { beforeEach, describe, expect, it } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { PracticePage } from './PracticePage';
import { AppDataProvider } from '@/state/AppDataContext';
import { createDefaultAppData } from '@/lib/storage';
import { STORAGE_KEY } from '@/lib/storage';

function seedActivePractice() {
  const data = createDefaultAppData();
  const profile = data.profiles[0];
  profile.lastActivePractice = {
    category: 'chant',
    optionId: 'sanatan-om-namah-shivaya',
    displayText: 'Om Namah Shivaya',
  };
  profile.lastMode = 'tap';
  profile.hasSeenContributionNotice = true;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  return data;
}

function renderPractice() {
  return render(
    <AppDataProvider>
      <MemoryRouter initialEntries={['/practice']}>
        <PracticePage />
      </MemoryRouter>
    </AppDataProvider>,
  );
}

function getTapButton() {
  return screen.getByRole('button', { name: /tap to count/i });
}

function getSessionCount() {
  return Number(getTapButton().textContent?.match(/\d+/)?.[0] ?? 'NaN');
}

beforeEach(() => {
  window.localStorage.clear();
});

describe('PracticePage — Tap Mode counting', () => {
  it('a valid tap increases the count by exactly one', async () => {
    seedActivePractice();
    const user = userEvent.setup();
    renderPractice();

    expect(getSessionCount()).toBe(0);
    await user.click(getTapButton());
    expect(getSessionCount()).toBe(1);
  });

  it('rapid intentional taps remain accurate', async () => {
    seedActivePractice();
    const user = userEvent.setup();
    renderPractice();

    const button = getTapButton();
    for (let i = 0; i < 12; i++) {
      await user.click(button);
    }
    expect(getSessionCount()).toBe(12);
  });

  it('control buttons never increment the counter', async () => {
    seedActivePractice();
    const user = userEvent.setup();
    renderPractice();

    await user.click(getTapButton());
    expect(getSessionCount()).toBe(1);

    await user.click(screen.getByRole('button', { name: 'Pause' }));
    expect(getSessionCount()).toBe(1);
    await user.click(screen.getByRole('button', { name: 'Resume' }));
    expect(getSessionCount()).toBe(1);

    // Reset opens a confirmation dialog; clicking it should not itself count.
    await user.click(screen.getByRole('button', { name: 'Reset' }));
    expect(getSessionCount()).toBe(1);
    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(getSessionCount()).toBe(1);
  });

  it('undo removes exactly one repetition', async () => {
    seedActivePractice();
    const user = userEvent.setup();
    renderPractice();

    const button = getTapButton();
    await user.click(button);
    await user.click(button);
    await user.click(button);
    expect(getSessionCount()).toBe(3);

    await user.click(screen.getByRole('button', { name: 'Undo' }));
    expect(getSessionCount()).toBe(2);
  });

  it('reset requires confirmation before clearing the session count', async () => {
    seedActivePractice();
    const user = userEvent.setup();
    renderPractice();

    const button = getTapButton();
    await user.click(button);
    await user.click(button);
    expect(getSessionCount()).toBe(2);

    await user.click(screen.getByRole('button', { name: 'Reset' }));
    const dialog = screen.getByRole('alertdialog');
    expect(getSessionCount()).toBe(2); // unaffected while dialog is open

    await user.click(within(dialog).getByRole('button', { name: 'Reset Session' }));
    expect(getSessionCount()).toBe(0);
  });

  it('persists the session count across a full remount (simulated refresh)', async () => {
    seedActivePractice();
    const user = userEvent.setup();
    const { unmount } = renderPractice();

    const button = getTapButton();
    await user.click(button);
    await user.click(button);
    await user.click(button);
    expect(getSessionCount()).toBe(3);

    unmount();
    renderPractice();
    expect(getSessionCount()).toBe(3);
  });
});
