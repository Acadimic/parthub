import { Layout } from '@enums';
import { Course } from '@modules/courses';
import { getCourseIdPageProps } from '@utils/helpers';
import { useRouter } from 'next/router';

const CoursePreviewPage = () => {
  const { query } = useRouter();

  return <Course courseId={query.course as string} isPreview={true} />;
};

CoursePreviewPage.layout = Layout.PUBLIC;

export default CoursePreviewPage;

// Server-rendered for the link preview, and a canonical link to the course's slug address.
export const getServerSideProps = getCourseIdPageProps;
