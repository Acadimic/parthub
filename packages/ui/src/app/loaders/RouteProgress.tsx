import Router from 'next/router';
import { useEffect, useState } from 'react';

import { cn } from '../../lib/cn';

type Phase = 'idle' | 'loading' | 'done';

/** A navigation that finishes inside this window never shows the bar, so fast pages do not flicker. */
const SHOW_DELAY_MS = 150;
const FADE_MS = 300;

const PHASE_CLASSES: Record<Phase, string> = {
  idle: 'w-0 opacity-0',
  // Long and easing out, so the bar keeps creeping without ever reaching the end on its own. An
  // arbitrary property, because `duration-[…]` is ambiguous with tailwindcss-animate and never emits.
  loading: 'w-[85%] opacity-100 transition-[width] ease-out [transition-duration:8000ms]',
  done: 'w-full opacity-0 transition-[width,opacity] duration-300',
};

/**
 * A thin bar along the top of the viewport while a Pages Router navigation is pending, so a click
 * that is waiting on page data visibly registered. Shallow route changes are ignored.
 */
export const RouteProgress = () => {
  const [phase, setPhase] = useState<Phase>('idle');

  useEffect(() => {
    let current: Phase = 'idle';
    let showTimer: ReturnType<typeof setTimeout> | undefined;
    let hideTimer: ReturnType<typeof setTimeout> | undefined;
    const show = (next: Phase) => {
      current = next;
      setPhase(next);
    };

    const onStart = (_url: string, { shallow }: { shallow: boolean }) => {
      if (shallow) return;
      clearTimeout(hideTimer);
      // A second click cancels the pending one; the bar carries on rather than restarting.
      if (current === 'loading') return;
      if (current === 'done') show('idle');
      clearTimeout(showTimer);
      showTimer = setTimeout(() => show('loading'), SHOW_DELAY_MS);
    };
    const onEnd = () => {
      clearTimeout(showTimer);
      if (current === 'idle') return;
      show('done');
      hideTimer = setTimeout(() => show('idle'), FADE_MS);
    };
    // Next reports the cancelled navigation just before it starts the new one.
    const onError = (error: Error & { cancelled?: boolean }) => {
      if (!error.cancelled) onEnd();
    };

    Router.events.on('routeChangeStart', onStart);
    Router.events.on('routeChangeComplete', onEnd);
    Router.events.on('routeChangeError', onError);
    // A click on an in-page anchor can cancel a navigation without starting another.
    Router.events.on('hashChangeComplete', onEnd);
    return () => {
      clearTimeout(showTimer);
      clearTimeout(hideTimer);
      Router.events.off('routeChangeStart', onStart);
      Router.events.off('routeChangeComplete', onEnd);
      Router.events.off('routeChangeError', onError);
      Router.events.off('hashChangeComplete', onEnd);
    };
  }, []);

  return (
    <div aria-hidden className="pointer-events-none fixed inset-x-0 top-0 z-[3000] h-0.5">
      <div className={cn('h-full bg-primary', PHASE_CLASSES[phase])} />
    </div>
  );
};
