import { PageHeader } from '@components/app/headers';
import { ExploreSheet } from '@components/app/headers/explore';
import { LearnerNavigation } from '@components/app/navigations';
import { cn } from '@repo/ui/lib';

interface IProps {
  children: React.ReactNode;
  /**
   * Whether a phone gets the bottom tab bar. The browsing pages do; a course's preview and
   * learning view do not, so the content keeps the whole screen and the bar cannot pull the learner
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
  return (
    <div className="relative h-[100vh] overflow-auto bg-background">
      <div className="fixed top-0 z-50 w-full">
        <PageHeader />
      </div>
      <div className={cn('mt-14 sm:mt-16', withTabBar && 'pb-20 md:pb-0')}>{children}</div>
      {withTabBar ? (
        <div className="fixed bottom-0 z-[49] w-full border-t border-border bg-background px-2 pb-[env(safe-area-inset-bottom)] md:hidden">
          <LearnerNavigation />
        </div>
      ) : null}
      <ExploreSheet />
    </div>
  );
};
