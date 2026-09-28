import { type AxiosError } from 'axios';
import { StorageKey } from '../../enums';
import { errorToast } from './toasts';
import { clearLocalStorage } from '@repo/ui/lib';

export const handleError = (errorData: AxiosError, shouldNotThrowError?: boolean): void => {
  // handle unauthentication 401 error
  let message = '';
  if (errorData?.response?.status === 401 && localStorage.getItem(StorageKey.TOKEN)) {
    clearLocalStorage();
    window.location.replace('/sign-in');
    return;
  }
  if (errorData.response) {
    // `HttpExceptionFilter` renders a Nest exception as `{ error: { code, message } }`; a bare
    // `{ message }` is what the validation pipe and older handlers send. Reading only the second
    // form showed Axios's "Request failed with status code 400" in place of the server's reason.
    const data = errorData.response.data as { message?: string | string[]; error?: { message?: string | string[] } };
    const messages = data?.error?.message || data?.message || errorData?.message;
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
