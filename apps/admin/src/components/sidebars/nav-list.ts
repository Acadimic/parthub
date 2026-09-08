import { ChatsCircleIcon, GameControllerIcon, GrainsSlashIcon, HouseIcon, LifebuoyIcon } from '@phosphor-icons/react';
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

export const Routes: ISidebarRoute[] = [
  {
    type: 'App',
    menus: [
      {
        name: 'Home',
        route: '/home',
        icon: HouseIcon,
      },
    ],
  },
  {
    type: 'Manage',
    menus: [
      {
        name: 'Subjects',
        route: '/subjects',
        icon: GameControllerIcon,
      },
      {
        name: 'Standards',
        route: '/standards',
        icon: GrainsSlashIcon,
      },
    ],
  },
  {
    type: 'General',
    menus: [
      {
        name: 'Community',
        route: '/community',
        icon: ChatsCircleIcon,
      },
      {
        name: 'Support',
        route: 'https://www.parthhub.com/contact-us',
        icon: LifebuoyIcon,
        isOpenInNewTab: true,
      },
    ],
  },
];
