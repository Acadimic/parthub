import { Layout } from '@enums';
import { Courses } from '@modules/courses/Courses';

function CoursesPage() {
  return <Courses isFilter withHeading />;
}

CoursesPage.layout = Layout.PUBLIC;

export default CoursesPage;
