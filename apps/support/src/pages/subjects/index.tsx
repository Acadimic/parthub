import { Layout } from '@enums';
import { Subjects } from '@modules/subjects';

function SubjectsPage() {
  return <Subjects />;
}

SubjectsPage.layout = Layout.SIDEBAR;

export default SubjectsPage;
