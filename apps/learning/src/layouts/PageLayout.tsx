import { PageHeader } from '@components/app/headers';
import { ExploreSheet } from '@components/app/headers/explore';
import { LearnerNavigation } from '@components/app/navigations';
import { cn } from '@repo/ui/lib';
import { useSelectedUser } from '@stores';

interface IProps {
  children: React.ReactNode;
  /**
   * Whether a phone gets the bottom tab bar. The browsing pages and a course's preview do; the
   * learning view does not, so a lesson keeps the whole screen and the bar cannot pull the learner
   * out mid-lesson.
   */
  withTabBar: boolean;
}

/**
 * The learner shell: the fixed header, and on a phone the bottom tab bar plus the Explore sheet it
 * opens. On wider screens the primary routes and Explore live in the header, so the bar is hidden
 * and the bottom padding that makes room for it goes with it.
 */
export const PageLayout = ({ children, withTabBar }: IProps) => {
  const selectedUser = useSelectedUser();
  // Every tab but Home needs an account, so a visitor gets the header's Sign In instead of a bar.
  const hasTabBar = withTabBar && Boolean(selectedUser);
  return (
    <div className="relative h-[100vh] overflow-auto bg-background">
      <div className="fixed top-0 z-50 w-full">
        <PageHeader />
      </div>
      <div className={cn('mt-14 sm:mt-16', hasTabBar && 'pb-24 md:pb-0')}>{children}</div>
      {hasTabBar ? (
        <div className="pointer-events-none fixed inset-x-0 bottom-0 z-[49] md:hidden">
          <LearnerNavigation />
        </div>
      ) : null}
      <ExploreSheet />
    </div>
  );
};
