import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { VoiceCounterArea } from './VoiceCounterArea';
import { createEmptyStats } from '@/lib/practice';
import i18n from '@/i18n';

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

class FakeSpeechRecognition implements SpeechRecognitionLike {
  continuous = false;
  interimResults = false;
  lang = '';
  onresult: ((event: SpeechRecognitionEventLike) => void) | null = null;
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null = null;
  onend: (() => void) | null = null;
  onstart: (() => void) | null = null;
  static instances: FakeSpeechRecognition[] = [];
  constructor() {
    FakeSpeechRecognition.instances.push(this);
  }
  start() {}
  stop() {}
  abort() {}
  addEventListener() {}
  removeEventListener() {}
  dispatchEvent(): boolean {
    return true;
  }
}

describe('VoiceCounterArea — voice recognition locale follows the UI language', () => {
  beforeEach(() => {
    FakeSpeechRecognition.instances = [];
    (window as unknown as { SpeechRecognition?: unknown }).SpeechRecognition =
      FakeSpeechRecognition;
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: {
        getUserMedia: vi.fn(async () => ({ getTracks: () => [] }) as unknown as MediaStream),
      },
    });
  });

  afterEach(async () => {
    delete (window as unknown as { SpeechRecognition?: unknown }).SpeechRecognition;
    await i18n.changeLanguage('en');
  });

  it('starts recognition with hi-IN when the interface language is Hindi', async () => {
    await i18n.changeLanguage('hi');
    const user = userEvent.setup();
    render(
      <VoiceCounterArea
        phrase="Om Namah Shivaya"
        stats={createEmptyStats()}
        onMatches={vi.fn()}
        onUndo={vi.fn()}
        onUseTapModeInstead={vi.fn()}
      />,
    );
    await act(async () => {
      await user.click(screen.getByRole('button', { name: 'Allow Microphone & Start' }));
    });
    expect(FakeSpeechRecognition.instances[0]?.lang).toBe('hi-IN');
  });

  it('starts recognition with en-IN by default', async () => {
    const user = userEvent.setup();
    render(
      <VoiceCounterArea
        phrase="Om Namah Shivaya"
        stats={createEmptyStats()}
        onMatches={vi.fn()}
        onUndo={vi.fn()}
        onUseTapModeInstead={vi.fn()}
      />,
    );
    await act(async () => {
      await user.click(screen.getByRole('button', { name: 'Allow Microphone & Start' }));
    });
    expect(FakeSpeechRecognition.instances[0]?.lang).toBe('en-IN');
  });
});
