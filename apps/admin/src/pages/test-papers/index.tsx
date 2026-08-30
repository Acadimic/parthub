import { Layout } from '@enums';
import { TestPaperStepper } from '@modules/test-papers/components';

function TestPapersPage() {
  return <TestPaperStepper />;
}

TestPapersPage.layout = Layout.SIDEBAR;

export default TestPapersPage;
