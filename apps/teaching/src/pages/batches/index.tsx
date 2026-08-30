import { Layout } from '@enums';
import { Batches } from '@modules/batches';

function BatchesPage() {
  return <Batches />;
}

BatchesPage.layout = Layout.SIDEBAR;

export default BatchesPage;
