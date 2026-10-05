import { type AxiosError } from 'axios';
import { Subdomain } from '../../enums';
import { errorToast } from './toasts';
import { clearBrowserStorage, getToken } from '@repo/ui/lib';

/** An error this helper has already shown the user, carrying the text it showed. */
interface IToastedError extends Error {
  isToasted?: boolean;
}

/** Whether the user has already seen this error. */
const isToastedError = (error: unknown): boolean => error instanceof Error && !!(error as IToastedError).isToasted;

/**
 * Reports a caught error to the user, once.
 *
 * `handleError` toasts every failed request and then throws, so a save handler that toasts its own
 * catch would show the same message twice — which is why the empty `catch {}` blocks existed. Every
 * other failure reaching a catch (a bug in the handler, a rejected upload) has been shown to nobody,
 * and is what `fallbackMessage` is for.
 */
export const reportError = (error: unknown, fallbackMessage: string): void => {
  if (isToastedError(error)) return;
  errorToast({ message: error instanceof Error ? error.message : fallbackMessage });
};

export const handleError = (errorData: AxiosError, shouldNotThrowError?: boolean): void => {
  // handle unauthentication 401 error
  let message = '';
  if (errorData?.response?.status === 401 && getToken(Subdomain.TEACH)) {
    clearBrowserStorage();
    window.location.replace('/sign-in');
    return;
  }
  if (errorData.response) {
    // `HttpExceptionFilter` and `MongoDuplicateKeyFilter` answer `{ error: { code, message } }`; a bare
    // `{ message }` is what the validation pipe sends. Reading only the second form showed Axios's
    // "Request failed with status code 409" in place of the server's reason.
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
  if (shouldNotThrowError) return;
  const error: IToastedError = new Error(message);
  error.isToasted = true;
  throw error;
};
