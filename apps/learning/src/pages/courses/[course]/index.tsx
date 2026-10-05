import { Layout } from '@enums';
import { CourseBySlug } from '@modules/courses';
import { getCourseSlugPageProps } from '@utils/helpers';
import { useRouter } from 'next/router';

const CoursePage = () => {
  const { query } = useRouter();

  return <CourseBySlug slug={query.course as string} />;
};

CoursePage.layout = Layout.PUBLIC;

export default CoursePage;

// Server-rendered for the link preview, the canonical address and the course's structured data.
export const getServerSideProps = getCourseSlugPageProps;
