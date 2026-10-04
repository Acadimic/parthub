import { Layout } from '@enums';
import { Course } from '@modules/courses';
import { getCoursePageProps } from '@utils/helpers';
import { useRouter } from 'next/router';

const CoursePreviewPage = () => {
  const { query } = useRouter();
  const { courseId } = query;

  return <Course courseId={courseId as string} isPreview={true} />;
};

CoursePreviewPage.layout = Layout.PUBLIC;

export default CoursePreviewPage;

// Server-rendered only so a shared link's preview carries the course; the page loads in the browser.
export const getServerSideProps = getCoursePageProps;
