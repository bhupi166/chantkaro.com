import '@testing-library/jest-dom/vitest';

// jsdom does not implement matchMedia; provide a stable no-op mock so
// components that check prefers-color-scheme / prefers-reduced-motion don't
// throw in tests.
if (!window.matchMedia) {
  window.matchMedia = ((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  })) as typeof window.matchMedia;
}
