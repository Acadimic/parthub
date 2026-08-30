import { types } from 'mobx-state-tree';
import { IToast, ToastModel } from './models';

const ToastStore = types
  .model('ToastStore', {
    toasts: types.array(ToastModel),
  })
  .actions((self) => ({
    addToast(toastData: IToast) {
      self.toasts.push(toastData);

      setTimeout(() => {
        this.removeToast(toastData.id);
      }, 3000);
    },

    removeToast(id: number) {
      self.toasts.replace(self.toasts.filter((toast) => toast.id !== id));
    },
  }));

export const toastStore = ToastStore.create({
  toasts: [],
});
