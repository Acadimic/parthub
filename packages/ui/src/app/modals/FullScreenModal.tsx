import * as React from 'react';
import { useCloseOnBack } from '../../hooks/use-close-on-back.hook';

interface IProps {
  isOpen: boolean;
  onClose: () => void;
  component: React.ReactNode;
  id?: string;
  footer?: React.ReactNode;
}

export const FullScreenModal = ({ isOpen, onClose, component, id, footer }: IProps) => {
  useCloseOnBack(isOpen, onClose);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1300]" id={id}>
      <div className="flex flex-col h-full w-full bg-background">
        <div className="flex-1 h-full overflow-y-auto min-h-[60vh] md:min-h-[30vh]">{isOpen ? component : null}</div>
        {footer ? <div className="border-t border-border">{footer}</div> : null}
      </div>
    </div>
  );
};
