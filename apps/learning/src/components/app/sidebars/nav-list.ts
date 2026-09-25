import { GearIcon, GridFourIcon, ShieldCheckIcon, UserCircleIcon, VideoCameraIcon } from '@phosphor-icons/react';
import type { Icon } from '@phosphor-icons/react';

interface ISidebarMenu {
  name: string;
  route: string;
  icon: Icon;
  submenus?: ISidebarMenu[];
  isOpenInNewTab?: boolean;
}

interface ISidebarRoute {
  type: string;
  menus: ISidebarMenu[];
}

/**
 * Every route here must resolve to a page under `src/pages`. The list previously carried the
 * teaching app's menu (students, batches, classes, study materials, community), so seven of its
 * nine entries answered 404 in this app.
 */
export const Routes: ISidebarRoute[] = [
  {
    type: 'Learn',
    menus: [
      {
        name: 'Courses',
        route: '/courses',
        icon: GridFourIcon,
      },
      {
        name: 'Sessions',
        route: '/sessions',
        icon: VideoCameraIcon,
      },
    ],
  },
  {
    type: 'Account',
    menus: [
      {
        name: 'Account',
        route: '/account-settings',
        icon: GearIcon,
      },
      {
        name: 'Profile',
        route: '/account-settings/profile',
        icon: UserCircleIcon,
      },
      {
        name: 'Security',
        route: '/account-settings/security',
        icon: ShieldCheckIcon,
      },
    ],
  },
];
