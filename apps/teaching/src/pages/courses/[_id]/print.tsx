import { Layout } from '@enums';
import { CoursePrint } from '@modules/print';
import { useRouter } from 'next/router';

const CoursePrintPage = () => {
  const router = useRouter();
  const { _id, module } = router.query;
  return <CoursePrint courseId={_id as string} moduleId={typeof module === 'string' ? module : null} />;
};

CoursePrintPage.layout = Layout.PRINT;

export default CoursePrintPage;
