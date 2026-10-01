import { Avatar } from '@components/app/avatars';
import { AccountSettingsType } from '@enums';
import { useWindowDimensions } from '@hooks/dimensions.hook';
import { type IMenuItem } from '@interfaces';
import {
  ArrowSquareOutIcon,
  CaretDownIcon,
  CaretRightIcon,
  CheckIcon,
  GearSixIcon,
  MoonIcon,
  SignOutIcon,
  SunIcon,
} from '@phosphor-icons/react';
import { type IUser, useSelectedUser, useSelectorLookups, useUserLookups } from '@stores';
import { AccountSettingsRoutes, isProfileForApp } from '@repo/shared/utils';
import { OTHER_APP, THIS_APP } from '@utils/constants';
import { capitalize, logOut } from '@utils/helpers';
import { useRouter } from 'next/router';
import { Menu } from '@repo/ui/app';
import { Badge } from '@repo/ui/core';
import { useColorMode } from '@repo/ui/hooks';

/** ["School", "Teacher"], or just ["Student"] when the organisation type and the role say the same thing. */
const accountLabels = (orgType: string | undefined, permission: string) =>
  [...new Set([orgType, permission].filter((part): part is string => !!part))].map(capitalize);

export const ProfileDropdown = () => {
  const { push } = useRouter();
  const selectorStore = useSelectorLookups();
  const userStore = useUserLookups();
  const { selectUserAndOrg } = selectorStore;
  const selectedUser = useSelectedUser();
  const { getOrgById } = userStore;
  const loggedInUsers = userStore.getLoggedInUsers();
  const { isSmallScreen } = useWindowDimensions();
  const { isDark, toggleColorMode } = useColorMode();

  const handleLogout = () => {
    logOut();
  };

  const items: IMenuItem[] = [
    {
      label: AccountSettingsType.ACCOUNT_SETTINGS,
      icon: <GearSixIcon className="w-4 h-4" />,
      onClick: () => {
        if (isSmallScreen) {
          push(AccountSettingsRoutes[AccountSettingsType.ACCOUNT_SETTINGS]);
        } else {
          push(AccountSettingsRoutes[AccountSettingsType.PROFILE]);
        }
      },
    },
    {
      label: isDark ? 'Light mode' : 'Dark mode',
      icon: isDark ? <SunIcon className="w-4 h-4" /> : <MoonIcon className="w-4 h-4" />,
      onClick: toggleColorMode,
    },
    {
      label: 'Logout',
      icon: <SignOutIcon className="w-4 h-4" />,
      onClick: handleLogout,
    },
  ];

  const handleSwitchAccount = (user: IUser) => {
    if (!user?.org || !selectedUser || user._id === selectedUser._id) return;
    if (!isProfileForApp(THIS_APP, user.permission)) {
      window.location.assign(`${OTHER_APP.url}/?org=${user.org}`);
      return;
    }
    selectUserAndOrg(user._id, user.org);
    window.location.reload();
  };

  if (!selectedUser) return null;

  const fullName = [selectedUser.name, selectedUser.lastName].filter(Boolean).join(' ') || 'User';
  const org = getOrgById(selectedUser.org ?? '');
  const orgName = org?.name || 'Organization';
  const otherAccounts = loggedInUsers.filter((user) => user._id !== selectedUser._id && getOrgById(user.org ?? ''));

  return (
    <Menu
      className="px-0"
      component={
        <button
          type="button"
          aria-label="Open profile menu"
          className="flex items-center gap-2 rounded-full border border-border bg-background p-1 text-foreground transition-colors hover:bg-accent md:pr-3"
        >
          <Avatar avatar={selectedUser.avatar} name={fullName} id={selectedUser._id} size={32} />
          <span className="hidden min-w-0 flex-col items-start text-left md:flex">
            <span className="max-w-36 truncate text-sm font-semibold leading-tight">{fullName}</span>
            <span className="max-w-36 truncate text-xs leading-tight text-muted-foreground">
              {orgName} · {capitalize(selectedUser.permission)}
            </span>
          </span>
          <CaretDownIcon weight="bold" className="hidden h-3.5 w-3.5 shrink-0 text-muted-foreground md:block" />
        </button>
      }
      menuItems={items}
      header={
        <div className="w-80 border-b border-border">
          <div
            role="button"
            className="flex cursor-pointer items-center gap-3 px-4 pb-3 pt-4 transition-colors hover:bg-accent"
            onClick={() => push(AccountSettingsRoutes[AccountSettingsType.PROFILE])}
          >
            <Avatar avatar={selectedUser.avatar} name={fullName} id={selectedUser._id} size={44} />
            <div className="flex min-w-0 flex-1 flex-col">
              <span className="truncate text-sm font-semibold">{fullName}</span>
              <span className="truncate text-xs text-muted-foreground">{selectedUser.email}</span>
            </div>
            <CaretRightIcon weight="bold" className="h-4 w-4 shrink-0 text-muted-foreground" />
          </div>
          <div className="flex flex-wrap gap-1.5 px-4 pb-4">
            <Badge tone="primary">{orgName}</Badge>
            {accountLabels(org?.orgType, selectedUser.permission).map((label) => (
              <Badge key={label}>{label}</Badge>
            ))}
          </div>
          {otherAccounts.length > 0 ? (
            <div className="border-t border-border px-2 py-2">
              <div className="px-2 pb-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                Switch account
              </div>
              <div className="flex flex-col gap-0.5">
                {otherAccounts.map((user) => {
                  const userOrg = getOrgById(user.org ?? '');
                  if (!userOrg) return null;
                  const isElsewhere = !isProfileForApp(THIS_APP, user.permission);
                  return (
                    <div
                      key={user._id}
                      role="button"
                      className="flex cursor-pointer items-center gap-3 rounded-md px-2 py-2 transition-colors hover:bg-accent"
                      onClick={() => handleSwitchAccount(user)}
                    >
                      <Avatar avatar={userOrg.logo} name={userOrg.name || 'Organization'} id={userOrg._id} size={32} />
                      <div className="flex min-w-0 flex-1 flex-col">
                        <span className="truncate text-sm font-medium">{userOrg.name || 'Organization'}</span>
                        <span className="truncate text-xs text-muted-foreground">
                          {accountLabels(userOrg.orgType, user.permission).join(' · ')}
                          {isElsewhere ? ` · Opens in ${OTHER_APP.name}` : ''}
                        </span>
                      </div>
                      {isElsewhere ? (
                        <ArrowSquareOutIcon size={16} className="shrink-0 text-muted-foreground" />
                      ) : (
                        <CheckIcon weight="bold" size={16} className="shrink-0 text-transparent" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ) : null}
        </div>
      }
    />
  );
};
