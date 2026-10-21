import { CubeIcon } from '@phosphor-icons/react';
import { type RefObject, useEffect, useState } from 'react';
import { Spinner } from '../core/Spinner';

/** Narrower than this (a two-up answer option), a scene or graph opens from a button instead. */
export const INLINE_MIN_WIDTH = 320;

/** True while `ref` is within a screen of the viewport, so only nearby views hold a WebGL context. */
export const useIsNearViewport = (ref: RefObject<HTMLElement | null>): boolean => {
  const [isNear, setIsNear] = useState(false);
  useEffect(() => {
    const element = ref.current;
    if (!element) return undefined;
    const observer = new IntersectionObserver(([entry]) => setIsNear(entry.isIntersecting), {
      rootMargin: '100% 0px',
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, [ref]);
  return isNear;
};

/** The element's width, followed as it changes; 0 until measured. */
export const useWidth = (ref: RefObject<HTMLElement | null>): number => {
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const element = ref.current;
    if (!element) return undefined;
    const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    observer.observe(element);
    return () => observer.disconnect();
  }, [ref]);
  return width;
};

/** Holds an inline view's place, at its height, while it loads or while it is far off screen. */
export const InlinePlaceholder = ({ loadingText }: { loadingText: string | null }) => (
  <div className="flex h-72 items-center justify-center gap-2 border border-border bg-muted/40 text-sm text-muted-foreground sm:h-96">
    {loadingText ? (
      <>
        <Spinner size="sm" /> {loadingText}
      </>
    ) : (
      <CubeIcon weight="duotone" className="h-8 w-8 opacity-40" />
    )}
  </div>
);
