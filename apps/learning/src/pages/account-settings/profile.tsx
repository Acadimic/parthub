import { Layout } from '@enums';
import { AccountSettings } from '@modules/user';

function ProfilePage() {
  return <AccountSettings />;
}

ProfilePage.layout = Layout.PAGE_NAVIGATION;

export default ProfilePage;
