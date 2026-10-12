import { Layout } from '@enums';
import { AccountSettings } from '@modules/user';

function ReportsPage() {
  return <AccountSettings />;
}

ReportsPage.layout = Layout.PAGE_NAVIGATION;

export default ReportsPage;
