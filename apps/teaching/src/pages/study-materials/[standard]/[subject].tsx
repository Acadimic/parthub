import { Layout } from '@enums';
import { StudyMaterial } from '@modules/study-materials';
import { useRouter } from 'next/router';

const StudyMaterialPage = () => {
  const router = useRouter();
  return <StudyMaterial standardId={router.query.standard as string} subjectId={router.query.subject as string} />;
};

StudyMaterialPage.layout = Layout.SIDEBAR;

export default StudyMaterialPage;
