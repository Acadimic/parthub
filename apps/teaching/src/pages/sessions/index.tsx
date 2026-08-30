import { Layout } from '@enums';
import { Sessions } from '@modules/sessions';

function SessionsPage() {
  return <Sessions />;
}

SessionsPage.layout = Layout.SIDEBAR;

export default SessionsPage;
