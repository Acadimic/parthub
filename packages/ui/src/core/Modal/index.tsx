import { Sheet, SheetContent, SheetHeader, SheetTitle } from '../../ui/sheet';
import { cn } from '../../lib/cn';
import { X } from '@phosphor-icons/react';
import * as React from 'react';

type PositionType = 'left' | 'right' | 'top' | 'bottom';

interface IModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  id?: string;
  isLoading?: boolean;
  footer?: React.ReactNode;
  className?: string;
  position?: PositionType;
  withoutClose?: boolean;
  childrenClassName?: string;
  width?: string;
}

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

  const closeModal = () => {
    if (!isLoading && !withoutClose) onClose();
  };

  const sideMap: Record<PositionType, 'top' | 'bottom' | 'left' | 'right'> = {
    top: 'top',
    bottom: 'bottom',
    left: 'left',
    right: 'right',
  };

  const widthClass = width || (isLeft || isRight ? 'w-full md:max-w-[60%] lg:max-w-[40%]' : 'w-full');

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && closeModal()}>
      <SheetContent
        side={sideMap[anchorPosition]}
        className={cn('bg-background-primary border-color-border p-0 flex flex-col', className || widthClass)}
        id={id}
        onInteractOutside={(e) => {
          if (withoutClose) e.preventDefault();
        }}
      >
        <SheetHeader className="py-3 px-4 flex flex-row justify-between items-center space-x-3 md:space-x-4 border-b border-color-border">
          <SheetTitle className="md:text-base font-bold">{title}</SheetTitle>
          {!withoutClose && (
            <button onClick={closeModal} className="p-0 hover:bg-transparent">
              <X weight="bold" className="w-4 h-4 hover:text-blue-primary" />
            </button>
          )}
        </SheetHeader>
        <div
          className={cn('flex-1 h-full overflow-y-auto min-h-[30vh] md:min-h-[20vh]', childrenClassName || 'py-4 px-4')}
        >
          {children}
        </div>
        {footer ? <div className="px-4 py-4 border-t border-color-border">{footer}</div> : null}
      </SheetContent>
    </Sheet>
  );
};

export type { IModalProps };
