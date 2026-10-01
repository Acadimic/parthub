import { Button, FullLogo, HamburgerIcon, Link, ToggleTheme } from '@repo/ui/app';
import { CaretDownIcon, MagnifyingGlassIcon } from '@phosphor-icons/react';
import { useSelectedUser } from '@stores';
import { ProfileDropdown } from '../sidebars/components';

const SearchBar = () => {
  return (
    <div className="w-full max-w-xl">
      <div className="flex items-center rounded-full bg-background border border-border">
        <input
          type="text"
          placeholder="Find courses, materials, papers"
          className="flex-1 pl-4 py-3 pr-0 text-sm bg-transparent outline-none rounded-l-full"
        />
        <button className="bg-primary hover:bg-primary/90 rounded-full p-2 mr-2" aria-label="search">
          <MagnifyingGlassIcon weight="bold" className="w-4 h-4 text-primary-foreground" />
        </button>
      </div>
    </div>
  );
};

export const PageHeader = () => {
  const selectedUser = useSelectedUser();

  return (
    <div>
      <header className="fixed top-0 left-0 right-0 z-40">
        <div className="bg-background px-4">
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
                  className="text-foreground px-3 ml-4 hover:border hover:border-border py-1.5"
                  rightsection={<CaretDownIcon weight="bold" className="w-4 h-4 text-foreground" />}
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
                {selectedUser ? (
                  <div>
                    <ProfileDropdown />
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <ToggleTheme />
                    <div className="hidden md:block">
                      <Link isSecondary className="text-foreground px-4 py-1.5" href="/sign-up">
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
        <hr className="border-border" />
      </header>
    </div>
  );
};
