import { Avatar } from '@components/app/avatars';
import { AccountSettingsType } from '@enums';
import { useWindowDimensions } from '@hooks/dimensions.hook';
import { type IMenuItem } from '@interfaces';
import { ChartLineUpIcon, CheckIcon, GearSixIcon, SignOutIcon } from '@phosphor-icons/react';
import { type IUser, useSelectedUser, useSelectorLookups, useUserLookups } from '@stores';
import { AccountSettingsRoutes } from '@utils/constants';
import { capitalize, logOut } from '@utils/helpers';
import { useRouter } from 'next/router';
import * as React from 'react';
import { Menu } from '@repo/ui/app';

export const ProfileDropdown = () => {
  const { push } = useRouter();
  const selectorStore = useSelectorLookups();
  const userStore = useUserLookups();
  const { selectUserAndOrg } = selectorStore;
  const selectedUser = useSelectedUser();
  const { getOrgById } = userStore;
  const loggedInUsers = userStore.getLoggedInUsers();
  const { isSmallScreen } = useWindowDimensions();

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
      label: 'My activity',
      icon: <ChartLineUpIcon className="w-4 h-4" />,
      onClick: () => push('/activity'),
    },
    {
      label: 'Logout',
      icon: <SignOutIcon className="w-4 h-4" />,
      onClick: handleLogout,
    },
  ];

  const handleSwitchAccount = (user: IUser) => {
    if (!user?.org || !selectedUser || user._id === selectedUser._id) return;
    selectUserAndOrg(user._id, user.org);
    window.location.reload();
  };

  if (!selectedUser) return null;

  return (
    <React.Fragment>
      <Menu
        component={
          <button className="p-0 text-foreground rounded-full">
            <Avatar avatar={selectedUser.photoUrl} name={selectedUser.name || 'User'} id={selectedUser._id} />
          </button>
        }
        menuItems={items}
        header={
          <div className="border-b border-border min-w-72 max-w-80">
            <div
              className="flex items-start gap-3 border-b border-border py-4 px-3 cursor-pointer"
              onClick={() => push(AccountSettingsRoutes[AccountSettingsType.PROFILE])}
            >
              <Avatar avatar={selectedUser.photoUrl} name={selectedUser.name || 'User'} id={selectedUser._id} />
              <div className="flex flex-col w-full">
                <div className="text-sm font-medium truncate w-full">{selectedUser.name || 'User'}</div>
                <div className="text-xs text-muted-foreground truncate w-full">{selectedUser.email}</div>
                <div className="text-xs text-muted-foreground w-full truncate flex items-center justify-start divide-x divide-border">
                  <div className="pr-1">{getOrgById(selectedUser.org ?? '')?.name || 'Organization'}</div>
                  <div className="px-1">{capitalize(getOrgById(selectedUser.org ?? '')?.orgType ?? '')}</div>
                  <div className="px-1 capitalize">{selectedUser.permission}</div>
                </div>
              </div>
            </div>
            <div className="px-2 py-3 flex flex-col gap-1">
              <div className="text-xs px-1 uppercase font-semibold text-muted-foreground">Switch Account</div>
              <div className="flex flex-col items-center gap-2 divide-y divide-border">
                {loggedInUsers.map((user) => {
                  const org = getOrgById(user.org ?? '');
                  if (!org) return null;
                  const isSelected = selectedUser._id === user._id;
                  return (
                    <div
                      key={user._id}
                      className="flex items-center gap-3 cursor-pointer justify-between w-full hover:bg-accent px-2 py-2"
                      onClick={() => handleSwitchAccount(user)}
                    >
                      <div className="flex items-center gap-3">
                        <Avatar avatar={org.logo} name={org.name || 'Organization'} id={org._id} />
                        <div className="flex flex-col flex-1">
                          <div className="text-sm truncate w-full font-medium">{org.name || 'Organization'}</div>
                          <div className="text-xs text-muted-foreground w-full truncate flex divide-x divide-border">
                            <div className="pr-1">{capitalize(org.orgType ?? '')}</div>
                            <div className="px-1 capitalize">{user.permission}</div>
                          </div>
                        </div>
                      </div>
                      <CheckIcon
                        weight="bold"
                        size={16}
                        className={`${isSelected ? 'text-primary' : 'text-transparent'}`}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        }
      />
    </React.Fragment>
  );
};
