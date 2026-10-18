import { type PublishedCoursesResponse } from '@repo/shared/contracts';
import { type GetServerSideProps } from 'next';
import { getCoursePath } from './course-path';
import { getAbsoluteUrl } from './page-meta';
import { fetchPublicApi } from './server-api';

/** The pages anyone may open, beside the courses. Signed-in and transactional pages stay out. */
const PUBLIC_PATHS = ['/', '/courses', '/about', '/contact', '/help', '/terms', '/privacy', '/cookies'];

/** Kept from search: what needs a session, a print layout, or belongs to one order. */
const DISALLOWED_PATHS = [
  '/courses/*/modules',
  '/courses/*/print',
  '/account-settings',
  '/activity',
  '/sessions',
  '/order/',
  '/sign-in',
  '/sign-up',
];

/**
 * AI crawlers, refused the whole site: those that gather training data, and those that fetch a page
 * for an assistant's answer. Search engines keep the rules above, so ranking is unaffected. This
 * binds only crawlers that honour robots.txt; the server's rate limits are what stop the rest.
 */
const AI_CRAWLERS = [
  'GPTBot',
  'ChatGPT-User',
  'OAI-SearchBot',
  'ClaudeBot',
  'Claude-User',
  'Claude-SearchBot',
  'Claude-Web',
  'anthropic-ai',
  'Google-Extended',
  'GoogleOther',
  'Applebot-Extended',
  'CCBot',
  'PerplexityBot',
  'Perplexity-User',
  'Bytespider',
  'meta-externalagent',
  'meta-externalfetcher',
  'FacebookBot',
  'Amazonbot',
  'cohere-ai',
  'cohere-training-data-crawler',
  'MistralAI-User',
  'DuckAssistBot',
  'AI2Bot',
  'Ai2Bot-Dolma',
  'Diffbot',
  'ImagesiftBot',
  'Omgilibot',
  'Omgili',
  'YouBot',
  'Timpibot',
  'PanguBot',
  'Kangaroo Bot',
  'Webzio-Extended',
  'img2dataset',
];

/** An hour at the CDN: a new or renamed course reaches the sitemap within that. */
const CACHE_CONTROL = 'public, s-maxage=3600, stale-while-revalidate=86400';

const escapeXml = (value: string) =>
  value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const toUrlEntry = (path: string, lastModified: string | undefined) =>
  `  <url><loc>${escapeXml(getAbsoluteUrl(path))}</loc>${lastModified ? `<lastmod>${lastModified}</lastmod>` : ''}</url>`;

/** `/sitemap.xml`: the public pages and every published course at its slug address. */
export const getSitemapProps: GetServerSideProps = async ({ res }) => {
  const published = await fetchPublicApi<PublishedCoursesResponse>('course/published');
  const courses = published.status === 'ok' ? published.data.courses : [];
  const entries = [
    ...PUBLIC_PATHS.map((path) => toUrlEntry(path, undefined)),
    ...courses.filter((course) => course.slug).map((course) => toUrlEntry(getCoursePath(course), course.updatedAt)),
  ];
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries.join('\n')}\n</urlset>\n`;
  res.setHeader('Content-Type', 'application/xml; charset=utf-8');
  // A failed read must not be cached as a sitemap with no courses in it.
  res.setHeader('Cache-Control', published.status === 'ok' ? CACHE_CONTROL : 'no-store');
  res.end(xml);
  return { props: {} };
};

/** `/robots.txt`, a route rather than a file so the sitemap address follows `NEXT_PUBLIC_APP_URL`. */
export const getRobotsProps: GetServerSideProps = async ({ res }) => {
  const lines = [
    ...AI_CRAWLERS.map((agent) => `User-agent: ${agent}`),
    'Disallow: /',
    '',
    'User-agent: *',
    'Allow: /',
    ...DISALLOWED_PATHS.map((path) => `Disallow: ${path}`),
    '',
  ];
  lines.push(`Sitemap: ${getAbsoluteUrl('/sitemap.xml')}`, '');
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.setHeader('Cache-Control', CACHE_CONTROL);
  res.end(lines.join('\n'));
  return { props: {} };
};
