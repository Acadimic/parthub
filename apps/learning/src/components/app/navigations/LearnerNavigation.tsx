import { GearIcon, HouseIcon, type Icon, PaperPlaneIcon, VideoCameraIcon } from '@phosphor-icons/react';
import { useRouter } from 'next/router';
import { Link } from '@repo/ui/app';

interface INavigation {
  name: string;
  route: string;
  icon: Icon;
  disabled?: boolean;
}

/** Each route needs a page under `src/pages`; `/learning` and `/sessions` had none and answered 404. */
export const learnerRoutes: INavigation[] = [
  {
    name: 'Home',
    route: '/',
    icon: HouseIcon,
  },
  {
    name: 'Courses',
    route: '/courses',
    icon: PaperPlaneIcon,
  },
  {
    name: 'Sessions',
    route: '/sessions',
    icon: VideoCameraIcon,
  },
  {
    name: 'Account',
    route: '/account-settings',
    icon: GearIcon,
  },
];

export const LearnerNavigation = () => {
  const { route } = useRouter();
  return (
    <>
      <div className="w-full bg-background flex justify-between items-center">
        {learnerRoutes.map((nav) => {
          const isActive = route === nav.route;
          return (
            <Link
              isSubtle
              key={nav.name}
              href={nav.route}
              // onClick={() => !nav.disabled && !isActive && push(nav.route)}
              className="cursor-pointer py-1 md:py-0 text-foreground"
            >
              <div className="flex justify-center md:hidden pb-1">
                <nav.icon weight="regular" className={`w-5 h-5 ${isActive ? 'text-primary' : ''}`} />
              </div>
              <div
                className={`text-xxs sm:text-sm font-medium md:border-b-2 px-2.5 md:py-3 ${isActive ? 'border-primary' : 'border-transparent'}`}
              >
                <span className={`${isActive ? 'text-primary' : ''}`}>{nav.name}</span>
              </div>
            </Link>
          );
        })}
      </div>
    </>
  );
};
