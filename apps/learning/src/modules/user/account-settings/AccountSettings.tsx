import { UploadAvatar } from '@components/app/attachments';
import { Breadcrumb, Card, type IBreadcrumbItem, MenuList } from '@repo/ui/app';
import { AccountSettingsType } from '@enums';
import { useAttachment } from '@hooks/attachment.hook';
import { type IMenuItem } from '@interfaces';
import { ChartLineUpIcon, GearSixIcon, LockKeyIcon, UserIcon } from '@phosphor-icons/react';
import { UserService } from '@services';
import { useSelectedUser, useUserLookups } from '@stores';
import { AccountSettingsRoutes } from '@utils/constants';
import { successToast } from '@utils/helpers';
import { useRouter } from 'next/router';
import { useState } from 'react';
import { Profile } from './Profile';
import { Security } from './Security';

export const AccountSettings = () => {
  const userStore = useUserLookups();
  const { patchUser } = userStore;
  const selectedUser = useSelectedUser();
  const { uploadFilesToS3 } = useAttachment();
  const [avatarFile, setAvatarFile] = useState<File | undefined>(undefined);
  const { push, route } = useRouter();

  const updatePhotoUrl = async (file: File | undefined) => {
    if (!selectedUser) return;
    try {
      const attachment = file && (await uploadFilesToS3(selectedUser._id, [file]));
      const photoUrl = attachment?.length ? attachment[0].url : '';
      patchUser(selectedUser._id, { photoUrl });
      await UserService.updateProfile(selectedUser);
      successToast({ message: 'Avatar updated successfully!' });
      setAvatarFile(undefined);
    } catch (error) {
      console.error(error);
    }
  };

  const isProfile = route.includes(AccountSettingsRoutes[AccountSettingsType.PROFILE]);
  const isSecurity = route.includes(AccountSettingsRoutes[AccountSettingsType.SECURITY]);
  const isAccountSettings = route === AccountSettingsRoutes[AccountSettingsType.ACCOUNT_SETTINGS];

  const menuItems: IMenuItem[] = [
    {
      label: AccountSettingsType.PROFILE,
      onClick: () => push(AccountSettingsRoutes[AccountSettingsType.PROFILE]),
      icon: <UserIcon weight="bold" className="w-5 h-5 text-inherit" />,
      isCurrent: isProfile,
    },
    {
      label: AccountSettingsType.SECURITY,
      onClick: () => push(AccountSettingsRoutes[AccountSettingsType.SECURITY]),
      icon: <LockKeyIcon weight="bold" className="w-5 h-5 text-inherit" />,
      isCurrent: isSecurity,
    },
    // On a phone this list is the way to the activity page; the header links only show from `md`.
    {
      label: 'Activity',
      onClick: () => push('/activity'),
      icon: <ChartLineUpIcon weight="bold" className="w-5 h-5 text-inherit" />,
    },
  ];

  let currentCrumb: IBreadcrumbItem | null = null;
  if (isProfile) {
    currentCrumb = {
      label: AccountSettingsType.PROFILE,
      href: AccountSettingsRoutes[AccountSettingsType.PROFILE],
      icon: <UserIcon weight="bold" className="w-3 h-3" />,
    };
  } else if (isSecurity) {
    currentCrumb = {
      label: AccountSettingsType.SECURITY,
      href: AccountSettingsRoutes[AccountSettingsType.SECURITY],
      icon: <LockKeyIcon weight="bold" className="w-3 h-3" />,
    };
  }

  let panel: React.ReactNode = <></>;
  if (isProfile) panel = <Profile />;
  else if (isSecurity) panel = <Security />;

  if (!selectedUser) return <></>;

  return (
    <div className="flex flex-col w-full h-full py-4 px-4">
      <div className="block md:hidden mb-2">
        <Breadcrumb
          items={
            [
              {
                label: AccountSettingsType.ACCOUNT_SETTINGS,
                href: AccountSettingsRoutes[AccountSettingsType.ACCOUNT_SETTINGS],
                icon: <GearSixIcon weight="bold" className="w-3 h-3" />,
              },
              currentCrumb,
            ].filter(Boolean) as IBreadcrumbItem[]
          }
        />
      </div>
      <div className="flex justify-center items-start gap-4 w-full">
        <div className={`w-full md:w-[300px] flex flex-col space-y-4 ${!isAccountSettings ? 'hidden md:block' : ''}`}>
          <Card>
            <div className="flex flex-col items-center justify-center gap-6 min-h-[240px]">
              <UploadAvatar
                url={selectedUser.photoUrl}
                file={avatarFile}
                setFile={updatePhotoUrl}
                removeFile={() => updatePhotoUrl(undefined)}
              />
              <div className="flex flex-col items-center">
                <h1 className="text-xl md:text-2xl font-bold">{selectedUser?.name}</h1>
                <div className="text-sm flex items-center justify-center font-medium tracking-wider text-muted-foreground">
                  {selectedUser.email}
                </div>
              </div>
            </div>
          </Card>
          <div className="overflow-auto grow flex-1 h-full">
            <Card>
              <MenuList menuItems={menuItems} />
            </Card>
          </div>
        </div>
        <div className="flex-1">{panel}</div>
      </div>
    </div>
  );
};
