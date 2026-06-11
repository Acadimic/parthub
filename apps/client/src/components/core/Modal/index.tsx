import { IconButton } from '@mui/material';
import Divider from '@mui/material/Divider';
import SwipeableDrawer from '@mui/material/SwipeableDrawer';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';
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
  const isMobile = useMediaQuery('(max-width:768px)');
  const { zIndex } = useTheme();
  const anchorPosition = isMobile ? 'bottom' : position || 'top';
  const isTop = anchorPosition === 'top';
  const isBottom = anchorPosition === 'bottom';
  const isLeft = anchorPosition === 'left';
  const isRight = anchorPosition === 'right';
  const style = isLeft || isRight ? { left: isLeft ? '0' : 'auto', right: isRight ? '0' : 'auto' } : {};

  const closeModal = () => {
    if (!isLoading && !withoutClose) onClose();
  };

  const widthClass = width || (isTop ? 'w-full' : 'w-full md:max-w-[60%] lg:max-w-[40%]');

  return (
    <SwipeableDrawer
      anchor={anchorPosition}
      open={isOpen}
      onClose={closeModal}
      onOpen={() => {}}
      sx={{
        zIndex: zIndex.drawer + 2,
        [`& .MuiDrawer-paper`]: {
          background: 'transparent',
          boxShadow: 'none',
          top: isTop || isMobile ? '8%' : '',
          bottom: isBottom ? '0' : '',
          ...style,
        },
      }}
      id={id}
      transitionDuration={400}
      classes={{ paper: className || widthClass }}
    >
      <div className="w-full h-full flex justify-center relative">
        <div className="h-full w-full absolute" onClick={() => !withoutClose && closeModal()} />
        <div
          className={`flex flex-col z-10 h-full ${isRight || isLeft ? 'w-full' : className || 'w-full md:w-[60%] lg:w-[40%]'} rounded-sm border border-color-border bg-background-primary opacity-100`}
        >
          <div className="py-3 px-4 flex justify-between items-center space-x-3 md:space-x-4">
            <div className="md:text-base font-bold">{title}</div>
            <div>
              {withoutClose ? null : (
                <IconButton className="p-0 hover:bg-transparent" size="small" onClick={closeModal}>
                  <X weight="bold" className="w-4 h-4 hover:text-blue-primary" />
                </IconButton>
              )}
            </div>
          </div>
          <Divider />
          <div
            className={`flex-1 h-full ${childrenClassName || 'py-4 px-4'} overflow-y-auto min-h-[30vh] md:min-h-[20vh]`}
          >
            {children}
          </div>
          {footer ? <div className="px-4 py-4 border-t border-color-border">{footer}</div> : null}
        </div>
      </div>
    </SwipeableDrawer>
  );
};

export type { IModalProps };
