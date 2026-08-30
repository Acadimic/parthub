import { Layout } from '@enums';
import { AccountSettings } from '@modules/user';

function SecurityPage() {
  return <AccountSettings />;
}

SecurityPage.layout = Layout.SIDEBAR;

export default SecurityPage;
