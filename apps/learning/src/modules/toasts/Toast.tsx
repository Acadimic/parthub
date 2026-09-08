import { CheckCircleIcon, InfoIcon, WarningIcon, XCircleIcon } from '@phosphor-icons/react';
import { type IToast, toastStore } from '@stores';
import { observer } from 'mobx-react-lite';
import { useEffect } from 'react';

const iconMap = {
  success: <CheckCircleIcon weight="fill" className="w-5 h-5 text-green-600" />,
  error: <XCircleIcon weight="fill" className="w-5 h-5 text-red-600" />,
  warning: <WarningIcon weight="fill" className="w-5 h-5 text-yellow-600" />,
  info: <InfoIcon weight="fill" className="w-5 h-5 text-blue-600" />,
};

export const Toast = observer(({ toast }: { toast: IToast }) => {
  const { id, type, message } = toast;

  const onClose = () => {
    toastStore.removeToast(id);
  };

  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div
      className="cursor-pointer rounded-sm bg-background-primary border border-color-border shadow-lg flex items-center gap-2 px-4 py-3 min-w-[280px] animate-in slide-in-from-right"
      onClick={onClose}
    >
      {iconMap[type] || iconMap.info}
      <span className="text-sm font-medium">{message}</span>
    </div>
  );
});
