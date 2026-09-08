import { WifiHighIcon, WifiSlashIcon } from '@phosphor-icons/react';
import { useEffect, useState } from 'react';

export const InternetStatus = () => {
  const [isIndicator, setIsIndicator] = useState(false);
  const [isOnline, setOnline] = useState<boolean | null>(null);

  useEffect(() => {
    if (isOnline === true) {
      setTimeout(() => {
        setIsIndicator(false);
      }, 2500);
    } else if (isOnline === false) setIsIndicator(true);
  }, [isOnline]);

  useEffect(() => {
    window.addEventListener('online', () => setOnline(true));
    window.addEventListener('offline', () => setOnline(false));
    if (!navigator.onLine) {
      setOnline(false);
    }
  }, []);

  return (
    <div className="fixed top-0 z-[2000] w-full">
      <div className={`transition-all duration-300 overflow-hidden ${isIndicator ? 'max-h-20' : 'max-h-0'}`}>
        <div
          className={`${
            isOnline ? 'bg-[#479F60]' : 'bg-[#4087FF]'
          } text-white py-2.5 text-sm font-medium flex gap-2 justify-center items-center`}
        >
          {isOnline ? <WifiHighIcon weight="bold" size={18} /> : <WifiSlashIcon weight="bold" size={18} />}
          <p>
            {isOnline
              ? 'Welcome back online!'
              : "You're offline. Changes made now may not be saved. We'll keep trying to connect."}
          </p>
        </div>
      </div>
    </div>
  );
};
