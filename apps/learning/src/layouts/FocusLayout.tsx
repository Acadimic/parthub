import { ExploreSheet } from '@components/app/headers/explore';

interface IProps {
  children: React.ReactNode;
}

/**
 * The learning view's shell: no app header and no tab bar, so the lesson has the whole screen and
 * the view's own top bar is the only chrome. The Explore sheet stays mounted for the search that
 * bar can open.
 */
// `dvh`, not `vh`: on a phone `100vh` counts the space behind the browser's address bar, so the
// shell was taller than the screen and the page scrolled by that much.
export const FocusLayout = ({ children }: IProps) => (
  <div className="h-[100dvh] overflow-hidden bg-background">
    {children}
    <ExploreSheet />
  </div>
);
