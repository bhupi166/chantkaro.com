import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { TapCounterArea } from './TapCounterArea';
import { createEmptyStats } from '@/lib/practice';

function baseProps(overrides: Partial<Parameters<typeof TapCounterArea>[0]> = {}) {
  return {
    stats: { ...createEmptyStats(11), sessionCount: 10 },
    percent: 91,
    isComplete: false,
    soundEnabled: false,
    onTap: vi.fn(),
    onUndo: vi.fn(),
    onResetConfirmed: vi.fn(),
    ...overrides,
  };
}

describe('TapCounterArea — trusted-interaction guard', () => {
  it('ignores a synthetic (non-browser-trusted) click and never calls onTap', () => {
    const props = baseProps();
    render(<TapCounterArea {...props} />);

    const tapButton = screen.getByRole('button', { name: /tap to count/i });
    // jsdom's fireEvent/dispatchEvent always produces isTrusted:false —
    // exactly the class of event a script could dispatch on its own —
    // which handleTapAreaClick in TapCounterArea.tsx deliberately ignores.
    fireEvent.click(tapButton);

    expect(props.onTap).not.toHaveBeenCalled();
  });
});

describe('TapCounterArea — target completion celebration', () => {
  it('shows no celebration message before the target is reached', () => {
    render(<TapCounterArea {...baseProps({ isComplete: false })} />);
    expect(screen.queryByText(/you achieved your target today/i)).not.toBeInTheDocument();
  });

  it('shows the celebration message and confetti once the target is reached', () => {
    const props = baseProps({ isComplete: false });
    const { rerender } = render(<TapCounterArea {...props} />);

    rerender(
      <TapCounterArea
        {...props}
        stats={{ ...props.stats, sessionCount: 11 }}
        percent={100}
        isComplete
      />,
    );

    expect(screen.getByText(/you achieved your target today/i)).toBeInTheDocument();
    expect(document.querySelector('.pointer-events-none.fixed')).toBeInTheDocument();
  });

  it('lets the user dismiss the celebration message', async () => {
    const { default: userEvent } = await import('@testing-library/user-event');
    const props = baseProps({ isComplete: false });
    const user = userEvent.setup();
    const { rerender } = render(<TapCounterArea {...props} />);

    // Transition into completion, same as a real 10 -> 11 tap would.
    rerender(
      <TapCounterArea
        {...props}
        stats={{ ...props.stats, sessionCount: 11 }}
        percent={100}
        isComplete
      />,
    );

    expect(screen.getByText(/you achieved your target today/i)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Dismiss' }));
    expect(screen.queryByText(/you achieved your target today/i)).not.toBeInTheDocument();
  });
});
