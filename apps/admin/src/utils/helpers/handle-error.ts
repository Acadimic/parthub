import { AxiosError } from 'axios';

/** The body the server's exception filter returns. */
interface IApiErrorBody {
  message?: string;
}

import { StorageKey } from '../../enums';
import { errorToast } from './toasts';
import { clearLocalStorage } from '@repo/ui/lib';

export const handleError = (errorData: AxiosError, shouldNotThrowError?: boolean): void => {
  // handle unauthentication 401 error
  let message = '';
  if (errorData?.response?.status === 401 && localStorage.getItem(StorageKey.TOKEN)) {
    clearLocalStorage();
    window.location.replace('/signin');
    return;
  }
  if (errorData.response) {
    const error = errorData.response.data as IApiErrorBody | undefined;
    message = error?.message || errorData?.message;
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
