import { useRouter } from 'next/router';
import { useEffect, useRef } from 'react';

/**
 * The open overlays that close on back, newest last. Next allows one `beforePopState` handler, so
 * a graph opened inside a full-screen exam would otherwise replace the exam's handler, and closing
 * the graph would leave back with no handler at all: it would leave the page with the exam open.
 */
const openOverlays: { current: () => void }[] = [];

/**
 * While `isOpen`, the browser or device back button calls `onClose` and keeps the page where it
 * is instead of leaving it. With several open, back closes the newest first. Nothing is registered
 * while closed, so back behaves normally then.
 */
export const useCloseOnBack = (isOpen: boolean, onClose: () => void) => {
  const router = useRouter();
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!isOpen) return;
    const entry = { current: () => onCloseRef.current() };
    openOverlays.push(entry);
    router.beforePopState(() => {
      const newest = openOverlays[openOverlays.length - 1];
      if (!newest) return true;
      newest.current();
      router.push(router.asPath, undefined, { shallow: true });
      return false;
    });
    return () => {
      const index = openOverlays.indexOf(entry);
      if (index >= 0) openOverlays.splice(index, 1);
      if (!openOverlays.length) router.beforePopState(() => true);
    };
  }, [isOpen, router]);
};
