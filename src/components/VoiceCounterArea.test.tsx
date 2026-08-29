import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { VoiceCounterArea } from './VoiceCounterArea';
import { createEmptyStats } from '@/lib/practice';

describe('VoiceCounterArea — unsupported browser fallback', () => {
  it('offers Tap Mode instead of Voice Mode when SpeechRecognition is unavailable', async () => {
    // jsdom does not implement SpeechRecognition, so isVoiceModeSupported() is false here.
    const onUseTapModeInstead = vi.fn();
    const user = userEvent.setup();

    render(
      <VoiceCounterArea
        phrase="Om Namah Shivaya"
        stats={createEmptyStats()}
        onMatches={vi.fn()}
        onUndo={vi.fn()}
        onUseTapModeInstead={onUseTapModeInstead}
      />,
    );

    expect(screen.getByText(/voice mode is not supported in this browser/i)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Use Tap Mode Instead' }));
    expect(onUseTapModeInstead).toHaveBeenCalledTimes(1);
  });
});
