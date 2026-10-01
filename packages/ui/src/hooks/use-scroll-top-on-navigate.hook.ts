import { useRouter } from 'next/router';
import { useLayoutEffect, useRef } from 'react';

/**
 * Scrolls the returned element back to the top whenever the route's path changes. Next resets
 * only the window, and every layout here scrolls its own container, which stays mounted across
 * pages. A change to the query or hash alone keeps the position, so tab and filter state written
 * to the URL does not jump the page.
 */
export const useScrollTopOnNavigate = <T extends HTMLElement>() => {
  const ref = useRef<T>(null);
  const path = useRouter().asPath.split(/[?#]/)[0];

  useLayoutEffect(() => {
    ref.current?.scrollTo({ top: 0, left: 0 });
  }, [path]);

  return ref;
};
