import { ArrowsInIcon, ArrowsOutIcon, CubeIcon } from '@phosphor-icons/react';
import { type ReactNode, Suspense, useState } from 'react';
import { Button } from '../core/Button';
import { Modal } from '../core/Modal';
import { Spinner } from '../core/Spinner';
import { Tooltip } from '../core/Tooltip';
import { useCloseOnBack } from '../hooks/use-close-on-back.hook';
import { cn } from '../lib/cn';

/** The id the equation editor checks so a click inside the popup does not close it. */
export const VIEWER_3D_MODAL_ID = 'viewer-3d-modal';

export interface IViewer3DModalProps {
  title: string;
  isOpen: boolean;
  onClose: () => void;
  /** What is open, beside the cube in the footer: an equation, a scene's title and caption. */
  summary: ReactNode;
  /** Shown while the viewer's chunk loads: "Loading the 3D graph…". */
  loadingText: string;
  /** The lazy viewer; rendered only while the popup is open. */
  children: ReactNode;
}

/**
 * The popup a 3D graph or a 3D scene opens in: the viewer fills the body; the footer carries what
 * is open and, on larger screens, a full-screen toggle. It closes on the close button, Escape, a
 * click on the dimmed page, and the back button.
 *
 * Events are stopped at its root: React bubbles a portal's events through the component tree, so a
 * click on a slider would otherwise reach whatever holds the content — an answer option would be
 * selected by it.
 */
export const Viewer3DModal = ({ title, isOpen, onClose, summary, loadingText, children }: IViewer3DModalProps) => {
  const [isFullScreen, setIsFullScreen] = useState(false);
  // On a phone the back gesture is how a full-screen view is left; it closes the popup, not the page.
  useCloseOnBack(isOpen, onClose);
  const toggleLabel = isFullScreen ? 'Exit full screen' : 'Full screen';
  return (
    <Modal
      id={VIEWER_3D_MODAL_ID}
      position="center"
      isOpen={isOpen}
      onClose={onClose}
      className={cn(
        'h-[100dvh] w-screen max-w-none border-0',
        !isFullScreen && 'md:h-[min(860px,92vh)] md:w-[min(1280px,94vw)] md:border md:shadow-2xl',
      )}
      childrenClassName="min-h-0 p-3 md:p-4"
      title={title}
      footer={
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center bg-primary/10 text-primary">
            <CubeIcon weight="duotone" className="h-5 w-5" />
          </span>
          <div className="flex min-w-0 flex-1 flex-col">{summary}</div>
          <Tooltip title={toggleLabel}>
            <Button
              isSubtle
              aria-label={toggleLabel}
              aria-pressed={isFullScreen}
              onClick={() => setIsFullScreen(!isFullScreen)}
              className="hidden h-9 w-9 items-center justify-center p-0 md:flex"
            >
              {isFullScreen ? (
                <ArrowsInIcon weight="bold" className="h-5 w-5" />
              ) : (
                <ArrowsOutIcon weight="bold" className="h-5 w-5" />
              )}
            </Button>
          </Tooltip>
        </div>
      }
    >
      <div
        className="h-full"
        onClick={(event) => event.stopPropagation()}
        onPointerDown={(event) => event.stopPropagation()}
        onKeyDown={(event) => event.stopPropagation()}
      >
        {isOpen ? (
          <Suspense
            fallback={
              <div className="flex h-full min-h-[55vh] items-center justify-center gap-2 text-sm text-muted-foreground">
                <Spinner size="sm" /> {loadingText}
              </div>
            }
          >
            {children}
          </Suspense>
        ) : null}
      </div>
    </Modal>
  );
};
