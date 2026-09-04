import { useEffect } from 'react';

const SITE_URL = 'https://chantkaro.com';

export interface DocumentHeadOptions {
  title: string;
  description: string;
  /** Path only, e.g. "/chant" — combined with SITE_URL for canonical/og:url. */
  path: string;
  /** Session-dependent or personal pages (Practice, Stats, Settings) shouldn't be indexed. */
  noindex?: boolean;
}

function setMetaContent(selector: string, content: string) {
  // Only ever updates a tag that already exists in index.html — this never
  // injects an unrecognized meta tag into the document.
  document.head.querySelector<HTMLMetaElement>(selector)?.setAttribute('content', content);
}

/**
 * Chant Karo is a client-rendered SPA with a single static index.html, so
 * without this every route would report the same <title>/description to
 * search engines and link-preview bots. Called once per page component
 * with that page's own copy (see the `seo.*` keys in src/i18n/locales/).
 * Pass `null` (e.g. from a shared component whose parent page already
 * calls this itself) to skip entirely.
 */
export function useDocumentHead(options: DocumentHeadOptions | null) {
  const title = options?.title;
  const description = options?.description;
  const path = options?.path;
  const noindex = options?.noindex;

  useEffect(() => {
    if (title === undefined || description === undefined || path === undefined) return;
    document.title = title;
    setMetaContent('meta[name="description"]', description);
    setMetaContent('meta[property="og:title"]', title);
    setMetaContent('meta[property="og:description"]', description);
    setMetaContent('meta[property="og:url"]', `${SITE_URL}${path}`);
    setMetaContent('meta[name="twitter:title"]', title);
    setMetaContent('meta[name="twitter:description"]', description);

    document.head.querySelector('link[rel="canonical"]')?.setAttribute('href', `${SITE_URL}${path}`);

    let robotsMeta = document.head.querySelector<HTMLMetaElement>('meta[name="robots"]');
    if (noindex) {
      if (!robotsMeta) {
        robotsMeta = document.createElement('meta');
        robotsMeta.setAttribute('name', 'robots');
        document.head.appendChild(robotsMeta);
      }
      robotsMeta.setAttribute('content', 'noindex, follow');
    } else {
      robotsMeta?.remove();
    }
  }, [title, description, path, noindex]);
}
