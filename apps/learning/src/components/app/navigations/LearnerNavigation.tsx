import { BookIcon, HouseIcon, Icon, PaperPlaneIcon, VideoIcon } from '@phosphor-icons/react';
import { useRouter } from 'next/router';
import { Link } from '../links';

interface INavigation {
  name: string;
  route: string;
  icon: Icon;
  disabled?: boolean;
}

export const learnerRoutes: INavigation[] = [
  {
    name: 'Home',
    route: '/',
    icon: HouseIcon,
  },
  {
    name: 'Learning',
    route: '/learning',
    icon: BookIcon,
  },
  {
    name: 'Courses',
    route: '/courses',
    icon: PaperPlaneIcon,
  },
  {
    name: 'Sessions',
    route: '/sessions',
    icon: VideoIcon,
  },
];

export const LearnerNavigation = () => {
  const { route, push } = useRouter();
  return (
    <>
      <div className="w-full bg-background-primary flex justify-between items-center">
        {learnerRoutes.map((nav) => {
          const isActive = route === nav.route;
          return (
            <Link
              isSubtle
              key={nav.name}
              href={nav.route}
              // onClick={() => !nav.disabled && !isActive && push(nav.route)}
              className="cursor-pointer py-1 md:py-0 text-color-primary"
            >
              <div className="flex justify-center md:hidden pb-1">
                <nav.icon weight="regular" className={`w-5 h-5 ${isActive ? 'text-blue-primary' : ''}`} />
              </div>
              <div
                className={`text-xxs sm:text-sm font-medium md:border-b-2 px-2.5 md:py-3 ${isActive ? 'border-blue-primary' : 'border-transparent'}`}
              >
                <span className={`${isActive ? 'text-blue-primary' : ''}`}>{nav.name}</span>
              </div>
            </Link>
          );
        })}
      </div>
    </>
  );
};
