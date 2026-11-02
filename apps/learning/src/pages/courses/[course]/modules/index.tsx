import { Layout } from '@enums';
import { CourseLessons } from '@modules/courses';
import { useRouter } from 'next/router';

const CourseModulesPage = () => {
  const { query } = useRouter();

  return <CourseLessons course={query.course as string} />;
};

CourseModulesPage.layout = Layout.FOCUS;

export default CourseModulesPage;
