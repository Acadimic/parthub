import { useRouter } from 'next/router';
import * as React from 'react';

interface IProps {
  isOpen: boolean;
  onClose: () => void;
  component: React.ReactNode;
  id?: string;
  footer?: React.ReactNode;
}

export const FullScreenModal = ({ isOpen, onClose, component, id, footer }: IProps) => {
  const router = useRouter();

  React.useEffect(() => {
    const handleBack = () => {
      onClose();
      router.push(router.asPath, undefined, { shallow: true });
      return false;
    };

    router.beforePopState(handleBack);

    return () => {
      router.beforePopState(() => true);
    };
  }, [router]);

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
