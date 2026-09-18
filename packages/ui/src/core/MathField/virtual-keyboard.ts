import { useEffect, useState } from 'react';

/**
 * The part of MathLive's on-screen keyboard this package uses.
 *
 * MathLive installs the keyboard as a global on `window` once a field has loaded; it is not exported
 * from the module. Declared locally rather than imported so nothing here has to load MathLive to
 * type-check, and so the read-only surfaces that never mount a field stay free of it.
 */
export interface IVirtualKeyboard extends EventTarget {
  visible: boolean;
  show: () => void;
  hide: () => void;
  /** Where the keyboard is drawn, in viewport coordinates; zero-sized while hidden. */
  boundingRect: DOMRect;
}

/**
 * Dispatched on `window` by `MathField` once MathLive has loaded and the keyboard global exists.
 * A component that mounts before the first field (the equation panel's header does) subscribes to
 * the keyboard on this event rather than finding nothing and giving up.
 */
export const MATHLIVE_READY_EVENT = 'parthhub:mathlive-ready';

/** MathLive fires this on the keyboard whenever it is shown or hidden. */
const TOGGLE_EVENT = 'virtual-keyboard-toggle';
/** …and this when its size or position changes, such as on a layout switch. */
const GEOMETRY_EVENT = 'geometrychange';

export const getVirtualKeyboard = (): IVirtualKeyboard | undefined =>
  typeof window === 'undefined'
    ? undefined
    : (window as unknown as { mathVirtualKeyboard?: IVirtualKeyboard }).mathVirtualKeyboard;

export const isVirtualKeyboardVisible = (): boolean => Boolean(getVirtualKeyboard()?.visible);

export const showVirtualKeyboard = () => getVirtualKeyboard()?.show();

/**
 * Hides the keyboard if it is up. Safe to call when MathLive has never loaded.
 *
 * The keyboard is a window-level singleton with a `manual` policy on desktop, so it does not follow
 * the field that opened it: an equation closed with the keyboard up left the keyboard on screen
 * with nothing left to type into. Every path that ends an equation edit calls this.
 */
export const hideVirtualKeyboard = () => {
  const keyboard = getVirtualKeyboard();
  if (keyboard?.visible) keyboard.hide();
};

export const toggleVirtualKeyboard = () => {
  const keyboard = getVirtualKeyboard();
  if (!keyboard) return;
  if (keyboard.visible) keyboard.hide();
  else keyboard.show();
};

/** Whether the keyboard is showing and how tall it is, kept current from MathLive's own events. */
export const useVirtualKeyboard = (): { isVisible: boolean; height: number } => {
  const [state, setState] = useState({ isVisible: false, height: 0 });

  useEffect(() => {
    let keyboard: IVirtualKeyboard | undefined;
    const update = () => {
      if (keyboard) setState({ isVisible: keyboard.visible, height: keyboard.boundingRect.height });
    };
    const subscribe = () => {
      keyboard = getVirtualKeyboard();
      if (!keyboard) return;
      update();
      keyboard.addEventListener(TOGGLE_EVENT, update);
      keyboard.addEventListener(GEOMETRY_EVENT, update);
    };
    // The global appears when the first field loads, which is usually after this mounts.
    subscribe();
    window.addEventListener(MATHLIVE_READY_EVENT, subscribe);
    return () => {
      window.removeEventListener(MATHLIVE_READY_EVENT, subscribe);
      keyboard?.removeEventListener(TOGGLE_EVENT, update);
      keyboard?.removeEventListener(GEOMETRY_EVENT, update);
    };
  }, []);

  return state;
};
