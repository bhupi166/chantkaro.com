import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DailyThought } from './DailyThought';
import { DAILY_THOUGHTS, thoughtForToday } from '@/data/dailyThoughts';

afterEach(() => {
  vi.useRealTimers();
});

describe('DailyThought', () => {
  it("renders today's thought", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-01T12:00:00'));
    render(<DailyThought />);
    expect(screen.getByText(DAILY_THOUGHTS[0])).toBeInTheDocument();
  });

  it('renders a heading label', () => {
    render(<DailyThought />);
    expect(screen.getByText(thoughtForToday())).toBeInTheDocument();
  });
});
