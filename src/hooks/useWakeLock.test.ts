import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useWakeLock } from './useWakeLock';

function mockWakeLock() {
  const release = vi.fn().mockResolvedValue(undefined);
  const sentinel = { release, addEventListener: vi.fn(), removeEventListener: vi.fn() };
  const request = vi.fn().mockResolvedValue(sentinel);
  Object.defineProperty(navigator, 'wakeLock', {
    configurable: true,
    value: { request },
  });
  return { request, release, sentinel };
}

afterEach(() => {
  vi.unstubAllGlobals();
  // @ts-expect-error -- cleaning up the test-only property between tests
  delete navigator.wakeLock;
});

describe('useWakeLock', () => {
  it('requests a screen wake lock when active and supported', async () => {
    const { request } = mockWakeLock();
    renderHook(() => useWakeLock(true));
    await vi.waitFor(() => expect(request).toHaveBeenCalledWith('screen'));
  });

  it('does not request a lock when inactive', () => {
    const { request } = mockWakeLock();
    renderHook(() => useWakeLock(false));
    expect(request).not.toHaveBeenCalled();
  });

  it('releases the lock on unmount', async () => {
    const { request, release } = mockWakeLock();
    const { unmount } = renderHook(() => useWakeLock(true));
    await vi.waitFor(() => expect(request).toHaveBeenCalled());

    unmount();
    await vi.waitFor(() => expect(release).toHaveBeenCalledTimes(1));
  });

  it('never throws when the Wake Lock API is unsupported', () => {
    // No navigator.wakeLock defined at all in this test.
    expect(() => renderHook(() => useWakeLock(true))).not.toThrow();
  });
});
