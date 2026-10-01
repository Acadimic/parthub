import { useRouter } from 'next/router';
import { useEffect } from 'react';

/**
 * While `isOpen`, the browser or device back button calls `onClose` and keeps the page where it
 * is instead of leaving it. Nothing is registered while closed, so back behaves normally then.
 */
export const useCloseOnBack = (isOpen: boolean, onClose: () => void) => {
  const router = useRouter();

  useEffect(() => {
    if (!isOpen) return;
    router.beforePopState(() => {
      onClose();
      router.push(router.asPath, undefined, { shallow: true });
      return false;
    });
    return () => router.beforePopState(() => true);
  }, [isOpen, onClose, router]);
};
