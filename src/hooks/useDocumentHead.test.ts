import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useDocumentHead } from './useDocumentHead';

function addMeta(attr: 'name' | 'property', key: string, content: string) {
  const meta = document.createElement('meta');
  meta.setAttribute(attr, key);
  meta.setAttribute('content', content);
  document.head.appendChild(meta);
}

beforeEach(() => {
  document.title = 'Original Title';
  addMeta('name', 'description', 'original description');
  addMeta('property', 'og:title', 'original og title');
  addMeta('property', 'og:description', 'original og description');
  addMeta('property', 'og:url', 'https://chantkaro.com/');
  addMeta('name', 'twitter:title', 'original twitter title');
  addMeta('name', 'twitter:description', 'original twitter description');
  const canonical = document.createElement('link');
  canonical.setAttribute('rel', 'canonical');
  canonical.setAttribute('href', 'https://chantkaro.com/');
  document.head.appendChild(canonical);
});

afterEach(() => {
  document.head.innerHTML = '';
});

describe('useDocumentHead', () => {
  it('updates the existing title, meta and canonical tags', () => {
    renderHook(() =>
      useDocumentHead({ title: 'Page Title', description: 'Page description', path: '/chant' }),
    );

    expect(document.title).toBe('Page Title');
    expect(document.head.querySelector('meta[name="description"]')?.getAttribute('content')).toBe(
      'Page description',
    );
    expect(document.head.querySelector('meta[property="og:title"]')?.getAttribute('content')).toBe(
      'Page Title',
    );
    expect(
      document.head.querySelector('meta[property="og:url"]')?.getAttribute('content'),
    ).toBe('https://chantkaro.com/chant');
    expect(document.head.querySelector('link[rel="canonical"]')?.getAttribute('href')).toBe(
      'https://chantkaro.com/chant',
    );
  });

  it('does not inject a robots meta tag when noindex is not set', () => {
    renderHook(() => useDocumentHead({ title: 'Page', description: 'Desc', path: '/chant' }));
    expect(document.head.querySelector('meta[name="robots"]')).toBeNull();
  });

  it('adds a noindex robots meta tag when noindex is true', () => {
    renderHook(() =>
      useDocumentHead({ title: 'Stats', description: 'Desc', path: '/stats', noindex: true }),
    );
    expect(document.head.querySelector('meta[name="robots"]')?.getAttribute('content')).toBe(
      'noindex, follow',
    );
  });

  it('removes a previously-added robots meta tag when noindex turns false', () => {
    const { rerender } = renderHook(
      ({ noindex }) => useDocumentHead({ title: 'Page', description: 'Desc', path: '/x', noindex }),
      { initialProps: { noindex: true } },
    );
    expect(document.head.querySelector('meta[name="robots"]')).not.toBeNull();

    rerender({ noindex: false });
    expect(document.head.querySelector('meta[name="robots"]')).toBeNull();
  });

  it('does nothing when passed null', () => {
    renderHook(() => useDocumentHead(null));
    expect(document.title).toBe('Original Title');
    expect(document.head.querySelector('meta[name="description"]')?.getAttribute('content')).toBe(
      'original description',
    );
  });
});
