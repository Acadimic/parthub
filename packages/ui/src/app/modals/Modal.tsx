import { PositionType } from '@repo/shared/enums';
import { XIcon } from '@phosphor-icons/react';
import * as React from 'react';

interface IProps {
  isOpen: boolean;
  onClose: () => void;
  component: React.ReactNode;
  title?: string;
  id?: string;
  isLoading?: boolean;
  footer?: React.ReactNode;
  className?: string;
  position?: PositionType;
  withoutClose?: boolean;
  childrenClassName?: string;
}

export function Modal({
  isOpen,
  onClose,
  component,
  id,
  title,
  isLoading,
  footer,
  className,
  position,
  withoutClose,
  childrenClassName,
}: IProps) {
  const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768;
  let anchorPosition = position ?? PositionType.TOP;
  if (isMobile) anchorPosition = PositionType.BOTTOM;
  const isTop = anchorPosition === PositionType.TOP;
  const defaultWidthClass = 'w-full md:max-w-[60%] lg:max-w-[40%]';
  const isRight = anchorPosition === PositionType.RIGHT;
  const isLeft = anchorPosition === PositionType.LEFT;

  const closeModal = () => {
    if (!isLoading && !withoutClose) onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1300]" id={id}>
      <div className="absolute inset-0 bg-black/50" onClick={() => !withoutClose && closeModal()} />
      <div
        className={`absolute ${isTop ? 'top-[8%] left-1/2 -translate-x-1/2' : ''} ${isRight ? 'top-0 right-0 h-full' : ''} ${isLeft ? 'top-0 left-0 h-full' : ''} ${anchorPosition === PositionType.BOTTOM ? 'bottom-0 left-0 right-0' : ''} ${className ?? (isTop ? 'w-full md:w-[60%] lg:w-[40%]' : defaultWidthClass)}`}
      >
        <div className="flex flex-col h-full rounded-sm border border-border bg-background">
          <div className="py-3 px-4 flex justify-between items-center space-x-3 md:space-x-4">
            <div className="md:text-base font-bold">{title}</div>
            {!withoutClose && (
              <button className="p-0 hover:bg-transparent" onClick={closeModal}>
                <XIcon weight="bold" className="w-4 h-4 hover:text-info" />
              </button>
            )}
          </div>
          <hr className="border-border" />
          <div
            className={`flex-1 h-full ${childrenClassName ? '' : 'py-4 px-4'} overflow-y-auto min-h-[30vh] md:min-h-[20vh]`}
          >
            {component}
          </div>
          {footer ? <div className="px-4 py-4 border-t border-border">{footer}</div> : null}
        </div>
      </div>
    </div>
  );
}
