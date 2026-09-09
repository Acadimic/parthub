import { AppSidebar } from '@components/sidebars';

interface IProps {
  children: React.ReactNode;
}

export const SidebarLayout = ({ children }: IProps) => {
  return (
    <>
      <AppSidebar>{children}</AppSidebar>
    </>
  );
};
