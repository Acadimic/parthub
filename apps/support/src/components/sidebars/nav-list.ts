import { GameControllerIcon, GrainsSlashIcon, HouseIcon, LifebuoyIcon } from '@phosphor-icons/react';
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
      // A 'Community' entry sat here and routed to /community, which no app has ever had a page for
      // — it fell through to the 404 screen. Restore it alongside the page, not before it.
      {
        name: 'Support',
        route: 'https://www.parthhub.com/contact-us',
        icon: LifebuoyIcon,
        isOpenInNewTab: true,
      },
    ],
  },
];
