import { type IToast } from '@interfaces';
import { create } from 'zustand';

/**
 * The reference Zustand store for this codebase — see `.claude/plans/MOBX_TO_ZUSTAND.md`.
 *
 * Three things to copy from it:
 *
 * - The state shape is a named, exported interface. No inline `create<{ ... }>()`.
 * - Actions live in the same object as the data, and read the current state through `get()`
 *   rather than closing over a stale copy.
 * - It is a module singleton, so `useToastStore.getState()` works outside React. That is what lets
 *   `utils/helpers/toasts.ts` raise a toast from a service or an interceptor.
 */
export interface IToastState {
  toasts: IToast[];
  add: (toast: IToast) => void;
  remove: (id: number) => void;
}

/** How long a toast stays up before it dismisses itself. */
const DISMISS_AFTER_MS = 3000;

export const useToastStore = create<IToastState>()((set, get) => ({
  toasts: [],

  add: (toast) => {
    set((state) => ({ toasts: [...state.toasts, toast] }));
    setTimeout(() => get().remove(toast.id), DISMISS_AFTER_MS);
  },

  remove: (id) => {
    set((state) => ({ toasts: state.toasts.filter((toast) => toast.id !== id) }));
  },
}));
