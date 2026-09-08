import { Button, FullLogo, Logo, ToggleTheme } from '@parthhub/ui/app';
import { StorageKey } from '@enums';
import { CaretDoubleRightIcon, CaretLeftIcon } from '@phosphor-icons/react';
import { observer } from 'mobx-react-lite';
import { useRouter } from 'next/router';
import { ReactNode, useEffect, useMemo, useState } from 'react';
import { ProfileDropdown } from './components';
import { Routes } from './nav-list';

const drawerWidth = 240;

interface IProps {
  children: ReactNode;
}

export const AppSidebar = observer(({ children }: IProps) => {
  const [isLargeDevice, setIsLargeDevice] = useState(false);

  useEffect(() => {
    const check = () => setIsLargeDevice(window.innerWidth >= 640);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const collapsed = typeof window !== 'undefined' ? localStorage.getItem(StorageKey.COLLAPSED) : null;
  const isOpen = collapsed ? collapsed === 'true' : isLargeDevice;
  const [open, setOpen] = useState<boolean>(isOpen);
  const { route, push, query, back } = useRouter();
  const name = query?.name as string;

  const handleDrawerClick = () => {
    localStorage.setItem(StorageKey.COLLAPSED, open ? 'false' : 'true');
    setOpen(!open);
  };

  const allRoutes = useMemo(() => {
    const routes: string[] = [];
    Routes.forEach((item) => {
      item.menus.forEach((menu) => {
        routes.push(menu.route);
      });
    });
    return routes;
  }, []);

  const DrawerContent = () => (
    <div className="bg-background-primary min-h-screen flex flex-col justify-between items-stretch">
      <div className="grow">
        <div className="flex items-end w-full space-x-2 p-4 h-16">
          <FullLogo />
          <div className="blue-gradient font-semibold text-xs">Learning</div>
        </div>
        <hr className="border-color-border" />
        <nav>
          {Routes.map((item) => (
            <div key={item.type} className="py-3">
              <div className="text-xs font-semibold my-3 mx-5 text-color-secondary truncate">{item.type}</div>
              <div>
                {item.menus.map((menu) => (
                  <button
                    key={menu.name}
                    className="w-full flex items-center px-2.5 py-3 hover:bg-background-secondary"
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
                      <menu.icon
                        className={`w-5 h-5 ${menu.route === route ? 'text-blue-primary' : 'text-color-primary'}`}
                      />
                    </span>
                    {open && (
                      <span className={`text-sm font-semibold ${menu.route === route ? 'blue-gradient' : ''}`}>
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
        <button onClick={handleDrawerClick} className="p-1 rounded hover:bg-background-secondary">
          <CaretDoubleRightIcon
            weight="bold"
            className={`w-5 h-5 transition ${open ? 'rotate-180' : 'text-blue-primary'}`}
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
        <header className="sticky top-0 z-30 bg-background-primary border-b border-color-border">
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
                {allRoutes.includes(route) ? (
                  <>{name || route?.slice(1).split('-').join(' ')}</>
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
        <div className="overflow-y-auto" style={{ height: 'calc(100vh - 64px)' }}>
          <div className="py-4 px-4 md:py-4 md:px-4 bg-background-secondary min-h-full">{children}</div>
        </div>
      </main>
    </div>
  );
});
