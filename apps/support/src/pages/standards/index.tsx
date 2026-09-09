import { Layout } from '@enums';
import { Standards } from '@modules/standards';

function StandardsPage() {
  return <Standards />;
}

StandardsPage.layout = Layout.SIDEBAR;

export default StandardsPage;
