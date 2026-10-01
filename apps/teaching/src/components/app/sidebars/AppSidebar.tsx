import { StorageKey } from '@enums';
import { CaretDoubleRightIcon, CaretLeftIcon } from '@phosphor-icons/react';
import { Button, FullLogo, Logo } from '@repo/ui/app';
import { cn } from '@repo/ui/lib';
import { useRouter } from 'next/router';
import { type ReactNode, useEffect, useMemo, useState } from 'react';
import { ProfileDropdown } from './components';
import { Routes } from './nav-list';

const DRAWER_WIDTH = 240;
const COLLAPSED_WIDTH = 65;

/** Matches Tailwind's `sm`, which is where the drawer stops overlaying the page. */
const LARGE_DEVICE_WIDTH = 640;

const ALL_MENUS = Routes.flatMap((group) => group.menus);

interface IDrawerProps {
  open: boolean;
  route: string;
  onToggle: () => void;
  onNavigate: (route: string, isOpenInNewTab?: boolean) => void;
}

/**
 * Declared at module scope, not inside AppSidebar. A component defined in the parent's body is a
 * new type on every render, so React unmounts and remounts the whole drawer each time `open`
 * changes — which is what made the collapse animation jump and reset any focus inside it.
 */
const DrawerContent = ({ open, route, onToggle, onNavigate }: IDrawerProps) => (
  // h-screen with a scrolling nav, not min-h-screen: the parent clips overflow, so a column taller
  // than the window pushed the collapse control out of sight with no way to reach it. The nav is
  // the only part allowed to grow; the logo and the toggle are pinned.
  <div className="bg-background h-screen flex flex-col items-stretch border-r border-border">
    <div
      className={cn(
        'flex items-center h-16 shrink-0 pr-2.5 transition-[padding] duration-300 ease-in-out',
        open ? 'pl-2.5' : 'pl-[18px]',
      )}
    >
      <div
        className={cn('shrink-0 overflow-hidden transition-[width] duration-300 ease-in-out', open ? 'w-36' : 'w-7')}
      >
        <FullLogo className="h-7 max-w-none" />
      </div>
      <span
        className={cn(
          'text-foreground font-semibold text-xs whitespace-nowrap overflow-hidden transition-all duration-300 ease-in-out',
          open ? 'ml-2 max-w-20 opacity-100' : 'ml-0 max-w-0 opacity-0',
        )}
      >
        Teaching
      </span>
    </div>
    <hr className="border-border shrink-0" />
    <div className="flex-1 overflow-y-auto overflow-x-hidden no-scrollbar">
      <nav>
        {Routes.map((group) => (
          <div key={group.type} className="py-3">
            {/* Kept when collapsed too — the groups are how the rail is scanned, and dropping them
                left ten undifferentiated icons. One size and one margin in both states, so nothing
                resizes or moves when the rail toggles; `truncate` absorbs the narrower width. The
                margin matches the nav buttons' px-2.5, so the label lines up with the icons. */}
            <div
              className={cn(
                'text-xs font-semibold my-3 pr-2 text-muted-foreground truncate transition-[padding] duration-300 ease-in-out',
                open ? 'pl-2.5' : 'pl-5',
              )}
            >
              {group.type}
            </div>
            <div>
              {group.menus.map((menu) => {
                const isActive = menu.route === route;
                return (
                  <button
                    key={menu.name}
                    title={menu.name}
                    aria-current={isActive ? 'page' : undefined}
                    className={cn(
                      'w-full flex items-center pr-2.5 py-3 border-l-2 hover:bg-accent',
                      'transition-[padding,background-color,border-color] duration-300 ease-in-out',
                      open ? 'pl-2.5' : 'pl-5',
                      isActive ? 'bg-accent border-primary' : 'border-transparent',
                    )}
                    onClick={() => onNavigate(menu.route, menu.isOpenInNewTab)}
                  >
                    <span className="flex w-5 shrink-0 items-center justify-center">
                      <menu.icon
                        className={cn('w-5 h-5', isActive ? 'text-primary' : 'text-foreground')}
                        weight={isActive ? 'fill' : 'regular'}
                      />
                    </span>
                    {/* Always mounted. A conditional label pops in at full width the moment the
                        state flips; animating max-width and opacity lets it grow with the rail. */}
                    <span
                      className={cn(
                        'text-sm font-semibold truncate transition-all duration-300 ease-in-out',
                        open ? 'ml-3 max-w-40 opacity-100' : 'ml-0 max-w-0 opacity-0',
                        isActive ? 'text-primary' : 'text-foreground',
                      )}
                    >
                      {menu.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
    </div>
    <div className="shrink-0 border-t border-border p-3 flex justify-end">
      <button
        type="button"
        onClick={onToggle}
        title={open ? 'Collapse sidebar' : 'Expand sidebar'}
        aria-label={open ? 'Collapse sidebar' : 'Expand sidebar'}
        aria-expanded={open}
        className="flex h-8 w-8 items-center justify-center border border-border text-foreground hover:border-primary hover:bg-accent hover:text-primary"
      >
        <CaretDoubleRightIcon weight="bold" className={cn('w-4 h-4 transition-transform', open && 'rotate-180')} />
      </button>
    </div>
  </div>
);

interface IProps {
  children: ReactNode;
}

export const AppSidebar = ({ children }: IProps) => {
  const { route, push, query, back } = useRouter();
  const name = query?.name as string;

  // Starts closed so the server and the first client render agree. Reading localStorage or
  // window.innerWidth during render made them disagree, which is a hydration error, and left the
  // drawer collapsed on desktop because the width check had not run yet when useState captured it.
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(StorageKey.COLLAPSED);
    if (stored !== null) {
      setOpen(stored === 'true');
      return;
    }
    // No saved preference yet: follow the breakpoint until the user picks a side.
    const sync = () => setOpen(window.innerWidth >= LARGE_DEVICE_WIDTH);
    sync();
    window.addEventListener('resize', sync);
    return () => window.removeEventListener('resize', sync);
  }, []);

  const handleDrawerClick = () => {
    const next = !open;
    setOpen(next);
    localStorage.setItem(StorageKey.COLLAPSED, String(next));
  };

  const handleNavigate = (target: string, isOpenInNewTab?: boolean) => {
    if (isOpenInNewTab) {
      window.open(target, '_blank');
      return;
    }
    push(target);
    // On a phone the drawer sits over the page, so leaving it open hides the screen just opened.
    if (window.innerWidth < LARGE_DEVICE_WIDTH) setOpen(false);
  };

  const activeMenu = useMemo(() => ALL_MENUS.find((menu) => menu.route === route), [route]);
  const drawerProps = { open, route, onToggle: handleDrawerClick, onNavigate: handleNavigate };

  return (
    <div className="flex">
      {/* Mobile drawer overlay */}
      {open && <div className="fixed inset-0 bg-black/50 z-40 sm:hidden" onClick={handleDrawerClick} />}
      {/* Mobile drawer */}
      <aside
        className={`fixed top-0 left-0 h-full z-50 sm:hidden transition-transform duration-300 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{ width: DRAWER_WIDTH }}
      >
        <DrawerContent {...drawerProps} />
      </aside>
      {/* Desktop drawer */}
      <aside
        className="hidden sm:block flex-shrink-0 overflow-hidden transition-[width] duration-300 ease-in-out"
        style={{ width: open ? DRAWER_WIDTH : COLLAPSED_WIDTH }}
      >
        <div
          className="fixed top-0 left-0 h-full overflow-hidden transition-[width] duration-300 ease-in-out"
          style={{ width: open ? DRAWER_WIDTH : COLLAPSED_WIDTH }}
        >
          <DrawerContent {...drawerProps} />
        </div>
      </aside>
      {/* Main content */}
      <main className="flex-1 h-screen w-full">
        {/* Top bar */}
        <header className="sticky top-0 z-30 bg-background border-b border-border">
          <div className="flex justify-between items-center w-full px-4 h-16">
            <div className="flex items-center">
              <button
                aria-label="open drawer"
                onClick={handleDrawerClick}
                className={`hover:bg-transparent p-0 ${open ? 'hidden sm:hidden' : 'block sm:hidden'} mr-5`}
              >
                <Logo />
              </button>
            </div>
            <div className="w-full flex justify-between items-center space-x-2">
              <div className="text-lg font-bold capitalize flex items-center space-x-2">
                {activeMenu ? (
                  <>{name || activeMenu.name}</>
                ) : (
                  <Button
                    className="px-0"
                    leftsection={<CaretLeftIcon weight="bold" className="w-6 h-6" />}
                    isSubtle
                    onClick={back}
                  >
                    Back
                  </Button>
                )}
              </div>
              <div className="flex items-center">
                <ProfileDropdown />
              </div>
            </div>
          </div>
        </header>
        <div className="overflow-y-auto" style={{ height: 'calc(100vh - 64px)' }}>
          <div className="py-4 px-4 md:py-4 md:px-4 bg-muted min-h-full">{children}</div>
        </div>
      </main>
    </div>
  );
};
