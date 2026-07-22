import { useRouter } from 'next/router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Modal } from '../modals';
import { Confirm } from './Confirm';

export const useConfirmLeave = (shouldWarn: boolean, message?: string) => {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [nextRoute, setNextRoute] = useState<string | undefined>();
  const [isTabClose, setIsTabClose] = useState(false);

  const handleCancel = useCallback(() => {
    setIsOpen(false);
    setNextRoute(undefined);
    setIsTabClose(false);
    if (!isTabClose) {
      router.events.emit('routeChangeError');
      throw 'routeChange aborted';
    }
  }, [isTabClose, router]);

  const handleConfirm = useCallback(() => {
    if (isTabClose) {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.close();
    } else if (nextRoute) {
      setTimeout(() => {
        router.push(nextRoute);
      }, 500);
    }
  }, [nextRoute, router, isTabClose]);

  const handleBeforeUnload = useCallback(
    (event: BeforeUnloadEvent) => {
      if (shouldWarn) {
        event.preventDefault();
        event.returnValue = '';
        setIsTabClose(true);
      }
    },
    [shouldWarn],
  );

  useEffect(() => {
    const onRouteChangeStart = (route: string) => {
      if (shouldWarn && !isOpen) {
        setIsOpen(true);
        setNextRoute(route);
        setIsTabClose(false);
        router.events.emit('routeChangeError');
        throw 'routeChange aborted';
      }
    };

    if (shouldWarn) {
      router.events.on('routeChangeStart', onRouteChangeStart);
      window.addEventListener('beforeunload', handleBeforeUnload);
    }

    return () => {
      router.events.off('routeChangeStart', onRouteChangeStart);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [shouldWarn, isOpen, handleBeforeUnload]);

  const confirmPrompt = useMemo(() => {
    return (
      <>
        {isOpen && (
          <Modal
            isOpen={isOpen}
            onClose={handleCancel}
            component={<Confirm message={message} onCancel={handleCancel} onForceClose={handleConfirm} />}
          />
        )}
      </>
    );
  }, [isOpen, handleCancel, handleConfirm, isTabClose]);

  return { confirmPrompt };
};
