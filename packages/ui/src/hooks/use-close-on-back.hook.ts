import Router from 'next/router';
import { useEffect, useRef } from 'react';

/**
 * The open overlays that close on back, newest last. Next allows one `beforePopState` handler, so
 * a graph opened inside a full-screen exam would otherwise replace the exam's handler, and closing
 * the graph would leave back with no handler at all: it would leave the page with the exam open.
 */
const openOverlays: { current: () => void }[] = [];

/** Set while stepping forward again after a back that closed an overlay, so that step is ignored. */
let isReturning = false;

/**
 * By the time Next asks, the browser has already gone back one entry. Closing the overlay and
 * stepping forward returns to the entry the page was on, so the history keeps every page.
 */
const onPopState = () => {
  if (isReturning) return false;
  const newest = openOverlays[openOverlays.length - 1];
  if (!newest) return true;
  newest.current();
  isReturning = true;
  // Cleared after Next's own listener, which may skip this handler for that step altogether.
  window.addEventListener('popstate', () => (isReturning = false), { once: true });
  window.history.forward();
  return false;
};

/**
 * While `isOpen`, the browser or device back button calls `onClose` and keeps the page where it
 * is instead of leaving it. With several open, back closes the newest first. With none open, back
 * behaves normally.
 */
export const useCloseOnBack = (isOpen: boolean, onClose: () => void) => {
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!isOpen) return;
    Router.beforePopState(onPopState);
    const entry = { current: () => onCloseRef.current() };
    openOverlays.push(entry);
    return () => {
      const index = openOverlays.indexOf(entry);
      if (index >= 0) openOverlays.splice(index, 1);
    };
  }, [isOpen]);
};
