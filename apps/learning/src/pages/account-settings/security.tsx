import { Layout } from '@enums';
import { AccountSettings } from '@modules/user';

function SecurityPage() {
  return <AccountSettings />;
}

SecurityPage.layout = Layout.PAGE_NAVIGATION;

export default SecurityPage;
