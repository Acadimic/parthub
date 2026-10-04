import { type PublishedCourseResponse } from '@repo/shared/contracts';
import { type SuccessResponse } from '@repo/shared/responses';
import { Subdomain } from '@enums';
import { type IPageMeta } from '@interfaces';
import { COMPANY } from '@utils/constants';
import { type GetServerSideProps } from 'next';

const DEFAULT_TITLE = 'Acadimic | Learn, Grow, Succeed';
const DEFAULT_DESCRIPTION =
  'Courses, study material, test papers and live sessions for every standard and subject. Learn at your own pace on Acadimic.';
/** Kept under what WhatsApp, Slack and LinkedIn show before they cut a description short. */
const MAX_DESCRIPTION = 200;
/** A slow API must not hold up the page: past this the preview falls back to the site default. */
const META_TIMEOUT_MS = 3000;

export const DEFAULT_PAGE_META: IPageMeta = {
  title: DEFAULT_TITLE,
  description: DEFAULT_DESCRIPTION,
  image: `${COMPANY.appUrl.replace(/\/$/, '')}/images/og-image.png`,
};

/** One line, as a preview shows it: a course description is written in paragraphs. */
const toSummary = (text: string) => {
  const line = text.replace(/\s+/g, ' ').trim();
  return line.length > MAX_DESCRIPTION ? `${line.slice(0, MAX_DESCRIPTION - 1).trimEnd()}…` : line;
};

const fetchPublishedCourse = async (courseId: string): Promise<PublishedCourseResponse | null> => {
  const apiUrl = process.env.API_SERVER_URL;
  if (!apiUrl || !courseId) return null;
  try {
    const response = await fetch(`${apiUrl.replace(/\/$/, '')}/course/published/${encodeURIComponent(courseId)}`, {
      headers: { app: Subdomain.LEARN },
      signal: AbortSignal.timeout(META_TIMEOUT_MS),
    });
    if (!response.ok) return null;
    const body = (await response.json()) as SuccessResponse<PublishedCourseResponse>;
    return body.data ?? null;
  } catch {
    return null;
  }
};

const getCoursePageMeta = async (courseId: string): Promise<IPageMeta> => {
  const fallback = DEFAULT_PAGE_META;
  const published = await fetchPublishedCourse(courseId);
  if (!published) return fallback;
  const { course, presignedUrls } = published;
  const cover = (course.attachments ?? [])[0]?.url ?? '';
  const signed = presignedUrls.find((presigned) => presigned.key === cover)?.url ?? cover;
  return {
    title: `${course.name} | Acadimic`,
    description: toSummary(course.description || fallback.description),
    image: /^https?:\/\//.test(signed) ? signed : fallback.image,
  };
};

/**
 * Server-renders a course page's link preview. Crawlers do not run the app's JavaScript, so the
 * course's name, description and cover reach them only through the HTML; the page itself still
 * loads its data in the browser.
 */
export const getCoursePageProps: GetServerSideProps<{ meta: IPageMeta }> = async ({ params, req, res }) => {
  const courseId = params?.courseId ?? params?.slug;
  // A navigation inside the app asks for these props too; no crawler reads that, so it skips the API.
  const isClientNavigation = !!req.url?.startsWith('/_next/data/');
  const meta = isClientNavigation
    ? DEFAULT_PAGE_META
    : await getCoursePageMeta(typeof courseId === 'string' ? courseId : '');
  // Shared by every visitor, so a CDN may hold it briefly; well inside the cover URL's 48 hours.
  res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=3600');
  return { props: { meta } };
};
