import { type IMenuItem } from '../../types';
import { DotsThreeOutlineVertical } from '@phosphor-icons/react/dist/ssr';
import * as React from 'react';
import { createPortal } from 'react-dom';
import { MenuList } from './MenuList';

/** Matches `min-w-[180px]` below, and is only the first guess — the real width is measured on open. */
const MENU_WIDTH = 180;
const VIEWPORT_GAP = 8;

interface IProps<T> {
  component?: React.ReactNode;
  menuItems: IMenuItem<T>[];
  data?: T;
  className?: string;
  header?: React.ReactNode;
}

export const Menu = <T,>({ component, menuItems, data, className, header }: IProps<T>) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const [position, setPosition] = React.useState({ top: 0, left: 0 });
  const triggerRef = React.useRef<HTMLDivElement>(null);
  const popupRef = React.useRef<HTMLDivElement>(null);

  const handleClose = () => {
    setIsOpen(false);
  };

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    event.stopPropagation();
    if (!isOpen && triggerRef.current) {
      // Seed the position from the trigger before the first paint, so the menu never flashes at the
      // top-left corner on its way to being measured below.
      const rect = triggerRef.current.getBoundingClientRect();
      setPosition({ top: rect.bottom + VIEWPORT_GAP, left: rect.right - MENU_WIDTH });
    }
    setIsOpen(!isOpen);
  };

  /**
   * Places the open menu against the trigger in viewport coordinates.
   *
   * The menu is rendered through a portal and positioned `fixed` rather than absolutely inside the
   * trigger: it used to be a child of the cell, and in a table it was clipped out of existence by
   * the two `overflow-auto` ancestors every scrollable list has — react-virtuoso's scroller and the
   * table frame. Nothing an absolutely-positioned child can do escapes those.
   *
   * Measured after mount rather than computed from a constant, because the width depends on the
   * longest label. It flips above the trigger when there is not enough room below.
   */
  React.useLayoutEffect(() => {
    if (!isOpen) return;
    const trigger = triggerRef.current;
    const popup = popupRef.current;
    if (!trigger || !popup) return;
    const triggerRect = trigger.getBoundingClientRect();
    const { width, height } = popup.getBoundingClientRect();
    const left = Math.min(Math.max(VIEWPORT_GAP, triggerRect.right - width), window.innerWidth - width - VIEWPORT_GAP);
    const below = triggerRect.bottom + VIEWPORT_GAP;
    const top = below + height > window.innerHeight ? triggerRect.top - height - VIEWPORT_GAP : below;
    setPosition({ top: Math.max(VIEWPORT_GAP, top), left });
  }, [isOpen, menuItems.length]);

  React.useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      // The popup is portalled out of the trigger's subtree, so it needs its own containment check.
      if (triggerRef.current?.contains(target) || popupRef.current?.contains(target)) return;
      handleClose();
    };
    // A fixed menu cannot follow a scrolling ancestor, so it closes instead of drifting away from
    // its row. Captured, because the scroll happens on an inner container and does not bubble.
    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('scroll', handleClose, true);
    window.addEventListener('resize', handleClose);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('scroll', handleClose, true);
      window.removeEventListener('resize', handleClose);
    };
  }, [isOpen]);

  return (
    <div className="relative" ref={triggerRef}>
      <div className="flex cursor-pointer justify-center">
        <div
          className={`inline ${className ? className : 'px-2.5'}`}
          onClick={handleClick}
          aria-controls={isOpen ? 'account-menu' : undefined}
          aria-haspopup="true"
          aria-expanded={isOpen ? 'true' : undefined}
        >
          {component || <DotsThreeOutlineVertical weight="fill" className="h-5 w-5" />}
        </div>
      </div>
      {isOpen &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            ref={popupRef}
            style={{ top: position.top, left: position.left }}
            className="fixed z-[1500] border border-border rounded-sm shadow-lg min-w-[180px] bg-popover text-popover-foreground"
            onClick={handleClose}
          >
            {header}
            <MenuList menuItems={menuItems} data={data} />
          </div>,
          document.body,
        )}
    </div>
  );
};
