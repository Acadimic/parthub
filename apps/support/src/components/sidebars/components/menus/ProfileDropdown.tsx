import { Menu } from '@repo/ui/app';
import { Avatar, Badge } from '@repo/ui/core';
import { useColorMode } from '@repo/ui/hooks';
import { type IMenuItem } from '@interfaces';
import { CaretDownIcon, CaretRightIcon, MoonIcon, SignOutIcon, SunIcon, UserIcon } from '@phosphor-icons/react';
import { getFirebaseUser } from '@utils/firebase';
import { logOut } from '@utils/helpers';
import { useRouter } from 'next/router';

export const ProfileDropdown = () => {
  const { push } = useRouter();
  const user = getFirebaseUser();
  const { isDark, toggleColorMode } = useColorMode();

  const handleLogout = () => {
    logOut();
  };

  const items: IMenuItem[] = [
    {
      label: 'Profile',
      icon: <UserIcon className="w-4 h-4" />,
      onClick: () => push('/profile'),
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

  const name = user?.displayName || user?.email || 'User';
  const photo = user?.photoURL ?? undefined;

  return (
    <Menu
      className="px-0"
      component={
        <button
          type="button"
          aria-label="Open profile menu"
          className="flex items-center gap-2 rounded-full border border-border bg-background p-1 text-foreground transition-colors hover:bg-accent md:pr-3"
        >
          <Avatar name={name} src={photo} size="sm" showTooltip={false} />
          <span className="hidden min-w-0 flex-col items-start text-left md:flex">
            <span className="max-w-36 truncate text-sm font-semibold leading-tight">{name}</span>
            <span className="max-w-36 truncate text-xs leading-tight text-muted-foreground">Support</span>
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
            onClick={() => push('/profile')}
          >
            <Avatar name={name} src={photo} size="lg" showTooltip={false} />
            <div className="flex min-w-0 flex-1 flex-col">
              <span className="truncate text-sm font-semibold">{name}</span>
              {user?.email ? <span className="truncate text-xs text-muted-foreground">{user.email}</span> : null}
            </div>
            <CaretRightIcon weight="bold" className="h-4 w-4 shrink-0 text-muted-foreground" />
          </div>
          <div className="flex flex-wrap gap-1.5 px-4 pb-4">
            <Badge tone="primary">Support</Badge>
            {user?.emailVerified ? <Badge tone="success">Verified</Badge> : <Badge>Unverified</Badge>}
          </div>
        </div>
      }
    />
  );
};
