import { Button, FullLogo, Logo, ToggleTheme } from '@repo/ui/app';
import { StorageKey } from '@enums';
import { CaretDoubleRightIcon, CaretLeftIcon } from '@phosphor-icons/react';
import { useRouter } from 'next/router';
import { type ReactNode, useCallback, useEffect, useMemo, useState } from 'react';
import { ProfileDropdown } from './components';
import { Routes } from './nav-list';

const DRAWER_WIDTH = 240;
const RAIL_WIDTH = 65;

interface IDrawerContentProps {
  open: boolean;
  route: string;
  onNavigate: (route: string, isOpenInNewTab?: boolean) => void;
  onToggle: () => void;
}

/**
 * Kept at module scope. Declared inside `AppSidebar` it was a new component type on every render,
 * so React unmounted and remounted the whole drawer — losing focus and replaying the transition.
 */
const DrawerContent = ({ open, route, onNavigate, onToggle }: IDrawerContentProps) => (
  <div className="bg-background flex min-h-screen flex-col items-stretch justify-between border-r border-border">
    <div className="grow">
      <div className="flex h-16 items-center gap-2 px-4">
        {open ? (
          <>
            <FullLogo />
            <span className="blue-gradient text-xs font-semibold">Learning</span>
          </>
        ) : (
          <div className="mx-auto">
            <Logo />
          </div>
        )}
      </div>
      <hr className="border-border" />
      <nav>
        {Routes.map((item) => (
          <div key={item.type} className="py-3">
            {/* At the rail width there is no room for the label, and `truncate` renders it as "M…". */}
            {open ? (
              <div className="mx-5 my-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {item.type}
              </div>
            ) : (
              <hr className="mx-3 my-3 border-border" />
            )}
            <div className="flex flex-col gap-0.5 px-2">
              {item.menus.map((menu) => {
                const isActive = menu.route === route;
                return (
                  <button
                    key={menu.name}
                    title={open ? undefined : menu.name}
                    aria-current={isActive ? 'page' : undefined}
                    className={`flex w-full items-center rounded-md py-2.5 transition-colors ${
                      open ? 'px-3' : 'px-0'
                    } ${isActive ? 'bg-accent text-primary' : 'text-foreground hover:bg-accent/60'}`}
                    onClick={() => onNavigate(menu.route, menu.isOpenInNewTab)}
                  >
                    <span className={`flex items-center justify-center ${open ? 'mr-3' : 'mx-auto'}`}>
                      <menu.icon
                        weight={isActive ? 'fill' : 'regular'}
                        className={`h-5 w-5 ${isActive ? 'text-primary' : 'text-muted-foreground'}`}
                      />
                    </span>
                    {open && <span className="truncate text-sm font-medium">{menu.name}</span>}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
    </div>
    <div className={`p-4 ${open ? 'flex justify-end' : 'flex justify-center'}`}>
      <button
        onClick={onToggle}
        aria-label={open ? 'Collapse sidebar' : 'Expand sidebar'}
        className="rounded p-1 hover:bg-accent"
      >
        <CaretDoubleRightIcon weight="bold" className={`h-5 w-5 transition ${open ? 'rotate-180' : 'text-primary'}`} />
      </button>
    </div>
  </div>
);

interface IProps {
  children: ReactNode;
}

export const AppSidebar = ({ children }: IProps) => {
  // Starts closed so the server and the first client render agree; the stored preference (or the
  // viewport, on a first visit) is applied on mount. Reading localStorage during render both
  // risked a hydration mismatch and pinned `open` to the pre-measurement value, which is why the
  // drawer used to open collapsed on a desktop.
  const [open, setOpen] = useState(false);
  const { route, push, query, back } = useRouter();
  const name = query?.name as string;

  useEffect(() => {
    const stored = localStorage.getItem(StorageKey.COLLAPSED);
    setOpen(stored === null ? window.innerWidth >= 640 : stored === 'true');
  }, []);

  const handleDrawerClick = () => {
    setOpen((current) => {
      localStorage.setItem(StorageKey.COLLAPSED, current ? 'false' : 'true');
      return !current;
    });
  };

  const handleNavigate = useCallback(
    (target: string, isOpenInNewTab?: boolean) => {
      if (isOpenInNewTab) {
        window.open(target, '_blank');
        return;
      }
      push(target);
      if (window.innerWidth < 640) setOpen(false);
    },
    [push],
  );

  const allRoutes = useMemo(() => Routes.flatMap((item) => item.menus.map((menu) => menu.route)), []);

  const drawer = <DrawerContent open={open} route={route} onNavigate={handleNavigate} onToggle={handleDrawerClick} />;

  return (
    <div className="flex">
      {/* Mobile drawer overlay */}
      {open && <div className="fixed inset-0 z-40 bg-black/50 sm:hidden" onClick={handleDrawerClick} />}
      {/* Mobile drawer */}
      <aside
        className={`fixed left-0 top-0 z-50 h-full transition-transform duration-300 sm:hidden ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{ width: DRAWER_WIDTH }}
      >
        {drawer}
      </aside>
      {/* Desktop drawer */}
      <aside
        className="hidden flex-shrink-0 overflow-hidden transition-all duration-300 sm:block"
        style={{ width: open ? DRAWER_WIDTH : RAIL_WIDTH }}
      >
        <div className="fixed left-0 top-0 h-full overflow-hidden" style={{ width: open ? DRAWER_WIDTH : RAIL_WIDTH }}>
          {drawer}
        </div>
      </aside>
      {/* Main content */}
      <main className="h-screen w-full flex-1 overflow-auto">
        {/* Top bar */}
        <header className="sticky top-0 z-30 border-b border-border bg-background">
          <div className="flex h-16 w-full items-center justify-between px-4">
            <div className="flex items-center">
              <button
                aria-label="open drawer"
                onClick={handleDrawerClick}
                className={`p-0 hover:bg-transparent ${open ? 'hidden sm:hidden' : 'block sm:hidden'} mr-5`}
              >
                <Logo />
              </button>
            </div>
            <div className="flex w-full items-center justify-between space-x-2">
              <div className="flex items-center space-x-2 text-lg font-bold capitalize">
                {allRoutes.includes(route) ? (
                  <>{name || route?.slice(1).split('-').join(' ')}</>
                ) : (
                  <Button
                    className="px-0"
                    leftsection={<CaretLeftIcon weight="bold" className="h-6 w-6" />}
                    isSubtle
                    onClick={back}
                  >
                    Back
                  </Button>
                )}
              </div>
              <div className="flex items-center space-x-4">
                <div>
                  <ToggleTheme />
                </div>
                <div>
                  <ProfileDropdown />
                </div>
              </div>
            </div>
          </div>
        </header>
        <div className="min-h-full bg-muted p-4 md:p-6">{children}</div>
      </main>
    </div>
  );
};
