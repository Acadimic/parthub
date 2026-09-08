import { Button, FullLogo, HamburgerIcon, Link, ToggleTheme } from '@components/app';
import { CaretDownIcon, MagnifyingGlassIcon } from '@phosphor-icons/react';
import { useStores } from '@stores';
import { observer } from 'mobx-react-lite';
import { useRouter } from 'next/router';
import { ProfileDropdown } from '../sidebars/components';

const SearchBar = () => {
  return (
    <div className="w-full max-w-xl">
      <div className="flex items-center rounded-full bg-background-primary border border-color-border">
        <input
          type="text"
          placeholder="Find courses, materials, papers"
          className="flex-1 pl-4 py-3 pr-0 text-sm bg-transparent outline-none rounded-l-full"
        />
        <button className="bg-color-primary hover:bg-blue-700 rounded-full p-2 mr-2" aria-label="search">
          <MagnifyingGlassIcon weight="bold" className="w-4 h-4 text-color-opposite" />
        </button>
      </div>
    </div>
  );
};

export const PageHeader = observer(() => {
  const { route, push, query, back } = useRouter();
  const name = query?.name as string;
  const { selectorStore } = useStores();
  const { selectedUser } = selectorStore;

  return (
    <div>
      <header className="fixed top-0 left-0 right-0 z-40">
        <div className="bg-background-primary px-4">
          <div className="flex justify-between items-center w-full space-x-6 h-16">
            <div className="flex items-center space-x-3">
              <div className="flex md:hidden">
                <HamburgerIcon />
              </div>
              <div>
                <FullLogo className="h-12 md:h-8" />
              </div>
            </div>
            <div className="hidden md:block">
              <div>
                <Button
                  isSubtle
                  className="text-color-primary px-3 ml-4 hover:border hover:border-color-border py-1.5"
                  rightsection={<CaretDownIcon weight="bold" className="w-4 h-4 text-color-primary" />}
                >
                  Explore
                </Button>
              </div>
            </div>
            <div className="w-full flex justify-between items-center space-x-2">
              <div className="flex-1 items-center space-x-4 hidden md:flex">
                <SearchBar />
              </div>
              <div className="w-full flex justify-end items-center space-x-2 md:w-auto">
                <div>
                  <ToggleTheme />
                </div>
                {selectedUser ? (
                  <div>
                    <ProfileDropdown />
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <div className="hidden md:block">
                      <Link isSecondary className="text-color-primary px-4 py-1.5" href="/sign-up">
                        Sign Up
                      </Link>
                    </div>
                    <Link href="/sign-in">Sign In</Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        <hr className="border-color-border" />
      </header>
    </div>
  );
});
