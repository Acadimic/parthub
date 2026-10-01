import { UploadAvatar } from '@components/app/attachments';
import { AccountSettingsType } from '@enums';
import { useAttachment } from '@hooks/attachment.hook';
import {
  CaretLeftIcon,
  CaretRightIcon,
  ChartLineUpIcon,
  type Icon,
  LockKeyIcon,
  UserIcon,
} from '@phosphor-icons/react';
import { AccountSettingsRoutes } from '@repo/shared/utils';
import { Link } from '@repo/ui/app';
import { Badge } from '@repo/ui/core';
import { cn } from '@repo/ui/lib';
import { UserService } from '@services';
import { useSelectedUser, useUserLookups, useUserStore } from '@stores';
import { capitalize, successToast } from '@utils/helpers';
import { useRouter } from 'next/router';
import { useState } from 'react';
import { Profile } from './Profile';
import { Security } from './Security';

interface INavItem {
  label: string;
  description: string;
  href: string;
  icon: Icon;
  isCurrent: boolean;
  /** Only the phone needs this entry: wider screens reach the same page from the header. */
  isPhoneOnly?: boolean;
}

export const AccountSettings = () => {
  const userStore = useUserLookups();
  const { patchUser, getOrgById } = userStore;
  const selectedUser = useSelectedUser();
  const { uploadFilesToS3 } = useAttachment();
  const [avatarFile, setAvatarFile] = useState<File | undefined>(undefined);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const { route } = useRouter();

  const updatePhotoUrl = async (file: File | undefined) => {
    if (!selectedUser) return;
    // The chosen picture shows at once, under the spinner, until the saved one takes over.
    setAvatarFile(file);
    setIsUploadingAvatar(true);
    try {
      const attachment = file && (await uploadFilesToS3(selectedUser._id, [file]));
      const avatar = attachment?.length ? attachment[0].url : '';
      patchUser(selectedUser._id, { avatar });
      // Read the user back after the patch: the one in this closure still has the old photo.
      const updatedUser = useUserStore.getState().getUserById(selectedUser._id);
      if (updatedUser) await UserService.updateProfile(updatedUser);
      successToast({ message: 'Avatar updated successfully!' });
    } catch (error) {
      console.error(error);
    } finally {
      setAvatarFile(undefined);
      setIsUploadingAvatar(false);
    }
  };

  const isSecurity = route.includes(AccountSettingsRoutes[AccountSettingsType.SECURITY]);
  const isIndex = route === AccountSettingsRoutes[AccountSettingsType.ACCOUNT_SETTINGS];
  // The index route is the phone's menu; wider screens have the menu beside the panel, so they
  // open straight on the profile.
  const isProfile = !isSecurity && !isIndex;

  const navItems: INavItem[] = [
    {
      label: AccountSettingsType.PROFILE,
      description: 'Name, role and contact details',
      href: AccountSettingsRoutes[AccountSettingsType.PROFILE],
      icon: UserIcon,
      isCurrent: isProfile || isIndex,
    },
    {
      label: AccountSettingsType.SECURITY,
      description: 'Password and sign-in',
      href: AccountSettingsRoutes[AccountSettingsType.SECURITY],
      icon: LockKeyIcon,
      isCurrent: isSecurity,
    },
    {
      label: 'Activity',
      description: 'Your learning history',
      href: '/activity',
      icon: ChartLineUpIcon,
      isCurrent: false,
      isPhoneOnly: true,
    },
  ];

  if (!selectedUser) return <></>;

  const fullName = selectedUser.name || 'User';
  const org = getOrgById(selectedUser.org ?? '');
  const currentItem = navItems.find((item) => item.isCurrent);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-5 md:px-6 md:py-8">
      {/* On a phone a sub-page replaces the menu, so it carries a way back; wider screens keep both. */}
      <div className={cn('mb-4 md:hidden', isIndex && 'hidden')}>
        <Link
          isSubtle
          href={AccountSettingsRoutes[AccountSettingsType.ACCOUNT_SETTINGS]}
          className="px-0 text-sm text-muted-foreground hover:text-foreground"
          leftsection={<CaretLeftIcon weight="bold" className="h-4 w-4" />}
        >
          {AccountSettingsType.ACCOUNT_SETTINGS}
        </Link>
      </div>
      <div className={cn('mb-6', !isIndex && 'hidden md:block')}>
        <p className="text-xs font-semibold uppercase tracking-caps text-primary">Account</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-foreground">
          {AccountSettingsType.ACCOUNT_SETTINGS}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage how you appear, how to reach you, and how you sign in.
        </p>
      </div>

      <div className="flex flex-col gap-6 md:grid md:grid-cols-[280px_minmax(0,1fr)] md:items-start">
        <aside className={cn('flex flex-col gap-4', !isIndex && 'hidden md:flex')}>
          <div className="overflow-hidden rounded-xl border border-border bg-background">
            <div className="h-20 bg-gradient-to-br from-primary/20 via-primary/10 to-transparent" />
            <div className="-mt-12 flex flex-col items-center px-4 pb-5">
              <UploadAvatar
                id={selectedUser._id}
                name={fullName}
                url={selectedUser.avatar}
                file={avatarFile}
                isUploading={isUploadingAvatar}
                setFile={updatePhotoUrl}
                removeFile={() => updatePhotoUrl(undefined)}
              />
              <div className="mt-3 flex w-full flex-col items-center text-center">
                <h2 className="w-full truncate text-lg font-semibold text-foreground">{fullName}</h2>
                <p className="w-full truncate text-sm text-muted-foreground">{selectedUser.email}</p>
              </div>
              <div className="mt-3 flex flex-wrap justify-center gap-1.5">
                {/* A personal account's organisation is the person, so its name would repeat the heading. */}
                {org?.name && String(org.orgType) !== String(selectedUser.permission) ? (
                  <Badge tone="primary">{org.name}</Badge>
                ) : null}
                <Badge>{capitalize(selectedUser.permission)}</Badge>
              </div>
            </div>
          </div>

          <nav
            aria-label="Account settings"
            className="flex flex-col gap-1 rounded-xl border border-border bg-background p-2"
          >
            {navItems.map(({ label, description, href, icon: ItemIcon, isCurrent, isPhoneOnly }) => (
              <Link
                key={href}
                href={href}
                isSubtle
                className={cn(
                  'w-full rounded-lg px-2.5 py-2 text-left hover:bg-accent',
                  isCurrent ? 'bg-primary/10 text-primary hover:bg-primary/10' : 'text-foreground',
                  isPhoneOnly && 'md:hidden',
                )}
                labelClassName="flex min-w-0 flex-1 items-center gap-3"
              >
                <span
                  className={cn(
                    'flex h-9 w-9 shrink-0 items-center justify-center rounded-md',
                    isCurrent ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground',
                  )}
                >
                  <ItemIcon weight={isCurrent ? 'fill' : 'regular'} className="h-5 w-5" />
                </span>
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate text-sm">{label}</span>
                  <span
                    className={cn(
                      'truncate text-xs font-normal',
                      isCurrent ? 'text-primary/80' : 'text-muted-foreground',
                    )}
                  >
                    {description}
                  </span>
                </span>
                <CaretRightIcon weight="bold" className="h-3.5 w-3.5 shrink-0 text-muted-foreground md:hidden" />
              </Link>
            ))}
          </nav>
        </aside>

        <main
          className={cn('flex min-w-0 flex-col gap-6', isIndex && 'hidden md:flex')}
          aria-label={currentItem?.label}
        >
          {isSecurity ? <Security /> : <Profile />}
        </main>
      </div>
    </div>
  );
};
