import { type NextPageWithLayout } from './_app';

const ProfilePage: NextPageWithLayout = () => {
  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground">Profile</h1>
      <p className="mt-2 text-muted-foreground">Manage your account settings</p>
    </div>
  );
};

ProfilePage.layout = 'page';
export default ProfilePage;
