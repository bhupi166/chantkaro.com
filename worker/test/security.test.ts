import { describe, expect, it } from 'vitest';
import { evaluateBatch, type SessionRow, type SecurityConfig } from '../src/security';

const config: SecurityConfig = {
  maxTapRatePerSecond: 8,
  maxVoiceRatePerSecond: 2,
  sessionTtlSeconds: 21_600,
  challengeSuspicionThreshold: 5,
  abuseLockdown: false,
};

function freshSession(overrides: Partial<SessionRow> = {}): SessionRow {
  return {
    sessionId: 'sid-1',
    expiresAt: new Date(Date.now() + 3_600_000).toISOString(),
    deviceHash: 'device-hash',
    suspicionScore: 0,
    challengeRequired: false,
    lastBatchAt: null,
    lastIntervalMs: null,
    patternStreak: 0,
    ...overrides,
  };
}

describe('evaluateBatch', () => {
  it('accepts a plausible tap batch', () => {
    const result = evaluateBatch({
      mode: 'tap',
      amount: 100,
      elapsedMs: 60_000, // 100 taps over 60s ≈ 1.6/s, well under the 8/s ceiling
      now: new Date(),
      session: freshSession(),
      config,
    });
    expect(result.verdict).toEqual({ verdict: 'ok' });
  });

  it('rejects a tap batch that implies an impossible rate', () => {
    const result = evaluateBatch({
      mode: 'tap',
      amount: 500,
      elapsedMs: 1000, // 500/s, far above 8/s
      now: new Date(),
      session: freshSession(),
      config,
    });
    expect(result.verdict).toEqual({ verdict: 'reject', reason: 'speed' });
  });

  it('applies a stricter ceiling for voice mode than tap mode', () => {
    const input = { amount: 10, elapsedMs: 3000, now: new Date(), session: freshSession(), config }; // 3.3/s
    expect(evaluateBatch({ ...input, mode: 'tap' }).verdict).toEqual({ verdict: 'ok' });
    expect(evaluateBatch({ ...input, mode: 'voice' }).verdict).toEqual({ verdict: 'reject', reason: 'speed' });
  });

  it('never flags speed on a very small batch, regardless of implied rate', () => {
    const result = evaluateBatch({
      mode: 'tap',
      amount: 2,
      elapsedMs: 1,
      now: new Date(),
      session: freshSession(),
      config,
    });
    expect(result.verdict).toEqual({ verdict: 'ok' });
  });

  it('flags a robotic (identical) interval streak as a pattern violation', () => {
    const now = new Date('2026-01-01T00:01:00.000Z');
    const session = freshSession({
      lastBatchAt: '2026-01-01T00:00:30.000Z', // exactly 30s before "now"
      lastIntervalMs: 30_000, // the batch before that was also exactly 30s
      patternStreak: 2, // already two identical intervals in a row
    });
    const result = evaluateBatch({ mode: 'tap', amount: 1, elapsedMs: 30_000, now, session, config });
    expect(result.verdict).toEqual({ verdict: 'reject', reason: 'pattern' });
    expect(result.patternStreak).toBe(3);
  });

  it('does not flag a pattern when intervals vary naturally', () => {
    const now = new Date('2026-01-01T00:01:00.000Z');
    const session = freshSession({
      lastBatchAt: '2026-01-01T00:00:15.000Z', // 45s before "now" — very different from lastIntervalMs
      lastIntervalMs: 5_000,
      patternStreak: 2,
    });
    const result = evaluateBatch({ mode: 'tap', amount: 1, elapsedMs: 45_000, now, session, config });
    expect(result.verdict).toEqual({ verdict: 'ok' });
    expect(result.patternStreak).toBe(0);
  });

  it('escalates to a challenge once cumulative suspicion crosses the threshold', () => {
    const result = evaluateBatch({
      mode: 'tap',
      amount: 500,
      elapsedMs: 1000, // speed violation, +2 suspicion
      now: new Date(),
      session: freshSession({ suspicionScore: 4 }), // already at 4 -> 4+2=6 >= threshold(5)
      config,
    });
    expect(result.verdict).toEqual({ verdict: 'challenge' });
  });

  it('does not re-issue a challenge for a session that already has one pending', () => {
    const result = evaluateBatch({
      mode: 'tap',
      amount: 500,
      elapsedMs: 1000,
      now: new Date(),
      session: freshSession({ suspicionScore: 10, challengeRequired: true }),
      config,
    });
    // Already flagged — index.ts handles the challenge-required path
    // separately before ever calling evaluateBatch again for that session.
    expect(result.verdict).toEqual({ verdict: 'reject', reason: 'speed' });
  });
});
