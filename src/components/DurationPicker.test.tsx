import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DurationPicker, MAX_DURATION_SECONDS, MIN_DURATION_SECONDS } from './DurationPicker';

describe('DurationPicker', () => {
  it('selects a preset duration in seconds', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<DurationPicker value={null} onChange={onChange} />);

    await user.click(screen.getByRole('button', { name: '5 minutes' }));
    expect(onChange).toHaveBeenCalledWith(300);
  });

  it('marks the matching preset as selected', () => {
    render(<DurationPicker value={120} onChange={vi.fn()} />);
    expect(screen.getByRole('button', { name: '2 minutes' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(screen.getByRole('button', { name: '1 minute' })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
  });

  it('accepts a valid custom minutes+seconds duration', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<DurationPicker value={null} onChange={onChange} />);

    await user.click(screen.getByRole('button', { name: 'Custom' }));
    await user.type(screen.getByLabelText('Minutes'), '3');
    await user.type(screen.getByLabelText('Seconds'), '30');

    expect(onChange).toHaveBeenLastCalledWith(210);
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('rejects a custom duration below the 1-minute minimum', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<DurationPicker value={null} onChange={onChange} />);

    await user.click(screen.getByRole('button', { name: 'Custom' }));
    await user.type(screen.getByLabelText('Seconds'), '30');

    expect(screen.getByRole('alert')).toHaveTextContent('Minimum duration is 1 minute.');
    expect(onChange).toHaveBeenLastCalledWith(null);
  });

  it('rejects a custom duration above the 30-minute maximum', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<DurationPicker value={null} onChange={onChange} />);

    await user.click(screen.getByRole('button', { name: 'Custom' }));
    await user.type(screen.getByLabelText('Minutes'), '31');

    expect(screen.getByRole('alert')).toHaveTextContent('Maximum duration is 30 minutes.');
    expect(onChange).toHaveBeenLastCalledWith(null);
  });

  it('rejects seconds above 59 as invalid', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<DurationPicker value={null} onChange={onChange} />);

    await user.click(screen.getByRole('button', { name: 'Custom' }));
    await user.type(screen.getByLabelText('Minutes'), '2');
    await user.type(screen.getByLabelText('Seconds'), '75');

    expect(screen.getByRole('alert')).toHaveTextContent('Please enter a valid duration.');
    expect(onChange).toHaveBeenLastCalledWith(null);
  });

  it('exposes the documented min/max bounds', () => {
    expect(MIN_DURATION_SECONDS).toBe(60);
    expect(MAX_DURATION_SECONDS).toBe(1800);
  });
});
