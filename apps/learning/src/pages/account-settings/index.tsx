import { Layout } from '@enums';
import { AccountSettings } from '@modules/user';

function AccountSettingsPage() {
  return <AccountSettings />;
}

AccountSettingsPage.layout = Layout.PAGE;

export default AccountSettingsPage;
