import { Layout } from '@enums';
import { Course } from '@modules/courses';
import { useRouter } from 'next/router';

const CoursePreviewPageByName = () => {
  const { query } = useRouter();
  const { slug } = query;

  return <Course courseId={slug as string} isPreview={true} />;
};

CoursePreviewPageByName.layout = Layout.PAGE;

export default CoursePreviewPageByName;
