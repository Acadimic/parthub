import { PageFooter } from '@components/app/footers';
import { PageLayout } from './PageLayout';

interface IProps {
  children: React.ReactNode;
}

export const PublicLayout = ({ children }: IProps) => {
  return (
    <PageLayout withTabBar>
      {children}
      <PageFooter />
    </PageLayout>
  );
};
