import { useRouter } from 'next/router';
import { useLayoutEffect, useRef } from 'react';

/** How far down each history entry was left, by the key Next gives every entry. */
const positions = new Map<string, number>();

const getEntryKey = () => (window.history.state as { key?: string } | null)?.key ?? '';

/**
 * Scrolls the returned element to the top when the route's path changes, or back to where the page
 * was left when Back or Forward returns to it: a link opens a new entry, which has no position yet.
 * Every layout here scrolls its own container, so neither Next nor the browser does this. A change
 * to the query or hash alone keeps the position, so tab and filter state in the URL does not jump.
 */
export const useScrollTopOnNavigate = <T extends HTMLElement>() => {
  const ref = useRef<T>(null);
  const path = useRouter().asPath.split(/[?#]/)[0];

  useLayoutEffect(() => {
    const element = ref.current;
    if (!element) return undefined;
    element.scrollTo({ top: positions.get(getEntryKey()) ?? 0, left: 0 });

    const save = () => positions.set(getEntryKey(), element.scrollTop);
    element.addEventListener('scroll', save, { passive: true });
    return () => element.removeEventListener('scroll', save);
  }, [path]);

  return ref;
};
