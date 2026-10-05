import { type AxiosError } from 'axios';

/**
 * The bodies the server returns: `{ error: { code, message } }` from `HttpExceptionFilter` and
 * `MongoDuplicateKeyFilter`, a bare `{ message }` from the validation pipe.
 */
interface IApiErrorBody {
  message?: string | string[];
  error?: { message?: string | string[] };
}

import { errorToast } from './toasts';

export const handleError = (errorData: AxiosError, shouldNotThrowError?: boolean): void => {
  // handle unauthentication 401 error
  let message = '';
  // if (errorData?.response?.status === 401 && localStorage.getItem(StorageKey.TOKEN)) {
  //   clearBrowserStorage();
  //   window.location.replace('/signin');
  //   return;
  // }
  if (errorData.response) {
    // Reading only the bare form showed Axios's "Request failed with status code 409" in place of
    // the server's reason, such as which standard or subject name was already taken.
    const error = errorData.response.data as IApiErrorBody | undefined;
    const messages = error?.error?.message || error?.message || errorData?.message;
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
