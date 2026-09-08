import { AppSidebar } from '@components/app/sidebars';
import { FullScreenLoader } from '@repo/ui/app';
import { useUserLookups } from '@stores';
import { observer } from 'mobx-react-lite';
import { useEffect } from 'react';

interface IProps {
  children: React.ReactNode;
}

export const SidebarLayout = observer(({ children }: IProps) => {
  const userStore = useUserLookups();
  const isLoadedLoggedInUsers = userStore.isLoaded('loggedInUsers');

  const isLoaded = isLoadedInitialData && !isLoadingInitialData && isLoadedLoggedInUsers;

  useEffect(() => {
    if (!isLoadedInitialData && !isLoadingInitialData && isLoadedLoggedInUsers) loadInitialData();
  }, [isLoadedInitialData, isLoadingInitialData, isLoadedLoggedInUsers]);

  return (
    <>
      <AppSidebar>{!isLoaded ? <FullScreenLoader loading={isLoadingInitialData} withHeader /> : children}</AppSidebar>
    </>
  );
});
