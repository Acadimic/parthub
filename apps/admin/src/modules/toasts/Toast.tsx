import { XIcon } from '@phosphor-icons/react';
import { type IToast, toastStore } from '@stores';
import { observer } from 'mobx-react-lite';
import { useEffect, useState } from 'react';

const variantStyles: Record<string, string> = {
  success: 'bg-green-50 border-green-300 text-green-800',
  error: 'bg-red-50 border-red-300 text-red-800',
  warning: 'bg-yellow-50 border-yellow-300 text-yellow-800',
  info: 'bg-blue-50 border-blue-300 text-blue-800',
};

const iconByVariant: Record<string, string> = {
  success: '\u2713',
  error: '\u2717',
  warning: '\u26A0',
  info: '\u2139',
};

export const Toast = observer(({ toast }: { toast: IToast }) => {
  const { id, type, message, description } = toast;
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 10);
    return () => clearTimeout(timer);
  }, []);

  const onClose = () => {
    setVisible(false);
    setTimeout(() => {
      toastStore.removeToast(id);
    }, 200);
  };

  return (
    <div
      className={`
        fixed top-4 right-4 z-50 flex items-start gap-3 min-w-[300px] max-w-[420px]
        rounded-md border px-4 py-3 shadow-lg cursor-pointer
        transition-all duration-200 ease-in-out
        ${visible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
        ${variantStyles[type] || variantStyles.info}
      `}
      onClick={onClose}
      role="alert"
    >
      <span className="text-base mt-0.5 flex-shrink-0">{iconByVariant[type] || iconByVariant.info}</span>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium">{message}</div>
        {description && <div className="text-xs mt-0.5 opacity-80">{description}</div>}
      </div>
      <button
        className="flex-shrink-0 ml-2 mt-0.5 opacity-60 hover:opacity-100 transition-opacity"
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        aria-label="Close"
      >
        <XIcon className="w-4 h-4" />
      </button>
    </div>
  );
});
