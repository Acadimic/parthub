import type { IToast } from '@repo/shared/interfaces';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Toast } from '../../core/Toast';
import { cn } from '../../lib/cn';

export interface IToastStackProps {
  toasts: IToast[];
  onDismiss: (id: number) => void;
  className?: string;
}

/**
 * The toast layer.
 *
 * Two things here are load-bearing, and both were the bug rather than the styling.
 *
 * **It portals to `document.body`.** Rendered in place, a toast is only ever as high as the
 * stacking context it happens to sit in — any ancestor with a `z-index`, `transform`, `filter` or
 * non-1 `opacity` traps it, and no value on the toast itself can climb out. A portal puts it in the
 * root context, where its own `z-index` is the whole story.
 *
 * **It sits above every other layer.** The previous `z-50` was the *lowest* tier in the app: below
 * the modals (`z-[1300]`), the menus (`z-[1500]`) and the offline banner (`z-[2000]`). A toast
 * raised while a modal was open — which is exactly when a save reports its result — rendered
 * behind that modal and was never seen. Feedback about an action has to outrank the surface the
 * action was taken on, so it goes on top of all of them.
 *
 * The stack is `pointer-events-none` and each toast re-enables them, so the strip never swallows a
 * click meant for the page beneath it.
 *
 * Anchored bottom-left. Newest is appended last and so sits closest to the corner, with older ones
 * pushed up — the arrival is always in the same place, which is what makes a second toast readable
 * rather than a surprise.
 */
export const ToastStack = ({ toasts, onDismiss, className }: IToastStackProps) => {
  const [isMounted, setIsMounted] = useState(false);

  // The Pages Router renders this on the server too, where there is no `document` to portal into.
  useEffect(() => setIsMounted(true), []);
  if (!isMounted || !toasts.length) return null;

  return createPortal(
    <div
      aria-live="polite"
      aria-relevant="additions"
      className={cn(
        'pointer-events-none fixed bottom-4 left-4 z-[3000] flex w-[min(24rem,calc(100vw-2rem))] flex-col gap-2',
        className,
      )}
    >
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          type={toast.type}
          message={toast.message}
          description={toast.description}
          onDismiss={() => onDismiss(toast.id)}
        />
      ))}
    </div>,
    document.body,
  );
};
