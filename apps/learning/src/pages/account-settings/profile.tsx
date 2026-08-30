import { Layout } from '@enums';
import { AccountSettings } from '@modules/user';

function ProfilePage() {
  return <AccountSettings />;
}

ProfilePage.layout = Layout.PAGE;

export default ProfilePage;
