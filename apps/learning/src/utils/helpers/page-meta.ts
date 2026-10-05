import { type PlanDto, type PublishedCourseResponse } from '@repo/shared/contracts';
import { type IPageMeta } from '@interfaces';
import { COMPANY } from '@utils/constants';
import { type GetServerSideProps } from 'next';
import { getCoursePath } from './course-path';
import { fetchPublicApi } from './server-api';

const DEFAULT_TITLE = 'Acadimic | Learn, Grow, Succeed';
const DEFAULT_DESCRIPTION =
  'Courses, study material, test papers and live sessions for every standard and subject. Learn at your own pace on Acadimic.';
/** Kept under what WhatsApp, Slack and LinkedIn show before they cut a description short. */
const MAX_DESCRIPTION = 200;

export const getAbsoluteUrl = (path: string) => `${COMPANY.appUrl.replace(/\/$/, '')}${path}`;

export const DEFAULT_PAGE_META: IPageMeta = {
  title: DEFAULT_TITLE,
  description: DEFAULT_DESCRIPTION,
  image: getAbsoluteUrl('/images/og-image.png'),
  url: null,
  jsonLd: null,
};

const NOT_FOUND_PAGE_META: IPageMeta = { ...DEFAULT_PAGE_META, title: 'Course not found | Acadimic' };

/** Shared by every visitor, so a CDN may hold it briefly; well inside the cover URL's 48 hours. */
const CACHE_CONTROL = 'public, s-maxage=300, stale-while-revalidate=3600';

/** One line, as a preview shows it: a course description is written in paragraphs. */
const toSummary = (text: string) => {
  const line = text.replace(/\s+/g, ' ').trim();
  return line.length > MAX_DESCRIPTION ? `${line.slice(0, MAX_DESCRIPTION - 1).trimEnd()}…` : line;
};

/** `PT16H35M`: schema.org states a course's length as an ISO 8601 duration. */
const toDuration = (mins: number) => `PT${Math.floor(mins / 60)}H${mins % 60}M`;

/**
 * A schema.org `Course`, which makes the page eligible for Google's course results. `<` is escaped
 * because the JSON sits inside a `<script>` element.
 */
const getCourseJsonLd = ({ course }: PublishedCourseResponse, url: string, image: string, plans: PlanDto[]) => {
  const stats = course.stats;
  const mins = stats ? stats.testsDurationMins + stats.materialsDurationMins + stats.meetsDurationMins : 0;
  const offers = (plans.length ? plans : [{ amount: 0, currency: 'INR' }]).map((plan) => ({
    '@type': 'Offer',
    category: plan.amount > 0 ? 'Paid' : 'Free',
    price: plan.amount,
    priceCurrency: plan.currency ?? 'INR',
  }));
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Course',
    name: course.name,
    description: toSummary(course.description || DEFAULT_DESCRIPTION),
    url,
    image,
    provider: { '@type': 'Organization', name: 'Acadimic', sameAs: COMPANY.appUrl },
    offers,
    hasCourseInstance: [
      { '@type': 'CourseInstance', courseMode: 'Online', ...(mins ? { courseWorkload: toDuration(mins) } : {}) },
    ],
  };
  return JSON.stringify(jsonLd).replace(/</g, '\\u003c');
};

/** A published course's preview, its structured data and its own address. */
const getCoursePageMeta = async (published: PublishedCourseResponse): Promise<IPageMeta> => {
  const { course, presignedUrls } = published;
  const cover = (course.attachments ?? [])[0]?.url ?? '';
  const signed = presignedUrls.find((presigned) => presigned.key === cover)?.url ?? cover;
  const image = /^https?:\/\//.test(signed) ? signed : DEFAULT_PAGE_META.image;
  const url = getAbsoluteUrl(getCoursePath(course));
  const plans = await fetchPublicApi<PlanDto[]>(`course/published/plans/${course._id}`);
  return {
    title: `${course.name} — Online course | Acadimic`,
    description: toSummary(course.description || DEFAULT_DESCRIPTION),
    image,
    url,
    jsonLd: getCourseJsonLd(published, url, image, plans.status === 'ok' ? plans.data : []),
  };
};

/** In-app navigation asks for a page's props too; no crawler reads them, so the API is skipped. */
const isClientNavigation = (url: string | undefined) => !!url?.startsWith('/_next/data/');

/**
 * `/courses/<slug>`. Crawlers run no JavaScript, so the course's name, description, cover and
 * structured data reach them only through this; the page itself loads its data in the browser. An
 * unknown slug answers 404, so a search engine drops it rather than keeping an empty page.
 */
export const getCourseSlugPageProps: GetServerSideProps<{ meta: IPageMeta }> = async ({ params, req, res }) => {
  const slug = typeof params?.course === 'string' ? params.course : '';
  if (isClientNavigation(req.url)) return { props: { meta: DEFAULT_PAGE_META } };
  const published = await fetchPublicApi<PublishedCourseResponse>(`course/published/slug/${encodeURIComponent(slug)}`);
  res.setHeader('Cache-Control', CACHE_CONTROL);
  if (published.status === 'not-found') {
    res.statusCode = 404;
    return { props: { meta: NOT_FOUND_PAGE_META } };
  }
  if (published.status === 'failed') return { props: { meta: DEFAULT_PAGE_META } };
  return { props: { meta: await getCoursePageMeta(published.data) } };
};

/**
 * `/courses/<id>/preview`, kept beside the slug address. Its canonical link names the slug address,
 * so a search engine counts the two as one page and ranks that one.
 */
export const getCourseIdPageProps: GetServerSideProps<{ meta: IPageMeta }> = async ({ params, req, res }) => {
  const courseId = typeof params?.course === 'string' ? params.course : '';
  if (isClientNavigation(req.url)) return { props: { meta: DEFAULT_PAGE_META } };
  const published = await fetchPublicApi<PublishedCourseResponse>(`course/published/${encodeURIComponent(courseId)}`);
  if (published.status !== 'ok') return { props: { meta: DEFAULT_PAGE_META } };
  res.setHeader('Cache-Control', CACHE_CONTROL);
  return { props: { meta: await getCoursePageMeta(published.data) } };
};
