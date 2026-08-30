import { Layout } from '@enums';
import { Courses } from '@modules/courses';

function CoursesPage() {
  return <Courses />;
}

CoursesPage.layout = Layout.SIDEBAR;

export default CoursesPage;
