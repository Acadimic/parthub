import { Layout } from '@enums';
import { TestPaperPrint } from '@modules/print';
import { useRouter } from 'next/router';

const TestPaperPrintPage = () => {
  const router = useRouter();
  return <TestPaperPrint testPaperId={router.query._id as string} />;
};

TestPaperPrintPage.layout = Layout.PRINT;

export default TestPaperPrintPage;
