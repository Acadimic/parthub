import { Layout } from '@enums';
import { Course } from '@modules/courses';
import { useRouter } from 'next/router';

const CourseModulesPage = () => {
  const { query } = useRouter();
  const { courseId } = query;

  return <Course courseId={courseId as string} isPreview={false} />;
};

CourseModulesPage.layout = Layout.PAGE;

export default CourseModulesPage;
