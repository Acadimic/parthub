import { Layout } from '@enums';
import { TestPapers } from '@modules/test-papers';

function TestPapersPage() {
  return <TestPapers />;
}

TestPapersPage.layout = Layout.SIDEBAR;

export default TestPapersPage;
