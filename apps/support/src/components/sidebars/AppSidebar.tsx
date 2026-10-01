import { StorageKey } from '@enums';
import { CaretDoubleRightIcon } from '@phosphor-icons/react';
import { useScrollTopOnNavigate } from '@repo/ui/hooks';
import { useRouter } from 'next/router';
import { type ReactNode, useEffect, useState } from 'react';
import { ProfileDropdown } from './components';
import { Routes } from './nav-list';

const drawerWidth = 240;

interface IProps {
  children: ReactNode;
}

export const AppSidebar = ({ children }: IProps) => {
  const scrollRef = useScrollTopOnNavigate<HTMLDivElement>();
  const [open, setOpen] = useState(false);

  /**
   * Resolves the drawer state: a stored preference wins, and with none the viewport decides.
   *
   * It has to run in an effect. `useState` reads its argument on the first render only, where
   * `isLargeDevice` was still false and `localStorage` is unreachable during SSR — so a desktop
   * visitor was pinned to the 65px rail however wide the window was, and the group headings and
   * wordmark were clipped against it. Re-reading the key on every resize rather than closing over
   * it keeps a later toggle from being undone by the next resize.
   *
   * The key is named COLLAPSED but stores whether the drawer is *open*, which `handleDrawerClick`
   * below writes the same way round.
   */
  useEffect(() => {
    const apply = () => {
      const collapsed = localStorage.getItem(StorageKey.COLLAPSED);
      setOpen(collapsed ? collapsed === 'true' : window.innerWidth >= 640);
    };
    apply();
    window.addEventListener('resize', apply);
    return () => window.removeEventListener('resize', apply);
  }, []);

  const { route, push } = useRouter();

  const isDark = typeof document !== 'undefined' && document.documentElement.classList.contains('dark');

  // The wordmark does not fit the 65px rail, so the square mark stands in for it when collapsed.
  const wordmarkSrc = isDark ? '/images/acadimic-dark.svg' : '/images/acadimic-light.svg';
  const markSrc = isDark ? '/images/logo-light.svg' : '/images/logo-dark.svg';

  const handleDrawerClick = () => {
    localStorage.setItem(StorageKey.COLLAPSED, open ? 'false' : 'true');
    setOpen(!open);
  };

  const DrawerContent = () => (
    <div className="bg-background min-h-screen flex flex-col justify-between items-stretch border-r border-border">
      <div className="grow">
        <div className={`flex items-end w-full space-x-2 p-4 h-16 ${open ? '' : 'justify-center px-0'}`}>
          <div>
            <img src={open ? wordmarkSrc : markSrc} alt="logo" className="h-7" />
          </div>
          {open && <div className="blue-gradient font-semibold text-xs">Support</div>}
        </div>
        <hr className="border-border" />
        <nav>
          {Routes.map((item) => (
            <div key={item.type} className="py-3">
              {open ? (
                <div className="text-xs font-semibold my-3 mx-5 text-muted-foreground truncate">{item.type}</div>
              ) : (
                <hr className="my-3 mx-4 border-border" />
              )}
              <div>
                {item.menus.map((menu) => (
                  <button
                    key={menu.name}
                    className="w-full flex items-center px-2.5 py-3 hover:bg-accent"
                    onClick={() => {
                      if (menu.isOpenInNewTab) {
                        window.open(menu.route, '_blank');
                      } else {
                        push(menu.route);
                      }
                    }}
                  >
                    <span
                      className={`flex items-center justify-center ${open ? 'mr-3' : 'mx-auto'}`}
                      style={{ minWidth: 0 }}
                    >
                      <menu.icon className={`w-5 h-5 ${menu.route === route ? 'text-primary' : 'text-foreground'}`} />
                    </span>
                    {open && (
                      <span
                        className={`text-sm font-semibold ${menu.route === route ? 'text-primary' : 'text-foreground'}`}
                      >
                        {menu.name}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </nav>
      </div>
      <div className="p-4 flex justify-end">
        <button onClick={handleDrawerClick} className="p-1 rounded hover:bg-accent">
          <CaretDoubleRightIcon
            weight="bold"
            className={`w-5 h-5 transition ${open ? 'rotate-180' : 'text-primary'}`}
          />
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex">
      {/* Mobile drawer overlay */}
      {open && <div className="fixed inset-0 bg-black/50 z-40 sm:hidden" onClick={handleDrawerClick} />}
      {/* Mobile drawer */}
      <aside
        className={`fixed top-0 left-0 h-full z-50 sm:hidden transition-transform duration-300 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{ width: drawerWidth }}
      >
        <DrawerContent />
      </aside>
      {/* Desktop drawer */}
      <aside
        className={`hidden sm:block flex-shrink-0 transition-all duration-300 overflow-hidden`}
        style={{ width: open ? drawerWidth : 65 }}
      >
        <div className="fixed top-0 left-0 h-full overflow-hidden" style={{ width: open ? drawerWidth : 65 }}>
          <DrawerContent />
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
                <img src={isDark ? '/images/logo-light.svg' : '/images/logo-dark.svg'} alt="logo" className="h-7" />
              </button>
            </div>
            <div className="w-full flex justify-between items-center space-x-2">
              <div className="text-lg font-bold capitalize">{route?.slice(1).split('-').join(' ')}</div>
              <div className="flex items-center">
                <ProfileDropdown />
              </div>
            </div>
          </div>
        </header>
        <div ref={scrollRef} className="overflow-y-auto" style={{ height: 'calc(100vh - 64px)' }}>
          <div className="py-4 px-4 md:py-4 md:px-4 bg-muted min-h-full">{children}</div>
        </div>
      </main>
    </div>
  );
};
