import { type ReactNode, useLayoutEffect, useRef, useState } from 'react';

/**
 * Places a short page in the middle of its scrolling frame, and keeps it there only until the
 * learner first touches it. Growth before that — a picture loading — is re-centred; growth after
 * it — an answer opening, a feedback line, a flashcard turning — extends the page downward, because
 * re-centring then would move everything the learner is looking at up and down on each tap. A page
 * taller than its frame starts at the top. The frame is the nearest parent element.
 */
export const CenteredOnce = ({ children, className }: { children: ReactNode; className?: string }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [offset, setOffset] = useState(0);
  useLayoutEffect(() => {
    const element = ref.current;
    const frame = element?.parentElement;
    if (!element || !frame) return undefined;
    const measure = () => setOffset(Math.max(0, Math.floor((frame.clientHeight - element.offsetHeight) / 2)));
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    observer.observe(frame);
    const freeze = () => observer.disconnect();
    element.addEventListener('pointerdown', freeze, { once: true });
    element.addEventListener('keydown', freeze, { once: true });
    return () => {
      observer.disconnect();
      element.removeEventListener('pointerdown', freeze);
      element.removeEventListener('keydown', freeze);
    };
  }, []);
  return (
    <div ref={ref} className={className} style={{ marginTop: offset }}>
      {children}
    </div>
  );
};
