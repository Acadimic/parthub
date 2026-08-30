import { Layout } from '@enums';
import { Profile } from '@modules/user';

function ProfilePage() {
  return <Profile />;
}

ProfilePage.layout = Layout.SIDEBAR;

export default ProfilePage;
