import { type IToast } from '@repo/shared';
import { useToastStore } from '../../stores';

interface IToastParams {
  message: string;
  description?: string;
}

const getToastData = (data: IToastParams, type: IToast['type']): IToast => {
  return {
    id: Date.now(),
    message: data.message,
    description: data.description,
    type,
  };
};

export const successToast = (data: IToastParams) => {
  const toastData: IToast = getToastData(data, 'success');
  useToastStore.getState().add(toastData);
};

export const errorToast = (data: IToastParams) => {
  const toastData: IToast = getToastData(data, 'error');
  useToastStore.getState().add(toastData);
};

export const warnToast = (data: IToastParams) => {
  const toastData: IToast = getToastData(data, 'warning');
  useToastStore.getState().add(toastData);
};

export const infoToast = (data: IToastParams) => {
  const toastData: IToast = getToastData(data, 'info');
  useToastStore.getState().add(toastData);
};
