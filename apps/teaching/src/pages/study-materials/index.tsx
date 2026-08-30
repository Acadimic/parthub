import { Layout } from '@enums';
import { StudyMaterials } from '@modules/study-materials';

function StudyMaterialsPage() {
  return <StudyMaterials />;
}

StudyMaterialsPage.layout = Layout.SIDEBAR;

export default StudyMaterialsPage;
