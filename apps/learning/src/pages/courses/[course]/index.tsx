import { Layout } from '@enums';
import { CourseBySlug } from '@modules/courses';
import { getCoursePagePaths, getCourseSlugPageProps } from '@utils/helpers';
import { useRouter } from 'next/router';

const CoursePage = () => {
  const { query } = useRouter();

  return <CourseBySlug slug={query.course as string} />;
};

CoursePage.layout = Layout.PUBLIC;

export default CoursePage;

// Built per course and cached, for the link preview, the canonical address and the structured data.
export const getStaticProps = getCourseSlugPageProps;
export const getStaticPaths = getCoursePagePaths;
