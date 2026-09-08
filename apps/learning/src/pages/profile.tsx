import { type NextPageWithLayout } from './_app';

const ProfilePage: NextPageWithLayout = () => {
  return (
    <div>
      <h1 className="text-2xl font-bold text-color-primary">Profile</h1>
      <p className="mt-2 text-color-secondary">Manage your account settings</p>
    </div>
  );
};

ProfilePage.layout = 'page';
export default ProfilePage;
