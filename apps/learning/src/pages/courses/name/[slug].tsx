import { Layout } from '@enums';
import { Course } from '@modules/courses';
import { getCoursePageProps } from '@utils/helpers';
import { useRouter } from 'next/router';

const CoursePreviewPageByName = () => {
  const { query } = useRouter();
  const { slug } = query;

  return <Course courseId={slug as string} isPreview={true} />;
};

CoursePreviewPageByName.layout = Layout.PUBLIC;

export default CoursePreviewPageByName;

// Server-rendered only so a shared link's preview carries the course; the page loads in the browser.
export const getServerSideProps = getCoursePageProps;
