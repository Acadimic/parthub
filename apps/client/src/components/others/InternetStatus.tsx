import { useEffect, useState } from 'react';

export const InternetStatus = () => {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline) return null;
  return (
    <div className="fixed left-0 right-0 top-0 z-50 bg-red-primary p-2 text-center text-white">
      No internet connection
    </div>
  );
};
