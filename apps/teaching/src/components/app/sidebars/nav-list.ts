import {
  CalendarBlankIcon,
  ChalkboardTeacherIcon,
  ColumnsIcon,
  FileTextIcon,
  FolderIcon,
  GridFourIcon,
  HouseIcon,
  LifebuoyIcon,
  UsersThreeIcon,
  UsersFourIcon,
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
        route: '/home',
        icon: HouseIcon,
      },
      {
        name: 'Students',
        route: '/students',
        icon: UsersThreeIcon,
      },
      {
        name: 'Collaborators',
        route: '/collaborators',
        icon: UsersFourIcon,
      },
      {
        name: 'Batches',
        route: '/batches',
        icon: ColumnsIcon,
      },
    ],
  },
  {
    type: 'Manage',
    menus: [
      {
        name: 'Sessions',
        route: '/sessions',
        icon: ChalkboardTeacherIcon,
      },
      {
        name: 'Calendar',
        route: '/calender',
        icon: CalendarBlankIcon,
      },
      {
        name: 'Test Papers',
        route: '/test-papers',
        icon: FileTextIcon,
      },
      {
        name: 'Study Materials',
        route: '/study-materials',
        icon: FolderIcon,
      },
      {
        name: 'Courses',
        route: '/courses',
        icon: GridFourIcon,
      },
    ],
  },
  {
    type: 'General',
    menus: [
      {
        name: 'Support',
        route: 'https://www.parthhub.com/contact-us',
        icon: LifebuoyIcon,
        isOpenInNewTab: true,
      },
    ],
  },
];
