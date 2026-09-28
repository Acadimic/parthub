import {
  CalendarBlankIcon,
  ChalkboardTeacherIcon,
  ColumnsIcon,
  FileTextIcon,
  FlaskIcon,
  FolderIcon,
  GridFourIcon,
  HouseIcon,
  LifebuoyIcon,
  ReceiptIcon,
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

const APP_ROUTES: ISidebarRoute[] = [
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
      {
        name: 'Orders',
        route: '/orders',
        icon: ReceiptIcon,
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

/**
 * Development-only. The editor lab is a spike harness, not a teacher-facing screen, and a "Labs"
 * group in a production sidebar is how a demo page ends up in front of a real customer.
 *
 * `process.env.NODE_ENV` is statically replaced at build time, so in a production build the
 * condition folds to `false` and the group — with its route string — is dropped from the bundle
 * entirely. Delete this block when the lab goes away.
 */
const LAB_ROUTES: ISidebarRoute[] = [
  {
    type: 'Labs',
    menus: [
      {
        name: 'Editor Lab',
        route: '/editor',
        icon: FlaskIcon,
      },
    ],
  },
];

export const Routes: ISidebarRoute[] = [...APP_ROUTES, ...(process.env.NODE_ENV === 'development' ? LAB_ROUTES : [])];
