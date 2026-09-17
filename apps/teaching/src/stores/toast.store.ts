import { type IToast } from '@interfaces';
import { create } from 'zustand';

/**
 * The reference Zustand store for this codebase — see `.claude/plans/MOBX_TO_ZUSTAND.md`.
 *
 * Three things to copy from it:
 *
 * - The state shape is a named, exported interface. No inline `create<{ ... }>()`.
 * - Actions live in the same object as the data. Where one needs the current state it reads it
 *   through `get()` rather than closing over a stale copy — this store no longer needs to, since
 *   the dismiss timer moved into the component (see `add`).
 * - It is a module singleton, so `useToastStore.getState()` works outside React. That is what lets
 *   `utils/helpers/toasts.ts` raise a toast from a service or an interceptor.
 */
export interface IToastState {
  toasts: IToast[];
  add: (toast: IToast) => void;
  remove: (id: number) => void;
}

export const useToastStore = create<IToastState>()((set) => ({
  toasts: [],

  /**
   * Queues a toast. Nothing here schedules its removal.
   *
   * The countdown belongs to the component, which is the only thing that can see a pointer resting
   * on the toast and hold it open. A timer started here would fire regardless and pull the message
   * out from under whoever was reading it.
   */
  add: (toast) => {
    set((state) => ({ toasts: [...state.toasts, toast] }));
  },

  remove: (id) => {
    set((state) => ({ toasts: state.toasts.filter((toast) => toast.id !== id) }));
  },
}));
