import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        // The app itself and tokenized share links are not for crawlers; the
        // share page additionally carries per-page noindex.
        disallow: [
          '/dashboard',
          '/settings',
          '/recordings',
          '/marketplace',
          '/mobile',
          '/share',
          '/api',
        ],
      },
    ],
  };
}
