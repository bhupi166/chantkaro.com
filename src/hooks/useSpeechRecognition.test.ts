import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import { useSpeechRecognition } from './useSpeechRecognition';

class FakeSpeechRecognition implements SpeechRecognitionLike {
  continuous = false;
  interimResults = false;
  lang = '';
  onresult: ((event: SpeechRecognitionEventLike) => void) | null = null;
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null = null;
  onend: (() => void) | null = null;
  onstart: (() => void) | null = null;
  started = false;
  stopped = false;

  static instances: FakeSpeechRecognition[] = [];

  constructor() {
    FakeSpeechRecognition.instances.push(this);
  }

  start() {
    this.started = true;
  }
  stop() {
    this.stopped = true;
  }
  abort() {
    this.stopped = true;
  }
  addEventListener() {}
  removeEventListener() {}
  dispatchEvent(): boolean {
    return true;
  }

  emitFinalResult(index: number, transcript: string) {
    this.onresult?.({
      resultIndex: index,
      results: {
        length: index + 1,
        [index]: { isFinal: true, 0: { transcript }, length: 1 },
      },
    } as unknown as SpeechRecognitionEventLike);
  }
}

function mockGetUserMedia(shouldSucceed: boolean) {
  Object.defineProperty(navigator, 'mediaDevices', {
    configurable: true,
    value: {
      getUserMedia: vi.fn(async () => {
        if (!shouldSucceed) throw new Error('denied');
        return { getTracks: () => [] } as unknown as MediaStream;
      }),
    },
  });
}

beforeEach(() => {
  FakeSpeechRecognition.instances = [];
  (window as unknown as { SpeechRecognition?: unknown }).SpeechRecognition = FakeSpeechRecognition;
  mockGetUserMedia(true);
});

afterEach(() => {
  delete (window as unknown as { SpeechRecognition?: unknown }).SpeechRecognition;
});

describe('useSpeechRecognition', () => {
  it('counts a final result exactly once even if the browser re-delivers the same index', async () => {
    const onMatches = vi.fn();
    const { result } = renderHook(() =>
      useSpeechRecognition({ phrase: 'Om Namah Shivaya', onMatches }),
    );

    await act(async () => {
      await result.current.start();
    });

    const rec = FakeSpeechRecognition.instances[0];
    act(() => rec.emitFinalResult(0, 'Om Namah Shivaya'));
    act(() => rec.emitFinalResult(0, 'Om Namah Shivaya')); // duplicate delivery of the same index

    expect(onMatches).toHaveBeenCalledTimes(1);
    expect(onMatches).toHaveBeenCalledWith(1);
  });

  it('counts a new final result at the next index normally', async () => {
    const onMatches = vi.fn();
    const { result } = renderHook(() =>
      useSpeechRecognition({ phrase: 'Om Namah Shivaya', onMatches }),
    );

    await act(async () => {
      await result.current.start();
    });
    const rec = FakeSpeechRecognition.instances[0];
    act(() => rec.emitFinalResult(0, 'Om Namah Shivaya'));
    act(() => rec.emitFinalResult(1, 'Om Namah Shivaya'));

    expect(onMatches).toHaveBeenCalledTimes(2);
  });

  it('stops the underlying recognizer when stop() is called', async () => {
    const { result } = renderHook(() =>
      useSpeechRecognition({ phrase: 'peace', onMatches: vi.fn() }),
    );
    await act(async () => {
      await result.current.start();
    });
    const rec = FakeSpeechRecognition.instances[0];
    expect(rec.started).toBe(true);

    act(() => result.current.stop());
    expect(rec.stopped).toBe(true);
  });

  it('reports denied status when microphone permission is refused', async () => {
    mockGetUserMedia(false);
    const { result } = renderHook(() =>
      useSpeechRecognition({ phrase: 'peace', onMatches: vi.fn() }),
    );
    await act(async () => {
      await result.current.start();
    });
    await waitFor(() => expect(result.current.status).toBe('denied'));
  });

  it('never writes the spoken transcript to localStorage', async () => {
    window.localStorage.clear();
    const secretPhrase = 'MyPrivateFamilyPrayerXYZ123';
    const { result } = renderHook(() =>
      useSpeechRecognition({ phrase: secretPhrase, onMatches: vi.fn() }),
    );

    await act(async () => {
      await result.current.start();
    });
    const rec = FakeSpeechRecognition.instances[0];
    act(() => rec.emitFinalResult(0, secretPhrase));

    await waitFor(() => expect(result.current.transcript).toBeDefined());

    for (let i = 0; i < window.localStorage.length; i++) {
      const key = window.localStorage.key(i)!;
      expect(window.localStorage.getItem(key)).not.toContain(secretPhrase);
    }

    // And it is discarded from in-memory state on stop().
    act(() => result.current.stop());
    expect(result.current.transcript).toBe('');
  });
});
