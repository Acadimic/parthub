import {
  Bookmarks,
  CalendarBlank,
  ChatsCircle,
  Columns,
  FileText,
  Folder,
  GridFour,
  House,
  Lifebuoy,
  UsersThree,
  UsersFour,
} from '@phosphor-icons/react';
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
        route: '/',
        icon: House,
      },
      {
        name: 'Students',
        route: '/students',
        icon: UsersThree,
      },
      {
        name: 'Collaborators',
        route: '/collaborators',
        icon: UsersFour,
      },
      {
        name: 'Batches',
        route: '/batches',
        icon: Columns,
      },
    ],
  },
  {
    type: 'Manage',
    menus: [
      {
        name: 'Classes',
        route: '/classes',
        icon: CalendarBlank,
      },
      {
        name: 'Test Papers',
        route: '/test-papers',
        icon: FileText,
      },
      {
        name: 'Study Materials',
        route: '/study-materials',
        icon: Folder,
      },
      {
        name: 'Courses',
        route: '/courses',
        icon: GridFour,
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
