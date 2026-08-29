import { beforeEach, describe, expect, it } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { PracticePage } from './PracticePage';
import { AppDataProvider } from '@/state/AppDataContext';
import { createDefaultAppData } from '@/lib/storage';
import { STORAGE_KEY } from '@/lib/storage';
import { createEmptyStats, practiceKey } from '@/lib/practice';
import type { PracticeSelection } from '@/lib/types';

const SELECTION: PracticeSelection = {
  category: 'chant',
  optionId: 'sanatan-om-namah-shivaya',
  displayText: 'Om Namah Shivaya',
};

/**
 * Seeds a starting session count directly in the persisted profile rather
 * than via simulated clicks. jsdom cannot produce a real, browser-trusted
 * click (`isTrusted` is hardcoded false on every jsdom-dispatched event,
 * with no override available — see TapCounterArea.tsx `handleTapAreaClick`,
 * which deliberately ignores untrusted clicks so a script-dispatched click
 * can never count as a repetition). That means "does tapping increment the
 * count" can only be verified against a real browser — see
 * e2e/core-flow.spec.ts, which does exactly that. These jsdom tests instead
 * seed the precondition state directly and verify the surrounding logic
 * (undo, reset, persistence, control buttons) that doesn't depend on the
 * trust boundary.
 */
function seedActivePractice(sessionCount = 0) {
  const data = createDefaultAppData();
  const profile = data.profiles[0];
  profile.lastActivePractice = SELECTION;
  profile.lastMode = 'tap';
  profile.hasSeenContributionNotice = true;
  if (sessionCount > 0) {
    profile.stats[practiceKey(SELECTION)] = {
      ...createEmptyStats(),
      sessionCount,
      todayCount: sessionCount,
      lifetimeCount: sessionCount,
    };
  }
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
  it('ignores a simulated (untrusted) click — real tapping is covered by e2e/core-flow.spec.ts', async () => {
    seedActivePractice();
    const user = userEvent.setup();
    renderPractice();

    expect(getSessionCount()).toBe(0);
    await user.click(getTapButton());
    expect(getSessionCount()).toBe(0);
  });

  it('control buttons never increment the counter', async () => {
    seedActivePractice(1);
    const user = userEvent.setup();
    renderPractice();

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
    seedActivePractice(3);
    const user = userEvent.setup();
    renderPractice();

    expect(getSessionCount()).toBe(3);
    await user.click(screen.getByRole('button', { name: 'Undo' }));
    expect(getSessionCount()).toBe(2);
  });

  it('reset requires confirmation before clearing the session count', async () => {
    seedActivePractice(2);
    const user = userEvent.setup();
    renderPractice();

    expect(getSessionCount()).toBe(2);

    await user.click(screen.getByRole('button', { name: 'Reset' }));
    const dialog = screen.getByRole('alertdialog');
    expect(getSessionCount()).toBe(2); // unaffected while dialog is open

    await user.click(within(dialog).getByRole('button', { name: 'Reset Session' }));
    expect(getSessionCount()).toBe(0);
  });

  it('persists the session count across a full remount (simulated refresh)', () => {
    seedActivePractice(3);
    const { unmount } = renderPractice();
    expect(getSessionCount()).toBe(3);

    unmount();
    renderPractice();
    expect(getSessionCount()).toBe(3);
  });
});
