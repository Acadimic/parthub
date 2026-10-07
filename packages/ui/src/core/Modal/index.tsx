import { Sheet, SheetContent, SheetHeader, SheetTitle } from '../../ui/sheet';
import { Dialog, DialogContent, DialogTitle } from '../../ui/dialog';
import { cn } from '../../lib/cn';
import { XIcon } from '@phosphor-icons/react';
import * as React from 'react';

type PositionType = 'left' | 'right' | 'top' | 'bottom' | 'center';

interface IModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  id?: string;
  isLoading?: boolean;
  footer?: React.ReactNode;
  className?: string;
  /** `center` is a popup in the middle of the screen; the others slide in from that edge. */
  position?: PositionType;
  withoutClose?: boolean;
  childrenClassName?: string;
  width?: string;
}

interface IModalHeaderProps {
  title?: string;
  withoutClose?: boolean;
  onClose: () => void;
  isCentered: boolean;
}

const ModalHeader = ({ title, withoutClose, onClose, isCentered }: IModalHeaderProps) => {
  const Title = isCentered ? DialogTitle : SheetTitle;
  return (
    <SheetHeader
      className={cn(
        'py-3 px-4 flex flex-row justify-between items-center space-x-3 md:space-x-4 border-b border-border',
        isCentered && 'space-y-0 px-3 py-2.5 md:px-4',
      )}
    >
      <Title className="min-w-0 flex-1 md:text-base font-bold">{title}</Title>
      {!withoutClose && (
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className={cn(
            'p-0 hover:bg-transparent',
            // A popup gets a full-size target: it is often closed by touch, over a busy canvas.
            isCentered && 'flex h-9 w-9 shrink-0 items-center justify-center hover:bg-accent',
          )}
        >
          <XIcon weight="bold" className={cn('hover:text-primary', isCentered ? 'h-5 w-5' : 'w-4 h-4')} />
        </button>
      )}
    </SheetHeader>
  );
};

export const Modal = ({
  isOpen,
  onClose,
  children,
  id,
  title,
  isLoading,
  footer,
  className,
  position,
  withoutClose,
  childrenClassName,
  width,
}: IModalProps) => {
  const anchorPosition = position || 'top';
  const isLeft = anchorPosition === 'left';
  const isRight = anchorPosition === 'right';
  const isCentered = anchorPosition === 'center';
  // What had focus when the popup opened, so closing hands it back — a popup opened from a plain
  // button rather than a dialog trigger would otherwise drop focus to the top of the page.
  const openerRef = React.useRef<HTMLElement | null>(null);

  const closeModal = () => {
    if (!isLoading && !withoutClose) onClose();
  };

  const widthClass = width || (isLeft || isRight ? 'w-full md:max-w-[60%] lg:max-w-[40%]' : 'w-full');

  const header = <ModalHeader title={title} withoutClose={withoutClose} onClose={closeModal} isCentered={isCentered} />;
  const body = (
    <div className={cn('flex-1 h-full overflow-y-auto min-h-[30vh] md:min-h-[20vh]', childrenClassName || 'py-4 px-4')}>
      {children}
    </div>
  );
  const footerSection = footer ? <div className="px-4 py-4 border-t border-border">{footer}</div> : null;

  if (isCentered) {
    return (
      <Dialog open={isOpen} onOpenChange={(open) => !open && closeModal()}>
        <DialogContent
          id={id}
          showCloseButton={false}
          aria-describedby={undefined}
          // Above `FullScreenModal` (z-[1300]), which hosts the exam, so a popup opened from a question
          // shows over it; below tooltips (z-[1500]), so the popup's own tooltips still show.
          overlayClassName="z-[1400]"
          className={cn(
            'z-[1400] flex flex-col gap-0 p-0 bg-background text-foreground border-border sm:rounded-none',
            className || 'max-w-lg',
          )}
          // Focus the popup itself rather than its first control: a control with a tooltip would
          // open the tooltip, and the reader's first Escape would close that instead of the popup.
          onOpenAutoFocus={(event) => {
            openerRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
            event.preventDefault();
            if (event.currentTarget instanceof HTMLElement) event.currentTarget.focus();
          }}
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            openerRef.current?.focus();
          }}
          onInteractOutside={(event) => {
            if (withoutClose) event.preventDefault();
          }}
        >
          {header}
          {body}
          {footerSection}
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && closeModal()}>
      <SheetContent
        side={anchorPosition}
        showCloseButton={false}
        className={cn('bg-background text-foreground border-border p-0 flex flex-col', className || widthClass)}
        id={id}
        onInteractOutside={(e) => {
          if (withoutClose) e.preventDefault();
        }}
      >
        {header}
        {body}
        {footerSection}
      </SheetContent>
    </Sheet>
  );
};

export type { IModalProps };
