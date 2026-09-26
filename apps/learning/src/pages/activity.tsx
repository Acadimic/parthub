import { Layout } from '@enums';
import { Activity } from '@modules/activity';

function ActivityPage() {
  return <Activity />;
}

ActivityPage.layout = Layout.PAGE_NAVIGATION;

export default ActivityPage;
