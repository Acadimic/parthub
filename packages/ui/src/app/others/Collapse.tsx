import { cn } from '../../lib/cn';
import { useEffect, useRef, useState } from 'react';

interface IProps {
  isOpen: boolean;
  children: React.ReactNode;
  className?: string;
}

/**
 * Content that slides open and shut.
 *
 * The height is measured and transitioned in pixels, then released to `auto` once open so the
 * content can keep growing. Measuring is the price of a transition that runs the same in every
 * browser: the CSS-only `grid-template-rows: 0fr → 1fr` technique was tried first, and mid-transition
 * Chrome sized the grid box taller than its one track, leaving a blank band under the content.
 */
export const Collapse = ({ isOpen, children, className }: IProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState<number | 'auto'>(isOpen ? 'auto' : 0);
  // The last `isOpen` this component animated to. The first render already has the right resting
  // height, and comparing against the previous value — rather than a "first run" flag — also
  // survives StrictMode running the effect twice on mount.
  const animatedOpen = useRef(isOpen);

  useEffect(() => {
    const element = ref.current;
    if (!element || animatedOpen.current === isOpen) return undefined;
    animatedOpen.current = isOpen;
    if (isOpen) {
      setHeight(element.scrollHeight);
      return undefined;
    }
    // `auto` cannot transition to 0, so the current height is pinned first, through state so React
    // owns the style throughout: a value written straight to the element would be left behind when
    // React later saw the same prop and skipped the write. The collapse to 0 goes out two frames
    // later, once the pinned height has been committed and painted.
    setHeight(element.scrollHeight);
    let inner = 0;
    const outer = requestAnimationFrame(() => {
      inner = requestAnimationFrame(() => setHeight(0));
    });
    return () => {
      cancelAnimationFrame(outer);
      cancelAnimationFrame(inner);
    };
  }, [isOpen]);

  const handleTransitionEnd = (event: React.TransitionEvent<HTMLDivElement>) => {
    // Children have their own colour transitions, and their events bubble through here.
    if (event.target !== event.currentTarget || event.propertyName !== 'height') return;
    if (isOpen) setHeight('auto');
  };

  return (
    <div
      ref={ref}
      style={{ height }}
      onTransitionEnd={handleTransitionEnd}
      aria-hidden={!isOpen}
      className={cn(
        'overflow-hidden transition-[height,opacity] duration-200 ease-out motion-reduce:transition-none',
        isOpen ? 'opacity-100' : 'opacity-0',
        className,
      )}
    >
      {children}
    </div>
  );
};
