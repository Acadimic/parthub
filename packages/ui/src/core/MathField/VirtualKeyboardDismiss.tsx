import { KeyboardIcon, XIcon } from '@phosphor-icons/react';
import { createPortal } from 'react-dom';
import { hideVirtualKeyboard, useVirtualKeyboard } from './virtual-keyboard';

/**
 * A "Hide keyboard" control that floats just above the on-screen keyboard while it is showing.
 *
 * MathLive's own hide key exists on only two of its four default layouts, and none at all once the
 * keyboard is left behind by a closed equation. This lives outside the keyboard, so it is there for
 * every layout and every situation. Portalled to the body and fixed above the keyboard's top edge,
 * above the drawer layer, so it is reachable wherever the field that opened the keyboard was.
 */
export const VirtualKeyboardDismiss = () => {
  const { isVisible, height } = useVirtualKeyboard();
  if (!isVisible || typeof document === 'undefined') return null;

  return createPortal(
    <button
      type="button"
      onClick={hideVirtualKeyboard}
      aria-label="Hide keyboard"
      // Lets the equation editor tell this apart from a click away: hiding the keyboard is not a
      // decision about the equation, so it must not commit and close it.
      data-virtual-keyboard-dismiss
      style={{ bottom: height + 8 }}
      className="fixed right-4 z-[1600] flex h-8 items-center gap-1.5 rounded-full border border-border bg-background px-3 text-xs font-semibold text-foreground shadow-md transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <KeyboardIcon className="h-4 w-4" />
      Hide keyboard
      <XIcon className="h-3.5 w-3.5 text-muted-foreground" weight="bold" />
    </button>,
    document.body,
  );
};
