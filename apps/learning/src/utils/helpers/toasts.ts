import { IToast, toastStore } from '../../stores';

interface IToastParams {
  message: string;
  description?: string;
}

const getToastData = (data: IToastParams, type: 'success' | 'error' | 'warning' | 'info'): IToast => {
  return {
    id: Date.now(),
    message: data.message,
    description: data.description,
    type,
  };
};

export const successToast = (data: IToastParams) => {
  const toastData: IToast = getToastData(data, 'success');
  toastStore.addToast(toastData);
};

export const errorToast = (data: IToastParams) => {
  const toastData: IToast = getToastData(data, 'error');
  toastStore.addToast(toastData);
};

export const warnToast = (data: IToastParams) => {
  const toastData: IToast = getToastData(data, 'warning');
  toastStore.addToast(toastData);
};

export const infoToast = (data: IToastParams) => {
  const toastData: IToast = getToastData(data, 'info');
  toastStore.addToast(toastData);
};
