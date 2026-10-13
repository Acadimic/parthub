import { useEffect, useRef, useState } from 'react';

/** How far across the reader the back and forward zones reach from each edge. */
const EDGE_ZONE = 0.28;
/** A touch that lasts longer or travels further than this is a scroll or a long press, not a tap. */
const TAP_MAX_MS = 350;
const TAP_MAX_TRAVEL_PX = 10;

/**
 * The box a tap's position is read against. The page wrapper carries it, and so does each
 * full-screen surface, which is pinned over the whole viewport yet sits inside the wrapper in the
 * DOM — measured against the wrapper, a tap at the screen's edge would land outside both zones.
 */
export const READER_SURFACE_ATTR = 'data-reader-surface';

/**
 * Controls that read the arrow keys themselves: a field's caret, a tab strip's or menu's roving
 * focus, a player's seek. With one of these focused the keys are theirs, not the reader's.
 */
const ARROW_KEY_OWNERS =
  'input, textarea, select, [contenteditable="true"], audio, video, iframe, [role="tablist"], [role="tab"], [role="menu"], [role="menuitem"], [role="listbox"], [role="option"], [role="slider"], [role="radiogroup"]';

/** Things a tap means to operate rather than to turn the page. */
const INTERACTIVE =
  'a, button, input, select, textarea, audio, video, iframe, summary, label, [role="button"], [contenteditable="true"]';

export type ReaderEdge = 'left' | 'right';

interface IReaderGestures {
  onNext: () => void;
  onPrevious: () => void;
}

/**
 * The reader's game-pad: a tap on the right edge turns forward, one on the left turns back, and
 * the arrow keys do the same from a keyboard. Touch and pen only for the taps — a mouse click in
 * the margin is how a reader starts a text selection, so it stays a click. A tap on anything
 * interactive, or while text is selected, is left to its target.
 */
export const useReaderGestures = ({ onNext, onPrevious }: IReaderGestures) => {
  const start = useRef<{ x: number; y: number; at: number } | null>(null);
  // Read at key time, so the window listener is registered once rather than on every render.
  const moves = useRef({ onNext, onPrevious });
  moves.current = { onNext, onPrevious };
  const [flash, setFlash] = useState<ReaderEdge | null>(null);
  const [tapCount, setTapCount] = useState(0);

  const turn = (edge: ReaderEdge) => {
    setFlash(edge);
    setTapCount((count) => count + 1);
    if (edge === 'right') moves.current.onNext();
    else moves.current.onPrevious();
  };

  useEffect(() => {
    if (!flash) return;
    const timer = window.setTimeout(() => setFlash(null), 450);
    return () => window.clearTimeout(timer);
  }, [flash, tapCount]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return;
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      if (document.activeElement?.closest(ARROW_KEY_OWNERS)) return;
      event.preventDefault();
      turn(event.key === 'ArrowRight' ? 'right' : 'left');
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const onPointerDownCapture = (event: React.PointerEvent<HTMLElement>) => {
    if (event.pointerType !== 'touch' && event.pointerType !== 'pen') return;
    start.current = { x: event.clientX, y: event.clientY, at: Date.now() };
  };

  const onPointerUpCapture = (event: React.PointerEvent<HTMLElement>) => {
    const began = start.current;
    start.current = null;
    if (!began) return;
    const travelled = Math.hypot(event.clientX - began.x, event.clientY - began.y);
    if (Date.now() - began.at > TAP_MAX_MS || travelled > TAP_MAX_TRAVEL_PX) return;
    const target = event.target as HTMLElement | null;
    if (target?.closest(INTERACTIVE)) return;
    if (window.getSelection()?.toString()) return;
    const surface = target?.closest(`[${READER_SURFACE_ATTR}]`) ?? event.currentTarget;
    const bounds = surface.getBoundingClientRect();
    const across = (event.clientX - bounds.left) / bounds.width;
    if (across >= 1 - EDGE_ZONE) turn('right');
    else if (across <= EDGE_ZONE) turn('left');
  };

  const onPointerCancelCapture = () => {
    start.current = null;
  };

  return {
    /** Spread onto the element the pages sit in. */
    handlers: { onPointerDownCapture, onPointerUpCapture, onPointerCancelCapture },
    /** The edge last tapped, for the moment its flash is showing. */
    flash,
    /** How many taps have turned a page, so a first-use hint knows when it has been understood. */
    tapCount,
  };
};
