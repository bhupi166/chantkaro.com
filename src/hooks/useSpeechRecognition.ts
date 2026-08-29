import { useCallback, useEffect, useRef, useState } from 'react';
import { countPhraseOccurrences } from '@/lib/speechMatch';

export type VoiceStatus = 'idle' | 'listening' | 'paused' | 'unsupported' | 'denied' | 'error';

interface UseSpeechRecognitionOptions {
  phrase: string;
  lang?: string;
  onMatches: (count: number) => void;
}

interface UseSpeechRecognitionResult {
  supported: boolean;
  status: VoiceStatus;
  transcript: string;
  errorMessage: string | null;
  start: () => Promise<void>;
  pause: () => void;
  resume: () => void;
  stop: () => void;
}

function getRecognitionCtor(): (new () => SpeechRecognitionLike) | undefined {
  if (typeof window === 'undefined') return undefined;
  return window.SpeechRecognition ?? window.webkitSpeechRecognition;
}

export function isVoiceModeSupported(): boolean {
  return !!getRecognitionCtor() && typeof navigator !== 'undefined' && !!navigator.mediaDevices;
}

/**
 * Wraps the browser's SpeechRecognition API to count repetitions of a
 * target phrase. Never persists the transcript anywhere — it lives only in
 * component state for the optional live-caption display and is discarded on
 * stop/unmount.
 */
export function useSpeechRecognition({
  phrase,
  lang = 'en-IN',
  onMatches,
}: UseSpeechRecognitionOptions): UseSpeechRecognitionResult {
  const [status, setStatus] = useState<VoiceStatus>(
    isVoiceModeSupported() ? 'idle' : 'unsupported',
  );
  const [transcript, setTranscript] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const lastProcessedIndexRef = useRef(-1);
  const pausedRef = useRef(false);
  const phraseRef = useRef(phrase);
  const onMatchesRef = useRef(onMatches);

  useEffect(() => {
    phraseRef.current = phrase;
    onMatchesRef.current = onMatches;
  }, [phrase, onMatches]);

  const teardown = useCallback(() => {
    const rec = recognitionRef.current;
    if (rec) {
      rec.onresult = null;
      rec.onerror = null;
      rec.onend = null;
      rec.onstart = null;
      try {
        rec.stop();
      } catch {
        /* already stopped */
      }
    }
    recognitionRef.current = null;
  }, []);

  const stop = useCallback(() => {
    teardown();
    lastProcessedIndexRef.current = -1;
    pausedRef.current = false;
    setTranscript('');
    setStatus(isVoiceModeSupported() ? 'idle' : 'unsupported');
  }, [teardown]);

  useEffect(() => stop, [stop]);

  const start = useCallback(async () => {
    const Ctor = getRecognitionCtor();
    if (!Ctor) {
      setStatus('unsupported');
      return;
    }
    try {
      // Requesting the mic stream first surfaces a permission prompt with a
      // predictable browser UI and lets us detect denial explicitly.
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((t) => t.stop());
    } catch {
      setStatus('denied');
      return;
    }

    const recognition = new Ctor();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = lang;
    lastProcessedIndexRef.current = -1;

    recognition.onresult = (event) => {
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const text = result[0]?.transcript ?? '';
        if (result.isFinal) {
          if (i > lastProcessedIndexRef.current) {
            lastProcessedIndexRef.current = i;
            const matches = countPhraseOccurrences(text, phraseRef.current);
            if (matches > 0) onMatchesRef.current(matches);
          }
        } else {
          interim += text;
        }
      }
      setTranscript(interim.slice(-160));
    };
    recognition.onerror = (event) => {
      if (event.error === 'not-allowed' || event.error === 'permission-denied') {
        setStatus('denied');
      } else if (event.error === 'no-speech' || event.error === 'aborted') {
        // Benign — recognition auto-restarts via onend when still active.
      } else {
        setErrorMessage(event.error);
        setStatus('error');
      }
    };
    recognition.onend = () => {
      // Browsers stop continuous recognition periodically; auto-restart
      // unless the user explicitly paused or stopped.
      if (recognitionRef.current === recognition && !pausedRef.current) {
        try {
          recognition.start();
        } catch {
          /* ignore transient restart races */
        }
      }
    };

    recognitionRef.current = recognition;
    pausedRef.current = false;
    setErrorMessage(null);
    setStatus('listening');
    recognition.start();
  }, [lang]);

  const pause = useCallback(() => {
    pausedRef.current = true;
    recognitionRef.current?.stop();
    setStatus('paused');
  }, []);

  const resume = useCallback(() => {
    pausedRef.current = false;
    try {
      recognitionRef.current?.start();
      setStatus('listening');
    } catch {
      void start();
    }
  }, [start]);

  return {
    supported: isVoiceModeSupported(),
    status,
    transcript,
    errorMessage,
    start,
    pause,
    resume,
    stop,
  };
}
