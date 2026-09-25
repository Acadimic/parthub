import { PageLayout } from './PageLayout';

interface IProps {
  children: React.ReactNode;
}

export const PageNavigationLayout = ({ children }: IProps) => {
  return <PageLayout withTabBar>{children}</PageLayout>;
};
