const KEY = 'editor:pronunciation-language';
const FALLBACK = 'en-US';

/**
 * The language an author last marked text in, so the second word of a Spanish lesson does not ask
 * again. Browser storage can be absent or blocked; then every mark starts in English.
 */
export const lastLanguage = {
  get: (): string => {
    try {
      return window.localStorage.getItem(KEY) || FALLBACK;
    } catch {
      return FALLBACK;
    }
  },
  set: (code: string) => {
    try {
      window.localStorage.setItem(KEY, code);
    } catch {
      // Not remembered; nothing else depends on it.
    }
  },
};
