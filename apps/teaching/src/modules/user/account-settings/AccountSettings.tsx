import { Breadcrumb, Card, IBreadcrumbItem, MenuList, UploadAvatar } from '@components/app';
import { GearSix, LockKey, User } from '@phosphor-icons/react';
import { AccountSettingsType } from '@enums';
import { useAttachment } from '@hooks/attachment.hook';
import { IMenuItem } from '@interfaces';
import { UserService } from '@services';
import { useStores } from '@stores';
import { AccountSettingsRoutes } from '@utils/constants';
import { successToast } from '@utils/helpers';
import { observer } from 'mobx-react-lite';
import { useRouter } from 'next/router';
import { useState } from 'react';
import { Profile } from './Profile';
import { Security } from './Security';

export const AccountSettings = observer(() => {
  const { selectorStore } = useStores();
  const { selectedUser } = selectorStore;
  const { uploadFilesToS3 } = useAttachment();
  const [avatarFile, setAvatarFile] = useState<File | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const { push, route } = useRouter();

  const updatePhotoUrl = async (file: File | undefined) => {
    if (!selectedUser) return;
    try {
      setIsLoading(true);
      const attachment = file && (await uploadFilesToS3(selectedUser._id, [file]));
      const photoUrl = attachment?.length ? attachment[0].url : '';
      selectedUser.setPhotoUrl(photoUrl);
      await UserService.updateCollaborator(selectedUser);
      successToast({ message: 'Avatar updated successfully!' });
      setAvatarFile(undefined);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const isProfile = route.includes(AccountSettingsRoutes[AccountSettingsType.PROFILE]);
  const isSecurity = route.includes(AccountSettingsRoutes[AccountSettingsType.SECURITY]);
  const isAccountSettings = route === AccountSettingsRoutes[AccountSettingsType.ACCOUNT_SETTINGS];

  const menuItems: IMenuItem[] = [
    {
      label: AccountSettingsType.PROFILE,
      onClick: () => push(AccountSettingsRoutes[AccountSettingsType.PROFILE]),
      icon: <User weight="bold" className="w-5 h-5 text-inherit" />,
      isCurrent: isProfile,
    },
    {
      label: AccountSettingsType.SECURITY,
      onClick: () => push(AccountSettingsRoutes[AccountSettingsType.SECURITY]),
      icon: <LockKey weight="bold" className="w-5 h-5 text-inherit" />,
      isCurrent: isSecurity,
    },
  ];

  if (!selectedUser) return <></>;

  return (
    <div className="flex flex-col w-full h-full">
      <div className="block md:hidden mb-2">
        <Breadcrumb
          items={
            [
              {
                label: AccountSettingsType.ACCOUNT_SETTINGS,
                href: AccountSettingsRoutes[AccountSettingsType.ACCOUNT_SETTINGS],
                icon: <GearSix weight="bold" className="w-3 h-3" />,
              },
              isProfile
                ? {
                    label: AccountSettingsType.PROFILE,
                    href: AccountSettingsRoutes[AccountSettingsType.PROFILE],
                    icon: <User weight="bold" className="w-3 h-3" />,
                  }
                : isSecurity
                  ? {
                      label: AccountSettingsType.SECURITY,
                      href: AccountSettingsRoutes[AccountSettingsType.SECURITY],
                      icon: <LockKey weight="bold" className="w-3 h-3" />,
                    }
                  : null,
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
                <div className="text-sm flex items-center justify-center font-medium tracking-wider text-color-secondary">
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
        <div className="flex-1">{isProfile ? <Profile /> : isSecurity ? <Security /> : <></>}</div>
      </div>
    </div>
  );
});
