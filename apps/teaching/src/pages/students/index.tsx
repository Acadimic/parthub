import { Layout } from '@enums';
import { Students } from '@modules/students';

function StudentsPage() {
  return <Students />;
}

StudentsPage.layout = Layout.SIDEBAR;

export default StudentsPage;
