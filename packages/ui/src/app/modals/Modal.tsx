import { PositionType } from '@repo/shared/enums';
import { XIcon } from '@phosphor-icons/react';
import * as React from 'react';
import { cn } from '../../lib/cn';

interface IProps {
  isOpen: boolean;
  onClose: () => void;
  component: React.ReactNode;
  title?: string;
  /** One line under the title saying what the dialog is for, or what saving will do. */
  description?: string;
  id?: string;
  isLoading?: boolean;
  footer?: React.ReactNode;
  className?: string;
  position?: PositionType;
  withoutClose?: boolean;
  childrenClassName?: string;
}

/** Below this width every position collapses to a bottom sheet, which is what a thumb can reach. */
const MOBILE_MAX_WIDTH = 768;

/**
 * The frame's position and enter animation, per anchor.
 *
 * The wrapper places the panel; the panel animates. They are separate elements because the centred
 * dialog is positioned with a `translateX(-50%)`, and an animated `transform` on the same element
 * would overwrite it mid-flight.
 */
const FRAMES: Record<PositionType, { wrapper: string; panel: string; defaultWidth: string }> = {
  [PositionType.TOP]: {
    wrapper: 'left-1/2 top-[8%] -translate-x-1/2 max-h-[84vh]',
    panel: 'rounded-xl animate-zoom-in',
    defaultWidth: 'w-[calc(100%-2rem)] md:w-[60%] lg:w-[40%]',
  },
  [PositionType.RIGHT]: {
    wrapper: 'inset-y-0 right-0',
    panel: 'h-full md:rounded-l-2xl animate-slide-in-right',
    defaultWidth: 'w-full md:max-w-[60%] lg:max-w-[40%]',
  },
  [PositionType.LEFT]: {
    wrapper: 'inset-y-0 left-0',
    panel: 'h-full md:rounded-r-2xl animate-slide-in-left',
    defaultWidth: 'w-full md:max-w-[60%] lg:max-w-[40%]',
  },
  [PositionType.BOTTOM]: {
    wrapper: 'inset-x-0 bottom-0 max-h-[92vh]',
    panel: 'rounded-t-2xl animate-slide-in-bottom',
    defaultWidth: 'w-full',
  },
};

/**
 * A dialog or drawer, depending on `position`.
 *
 * Renders nothing while closed, so a caller may keep it mounted and toggle `isOpen`. While open it
 * owns the page: the backdrop blocks and blurs, the body cannot scroll behind it, Escape closes it
 * (unless a save is in flight or the caller made it modal with `withoutClose`), and it announces
 * itself as a dialog labelled by its title.
 */
export function Modal({
  isOpen,
  onClose,
  component,
  id,
  title,
  description,
  isLoading,
  footer,
  className,
  position,
  withoutClose,
  childrenClassName,
}: IProps) {
  const titleId = React.useId();
  // Read once on the client and kept in step with resizes. Lazy so the first client render is
  // already right; the server never renders an open modal, so there is nothing to mismatch.
  const [isMobile, setIsMobile] = React.useState(
    () => typeof window !== 'undefined' && window.innerWidth <= MOBILE_MAX_WIDTH,
  );
  const canClose = !isLoading && !withoutClose;

  React.useEffect(() => {
    const update = () => setIsMobile(window.innerWidth <= MOBILE_MAX_WIDTH);
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  React.useEffect(() => {
    if (!isOpen) return;
    // Nested modals each lock and restore; the last one to close is the one that unlocks, because
    // it restores what it found, which is what the outer one set.
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKeyDown = (event: KeyboardEvent) => {
      // A control inside the dialog that consumed the key — an open select list, say — marks it
      // handled with `preventDefault`; that Escape closes the list, not the dialog around it.
      if (event.key === 'Escape' && canClose && !event.defaultPrevented) {
        event.stopPropagation();
        onClose();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [isOpen, canClose, onClose]);

  if (!isOpen) return null;

  const anchor = isMobile ? PositionType.BOTTOM : (position ?? PositionType.TOP);
  const frame = FRAMES[anchor];

  return (
    <div className="fixed inset-0 z-[1300]" id={id}>
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-[2px] animate-fade-in"
        onClick={() => canClose && onClose()}
        aria-hidden="true"
      />
      <div className={cn('absolute flex', frame.wrapper, className ?? frame.defaultWidth)}>
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby={title ? titleId : undefined}
          className={cn(
            'flex w-full max-h-full flex-col overflow-hidden bg-background text-foreground shadow-2xl ring-1 ring-border',
            frame.panel,
          )}
        >
          {title || !withoutClose ? (
            <div className="flex items-start justify-between gap-4 border-b border-border px-5 py-4">
              <div className="min-w-0">
                {title ? (
                  <h2 id={titleId} className="truncate text-base font-semibold leading-6">
                    {title}
                  </h2>
                ) : null}
                {description ? <p className="mt-0.5 text-sm text-muted-foreground">{description}</p> : null}
              </div>
              {!withoutClose && (
                <button
                  type="button"
                  aria-label="Close"
                  disabled={isLoading}
                  className="-mr-1.5 -mt-1 shrink-0 rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
                  onClick={onClose}
                >
                  <XIcon weight="bold" className="h-4 w-4" />
                </button>
              )}
            </div>
          ) : null}
          <div className={cn('min-h-[20vh] flex-1 overflow-y-auto', childrenClassName ?? 'px-5 py-4')}>{component}</div>
          {footer ? <div className="border-t border-border bg-background px-5 py-3">{footer}</div> : null}
        </div>
      </div>
    </div>
  );
}
