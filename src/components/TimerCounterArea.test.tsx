import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { TimerCounterArea } from './TimerCounterArea';
import * as sound from '@/lib/sound';
import * as vibrationLib from '@/lib/vibration';

vi.mock('@/lib/sound', () => ({ playCompletionSound: vi.fn(), playTapSound: vi.fn() }));
vi.mock('@/lib/vibration', () => ({ vibrate: vi.fn(), supportsVibration: vi.fn(() => true) }));

function baseProps(overrides: Partial<Parameters<typeof TimerCounterArea>[0]> = {}) {
  return {
    durationSeconds: 10,
    completionSoundEnabled: true,
    vibrationEnabled: true,
    onExitHome: vi.fn(),
    ...overrides,
  };
}

async function advance(ms: number) {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(ms);
  });
}

/**
 * The ready countdown is a chain of five sequential setTimeout(1000ms)
 * calls, each only scheduled after the previous one's callback commits a
 * React state update — advancing by one large 5000ms jump doesn't reliably
 * interleave with each of those re-renders, so step through it a second
 * at a time instead.
 */
async function clearReadyCountdown() {
  for (let i = 0; i < 5; i++) await advance(1000);
}

/**
 * fireEvent.click() is synchronous, unlike userEvent — which internally
 * schedules its own delays and reliably deadlocks against vi.useFakeTimers()
 * in this combination. Wrapped in act() so React flushes the resulting
 * state update before the next assertion.
 */
function click(element: HTMLElement) {
  act(() => {
    fireEvent.click(element);
  });
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.clearAllMocks();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('TimerCounterArea — ready countdown', () => {
  it('shows "Get Ready" and counts 5 down to 1 before starting, without consuming the practice duration', async () => {
    render(<TimerCounterArea {...baseProps({ durationSeconds: 10 })} />);
    expect(screen.getByText('Get Ready')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();

    await advance(1000);
    expect(screen.getByText('4')).toBeInTheDocument();

    // The remaining 4 ready-countdown beats (4,3,2,1) plus the final second before start.
    for (let i = 0; i < 4; i++) await advance(1000);

    expect(screen.queryByText('Get Ready')).not.toBeInTheDocument();
    expect(screen.getByRole('timer')).toHaveTextContent('00:10'); // full duration, untouched
  });
});

describe('TimerCounterArea — running timer', () => {
  async function startRunning(props = baseProps()) {
    const utils = render(<TimerCounterArea {...props} />);
    await clearReadyCountdown();
    return utils;
  }

  it('counts down every second in mm:ss format', async () => {
    await startRunning(baseProps({ durationSeconds: 65 }));
    expect(screen.getByRole('timer')).toHaveTextContent('01:05');

    await advance(2000);
    expect(screen.getByRole('timer')).toHaveTextContent('01:03');
  });

  it('freezes on Pause and resumes from the exact remaining time', async () => {
    await startRunning(baseProps({ durationSeconds: 10 }));

    await advance(3000);
    expect(screen.getByRole('timer')).toHaveTextContent('00:07');

    click(screen.getByRole('button', { name: 'Pause' }));
    await advance(4000); // time passing while paused must not count down
    expect(screen.getByRole('timer')).toHaveTextContent('00:07');

    click(screen.getByRole('button', { name: 'Resume' }));
    await advance(2000);
    expect(screen.getByRole('timer')).toHaveTextContent('00:05');
  });

  it('asks for confirmation before Stop ends the session', async () => {
    const onExitHome = vi.fn();
    await startRunning(baseProps({ onExitHome }));

    click(screen.getByRole('button', { name: 'Stop' }));
    expect(screen.getByRole('alertdialog')).toBeInTheDocument();
    expect(onExitHome).not.toHaveBeenCalled();

    click(screen.getByRole('button', { name: 'Stop Practice' }));
    expect(onExitHome).toHaveBeenCalledTimes(1);
  });

  it('canceling the stop confirmation leaves the session running', async () => {
    const onExitHome = vi.fn();
    await startRunning(baseProps({ onExitHome }));

    click(screen.getByRole('button', { name: 'Stop' }));
    click(screen.getByRole('button', { name: 'Cancel' }));

    expect(onExitHome).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Pause' })).toBeInTheDocument();
  });
});

describe('TimerCounterArea — completion', () => {
  async function completeSession(props = baseProps({ durationSeconds: 3 })) {
    const utils = render(<TimerCounterArea {...props} />);
    await clearReadyCountdown();
    await advance(3000); // full duration — a single running setInterval, safe to jump in one go
    return utils;
  }

  it('stops automatically, plays the completion sound once and vibrates once', async () => {
    await completeSession();
    expect(screen.getByText('Practice Completed')).toBeInTheDocument();
    expect(sound.playCompletionSound).toHaveBeenCalledTimes(1);
    expect(vibrationLib.vibrate).toHaveBeenCalledTimes(1);
  });

  it('does not play the completion sound when disabled', async () => {
    await completeSession(baseProps({ durationSeconds: 3, completionSoundEnabled: false }));
    expect(sound.playCompletionSound).not.toHaveBeenCalled();
  });

  it('does not vibrate when disabled', async () => {
    await completeSession(baseProps({ durationSeconds: 3, vibrationEnabled: false }));
    expect(vibrationLib.vibrate).not.toHaveBeenCalled();
  });

  it('never fires the completion sound more than once even as time keeps advancing', async () => {
    await completeSession();
    await advance(5000);
    expect(sound.playCompletionSound).toHaveBeenCalledTimes(1);
  });

  it('"Practice Again" restarts the same duration from a fresh ready countdown', async () => {
    await completeSession();

    click(screen.getByRole('button', { name: 'Practice Again' }));
    expect(screen.getByText('Get Ready')).toBeInTheDocument();

    await clearReadyCountdown();
    expect(screen.getByRole('timer')).toHaveTextContent('00:03');
  });

  it('"Return to Home" calls onExitHome', async () => {
    const onExitHome = vi.fn();
    await completeSession(baseProps({ durationSeconds: 3, onExitHome }));

    click(screen.getByRole('button', { name: 'Return to Home' }));
    expect(onExitHome).toHaveBeenCalledTimes(1);
  });

  it('"Select Another Duration" lets the user restart with a new duration', async () => {
    await completeSession();

    click(screen.getByRole('button', { name: 'Select Another Duration' }));
    click(screen.getByRole('button', { name: '1 minute' }));

    expect(screen.getByText('Get Ready')).toBeInTheDocument();
    await clearReadyCountdown();
    expect(screen.getByRole('timer')).toHaveTextContent('01:00');
  });
});
