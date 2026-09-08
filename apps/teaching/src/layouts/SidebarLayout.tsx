import { AppSidebar } from '@components/app/sidebars';
import { FullScreenLoader } from '@repo/ui/app';
import { useRequest } from '@repo/ui/hooks';
import { useStandardStore, useUserLookups } from '@stores';
import { useEffect } from 'react';

interface IProps {
  children: React.ReactNode;
}

export const SidebarLayout = ({ children }: IProps) => {
  const userStore = useUserLookups();
  const isLoadedLoggedInUsers = userStore.isLoaded('loggedInUsers');
  const initialData = useRequest(useStandardStore, 'initialData');
  const loadInitialData = useStandardStore((state) => state.loadInitialData);

  const isLoaded = initialData.isLoaded && !initialData.isLoading && isLoadedLoggedInUsers;

  // The sign-in data has to land first: the reference load is org-scoped, so it needs a selected org.
  useEffect(() => {
    if (isLoadedLoggedInUsers && useStandardStore.getState().shouldLoad('initialData')) loadInitialData();
  }, [isLoadedLoggedInUsers, loadInitialData]);

  return (
    <AppSidebar>{!isLoaded ? <FullScreenLoader loading={initialData.isLoading} withHeader /> : children}</AppSidebar>
  );
};
