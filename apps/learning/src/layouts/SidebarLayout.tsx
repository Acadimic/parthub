import { AppSidebar } from '@components/app/sidebars';
import { FullScreenLoader } from '@repo/ui/app';
import { useRequest } from '@repo/ui/hooks';
import { useStandardStore } from '@stores';

interface IProps {
  children: React.ReactNode;
}

/** `_app` loads the catalogue for every visitor; this only holds the page while it is in flight. */
export const SidebarLayout = ({ children }: IProps) => {
  const publicData = useRequest(useStandardStore, 'publicData');

  return <AppSidebar>{publicData.isLoading ? <FullScreenLoader loading withHeader /> : children}</AppSidebar>;
};
