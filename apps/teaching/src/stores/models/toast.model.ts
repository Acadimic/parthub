import { type Instance, types as t } from 'mobx-state-tree';

export const ToastModel = t.model('Toast', {
  id: t.identifierNumber,
  message: t.string,
  description: t.maybe(t.string),
  type: t.enumeration('ToastType', ['success', 'error', 'info', 'warning']),
});

export type IToast = Instance<typeof ToastModel>;
