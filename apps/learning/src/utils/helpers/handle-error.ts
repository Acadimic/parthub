import { AxiosError } from 'axios';
import { StorageKey } from '../../enums';
import { errorToast } from './toasts';
import { clearLocalStorage } from './util';

export const handleError = (errorData: AxiosError, shouldNotThrowError?: boolean): void => {
  // handle unauthentication 401 error
  let message = '';
  if (errorData?.response?.status === 401 && localStorage.getItem(StorageKey.TOKEN)) {
    clearLocalStorage();
    window.location.replace('/sign-in');
    return;
  }
  if (errorData.response) {
    const error = errorData.response.data as { message?: string | string[] };
    const messages = error?.message || errorData?.message;
    message = Array.isArray(messages) ? messages.join('. ') : messages;
    errorToast({ message });
  } else if (errorData.request) {
    message = 'Network error. Refresh the page.';
    errorToast({ message });
  } else {
    message = 'Something went wrong. Refresh the page.';
    errorToast({ message });
  }
  if (!shouldNotThrowError) throw new Error(message);
};
