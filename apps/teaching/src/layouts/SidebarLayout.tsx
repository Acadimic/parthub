import { AppSidebar } from '@components/app/sidebars';
import { FullScreenLoader } from '@parthhub/ui/app';
import { useStores } from '@stores';
import { observer } from 'mobx-react-lite';
import { useEffect } from 'react';

interface IProps {
  children: React.ReactNode;
}

export const SidebarLayout = observer(({ children }: IProps) => {
  const { isLoadingInitialData, isLoadedInitialData, loadInitialData, userStore } = useStores();
  const { isLoadedLoggedInUsers } = userStore;

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
