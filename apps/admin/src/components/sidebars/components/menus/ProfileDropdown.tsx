import { Menu } from '@components/app';
import { IMenuItem } from '@interfaces';
import { SignOut, User } from '@phosphor-icons/react';
import { getFirebaseUser } from '@utils/firebase';
import { logOut } from '@utils/helpers';
import { observer } from 'mobx-react-lite';
import { useRouter } from 'next/router';
import * as React from 'react';

export const ProfileDropdown = observer(() => {
  const { push } = useRouter();
  const user = getFirebaseUser();

  const handleLogout = () => {
    logOut();
  };

  const items: IMenuItem[] = [
    {
      label: 'Profile',
      icon: <User className="w-4 h-4" />,
      onClick: () => push('/profile'),
    },
    {
      label: 'Logout',
      icon: <SignOut className="w-4 h-4" />,
      onClick: handleLogout,
    },
  ];

  return (
    <React.Fragment>
      <Menu
        component={
          <button className="p-0 text-color-text rounded-full">
            <div className="w-8 h-8 rounded-full bg-color-light flex items-center justify-center text-sm font-semibold text-color-text">
              {user?.displayName && user?.displayName[0]}
            </div>
          </button>
        }
        menuItems={items}
      />
    </React.Fragment>
  );
});
