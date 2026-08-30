import { ChatsCircle, GameController, GrainsSlash, House, Lifebuoy } from '@phosphor-icons/react';
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
        icon: House,
      },
    ],
  },
  {
    type: 'Manage',
    menus: [
      {
        name: 'Subjects',
        route: '/subjects',
        icon: GameController,
      },
      {
        name: 'Standards',
        route: '/standards',
        icon: GrainsSlash,
      },
    ],
  },
  {
    type: 'General',
    menus: [
      {
        name: 'Community',
        route: '/community',
        icon: ChatsCircle,
      },
      {
        name: 'Support',
        route: 'https://www.parthhub.com/contact-us',
        icon: Lifebuoy,
        isOpenInNewTab: true,
      },
    ],
  },
];
