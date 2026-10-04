import { Layout } from '@enums';
import { TestPaper } from '@modules/test-papers';
import { useRouter } from 'next/router';

const TestPaperPage = () => {
  const router = useRouter();
  return <TestPaper testPaperId={router.query._id as string} />;
};

TestPaperPage.layout = Layout.SIDEBAR;

export default TestPaperPage;
