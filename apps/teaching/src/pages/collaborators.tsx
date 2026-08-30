import { Layout } from '@enums';
import { Collaborators } from '@modules/collaborators';

function CollaboratorsPage() {
  return <Collaborators />;
}

CollaboratorsPage.layout = Layout.SIDEBAR;

export default CollaboratorsPage;
