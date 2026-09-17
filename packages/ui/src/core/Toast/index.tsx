import { CheckCircleIcon, InfoIcon, WarningIcon, XCircleIcon, XIcon } from '@phosphor-icons/react';
import type { ToastType } from '@repo/shared/interfaces';
import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react';
import { cn } from '../../lib/cn';

export interface IToastProps {
  type: ToastType;
  message: string;
  description?: string;
  /** Called once the exit transition has finished, so the row is not removed mid-animation. */
  onDismiss: () => void;
  /** How long it stays up, in ms. `0` keeps it until it is dismissed by hand. */
  duration?: number;
  className?: string;
}

/** Kept in step with `duration-200` below — the row stays mounted for as long as it is still moving. */
const EXIT_MS = 200;

/** Default time on screen. Long enough to read a sentence, short enough not to linger. */
const DEFAULT_DURATION_MS = 5000;

/**
 * Per-variant colour, used as an *accent* rather than as a wash.
 *
 * The first version tinted the whole card — `bg-success/15` over the page background, with the
 * message itself in `text-success`. At 15% the surface barely separated from the page, and coloured
 * body text on a coloured ground is the lowest-contrast pairing available. Here the card is a solid
 * `bg-popover` and the variant shows up only in the icon and the countdown bar, so the message sits
 * at full `text-foreground` contrast in both themes.
 */
const VARIANTS: Record<ToastType, { accent: string; bar: string; Icon: typeof CheckCircleIcon }> = {
  success: { accent: 'text-success', bar: 'bg-success', Icon: CheckCircleIcon },
  error: { accent: 'text-destructive', bar: 'bg-destructive', Icon: XCircleIcon },
  warning: { accent: 'text-warning', bar: 'bg-warning', Icon: WarningIcon },
  info: { accent: 'text-info', bar: 'bg-info', Icon: InfoIcon },
};

/**
 * One toast.
 *
 * Presentational, and it owns its own countdown. The queue and the store stay in the app, which is
 * what lets this live in the package at all: `packages/ui` may not read app state.
 */
export const Toast = ({
  type,
  message,
  description,
  onDismiss,
  duration = DEFAULT_DURATION_MS,
  className,
}: IToastProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const { accent, bar, Icon } = VARIANTS[type] ?? VARIANTS.info;

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  /** What is left of `duration` when paused, so resuming continues rather than restarts. */
  const remainingRef = useRef(duration);
  const resumedAtRef = useRef(0);
  const isClosingRef = useRef(false);
  /**
   * `onDismiss` is a fresh arrow on every parent render. Held in a ref so the countdown effect can
   * run once on mount: depending on the prop directly re-ran the effect on each render, and each
   * re-run cancelled the pending timer and started another — a toast that never dismissed.
   */
  const onDismissRef = useRef(onDismiss);
  onDismissRef.current = onDismiss;

  useEffect(() => {
    // A frame, not a timeout: the row has to paint in its off-screen position once before the
    // transition to the on-screen one can animate rather than jump.
    const frame = requestAnimationFrame(() => setIsVisible(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  const clearTimer = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    // Nulled, not just cleared: `resume` treats a non-null handle as "already counting" and would
    // refuse to start a replacement.
    timerRef.current = null;
  };

  const close = useCallback(() => {
    // Guard: the countdown and a click can both arrive, and two exits would fire `onDismiss` twice.
    if (isClosingRef.current) return;
    isClosingRef.current = true;
    clearTimer();
    setIsVisible(false);
    setTimeout(() => onDismissRef.current(), EXIT_MS);
  }, []);

  const resume = useCallback(() => {
    if (!duration || isClosingRef.current || timerRef.current) return;
    setIsPaused(false);
    resumedAtRef.current = Date.now();
    timerRef.current = setTimeout(close, Math.max(remainingRef.current, 0));
  }, [close, duration]);

  const pause = useCallback(() => {
    if (!timerRef.current) return;
    remainingRef.current -= Date.now() - resumedAtRef.current;
    clearTimer();
    setIsPaused(true);
  }, []);

  /**
   * The countdown lives here rather than in the store that queues the toast.
   *
   * A `setTimeout` fired at enqueue time cannot be stopped by anything the reader does — and the one
   * thing a reader reliably does with a message they are still reading is put the pointer on it.
   */
  useEffect(() => {
    resume();
    return clearTimer;
    // Mount only, deliberately: `resume` is stable and re-running this is exactly what the
    // `onDismissRef` above exists to prevent.
  }, []);

  return (
    <div
      // `alert` is assertive and interrupts a screen reader; only a failure earns that.
      role={type === 'error' ? 'alert' : 'status'}
      onMouseEnter={pause}
      onMouseLeave={resume}
      // Keyboard users never generate a hover, so focus has to hold it open too — otherwise a toast
      // can vanish between tabbing to its dismiss button and pressing it.
      onFocusCapture={pause}
      onBlurCapture={resume}
      className={cn(
        'group pointer-events-auto relative isolate flex w-full flex-col overflow-hidden',
        'border border-border bg-popover text-popover-foreground shadow-lg shadow-black/5',
        'transition-all duration-200 ease-out motion-reduce:transition-none',
        isVisible ? 'translate-y-0 scale-100 opacity-100' : 'translate-y-2 scale-[0.98] opacity-0',
        className,
      )}
    >
      <div className="flex items-start gap-2.5 px-3.5 py-3">
        <Icon weight="fill" className={cn('mt-px h-4 w-4 shrink-0', accent)} />

        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium leading-5 text-foreground">{message}</p>
          {description ? <p className="mt-0.5 text-xs leading-5 text-muted-foreground">{description}</p> : null}
        </div>

        <button
          type="button"
          onClick={close}
          aria-label="Dismiss notification"
          className={cn(
            'mt-px flex h-4 w-4 shrink-0 items-center justify-center text-muted-foreground',
            // Quiet until the toast is under the pointer, so a row of them stays calm.
            'opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100',
            'hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
          )}
        >
          <XIcon className="h-3.5 w-3.5" weight="bold" />
        </button>
      </div>

      {/* Time remaining. It doubles as the affordance for the pause: hovering visibly freezes it,
          which is how a reader learns the toast will wait for them. */}
      {duration ? (
        <span
          aria-hidden
          style={
            {
              '--toast-duration': `${duration}ms`,
              '--toast-play': isPaused ? 'paused' : 'running',
            } as CSSProperties
          }
          className={cn('h-0.5 w-full origin-left animate-toast-countdown motion-reduce:hidden', bar)}
        />
      ) : null}
    </div>
  );
};
