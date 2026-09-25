import { Layout } from '@enums';
import { Sessions } from '@modules/sessions';

function SessionsPage() {
  return <Sessions />;
}

SessionsPage.layout = Layout.PAGE_NAVIGATION;

export default SessionsPage;
