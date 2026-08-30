import { AppSidebar } from '@components/sidebars';
import { observer } from 'mobx-react-lite';

interface IProps {
  children: React.ReactNode;
}

export const SidebarLayout = observer(({ children }: IProps) => {
  return (
    <>
      <AppSidebar>{children}</AppSidebar>
    </>
  );
});
