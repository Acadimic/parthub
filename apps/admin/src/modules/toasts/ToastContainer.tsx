import { toastStore } from '@stores';
import { observer } from 'mobx-react-lite';
import { Toast } from './Toast';

export const ToastContainer = observer(() => {
  const { toasts } = toastStore;

  return (
    <>
      {toasts.map((toast) => (
        <Toast key={toast.id} toast={toast} />
      ))}
    </>
  );
});
