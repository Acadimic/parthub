import { Layout } from '@enums';
import { Course } from '@modules/courses';
import { useRouter } from 'next/router';

const CoursePreviewPage = () => {
  const { query } = useRouter();
  const { courseId } = query;

  return <Course courseId={courseId as string} isPreview={true} />;
};

CoursePreviewPage.layout = Layout.PAGE;

export default CoursePreviewPage;
