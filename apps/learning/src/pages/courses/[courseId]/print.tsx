import { Layout } from '@enums';
import { CoursePrint, QuizPrint, ResultPrint } from '@modules/print';
import { useRouter } from 'next/router';

const CoursePrintPage = () => {
  const { query } = useRouter();
  const courseId = query.courseId as string;
  if (typeof query.result === 'string') return <ResultPrint courseId={courseId} sittingId={query.result} />;
  if (typeof query.quiz === 'string') return <QuizPrint courseId={courseId} testPaperId={query.quiz} />;
  return <CoursePrint courseId={courseId} moduleId={typeof query.module === 'string' ? query.module : null} />;
};

CoursePrintPage.layout = Layout.PRINT;

export default CoursePrintPage;
