import { describe, expect, it } from 'vitest';
import { SUPPORTED_LANGUAGES, VOICE_RECOGNITION_LOCALE } from './index';

describe('VOICE_RECOGNITION_LOCALE', () => {
  it('maps every supported UI language to its Indian voice-recognition locale', () => {
    expect(VOICE_RECOGNITION_LOCALE.en).toBe('en-IN');
    expect(VOICE_RECOGNITION_LOCALE.hi).toBe('hi-IN');
    expect(VOICE_RECOGNITION_LOCALE.pa).toBe('pa-IN');
  });

  it('has an entry for every supported language, and only those', () => {
    expect(Object.keys(VOICE_RECOGNITION_LOCALE).sort()).toEqual([...SUPPORTED_LANGUAGES].sort());
  });
});
