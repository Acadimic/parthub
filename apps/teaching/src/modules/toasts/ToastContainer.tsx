import { ToastStack } from '@repo/ui/app';
import { useToastStore } from '@stores';

/**
 * Binds the toast store to the shared toast layer.
 *
 * All the presentation lives in `@repo/ui` — three apps were rendering byte-identical copies of it
 * before. What stays here is the only part that is genuinely app-shaped: the Zustand store, which
 * the package may not read.
 */
export const ToastContainer = () => {
  // `toasts` is the array held in state, so its reference only changes when the array does. A
  // derived collection (`Object.values(...)`, `.filter(...)`) would need `useShallow` instead.
  const toasts = useToastStore((state) => state.toasts);
  const remove = useToastStore((state) => state.remove);

  return <ToastStack toasts={toasts} onDismiss={remove} />;
};
