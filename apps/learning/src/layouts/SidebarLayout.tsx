import { AppSidebar } from '@components/app/sidebars';
import { FullScreenLoader } from '@repo/ui/app';
import { useStores } from '@stores';
import { observer } from 'mobx-react-lite';
import { useEffect } from 'react';

interface IProps {
  children: React.ReactNode;
}

export const SidebarLayout = observer(({ children }: IProps) => {
  const { isLoadingInitialData, isLoadedInitialData, loadInitialData, userStore } = useStores();
  const { isLoadedLoggedInUsers } = userStore;

  useEffect(() => {
    if (!isLoadedInitialData && !isLoadingInitialData && isLoadedLoggedInUsers) loadInitialData();
  }, [isLoadedInitialData, isLoadingInitialData, isLoadedLoggedInUsers]);

  return (
    <>
      <AppSidebar>
        {isLoadingInitialData ? <FullScreenLoader loading={isLoadingInitialData} withHeader /> : children}
      </AppSidebar>
    </>
  );
});
