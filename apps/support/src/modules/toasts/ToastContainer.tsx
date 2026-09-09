import { useToastStore } from '@stores';
import { Toast } from './Toast';

export const ToastContainer = () => {
  // `s.toasts` is the array held in state, so its reference only changes when the array does.
  // A derived collection (`Object.values(...)`, `.filter(...)`) would need `useShallow` instead.
  const toasts = useToastStore((state) => state.toasts);

  return (
    <>
      {toasts.map((toast) => (
        <Toast key={toast.id} toast={toast} />
      ))}
    </>
  );
};
