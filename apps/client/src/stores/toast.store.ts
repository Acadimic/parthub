import { Instance, types as t } from 'mobx-state-tree';

const ToastModel = t.model('ToastModel', {
  _id: t.identifier,
  message: t.string,
  type: t.optional(t.enumeration(['success', 'error', 'info', 'warning']), 'info'),
});

export const ToastStore = t
  .model('ToastStore', {
    toasts: t.array(ToastModel),
  })
  .actions((self) => ({
    addToast: (toast: { _id: string; message: string; type?: 'success' | 'error' | 'info' | 'warning' }) => {
      self.toasts.push(toast as any);
    },
    removeToast: (id: string) => {
      const index = self.toasts.findIndex((t) => t._id === id);
      if (index > -1) self.toasts.splice(index, 1);
    },
  }));

export type IToastStore = Instance<typeof ToastStore>;
