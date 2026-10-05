import { Layout } from '@enums';
import { Course } from '@modules/courses';
import { useRouter } from 'next/router';

const CourseModulesPage = () => {
  const { query } = useRouter();

  return <Course courseId={query.course as string} isPreview={false} />;
};

CourseModulesPage.layout = Layout.FOCUS;

export default CourseModulesPage;
