import { type RefObject, useEffect, useState } from 'react';

const POLL_MS = 250;
/** Past this the dialog opens anyway: a picture that never loads must not block the printout. */
const GIVE_UP_MS = 20_000;

/** True once nothing in the sheet is still arriving: no signed URL pending and every image decoded. */
const isSettled = (sheet: HTMLElement): boolean => {
  if (sheet.querySelector('[data-pending]')) return false;
  return Array.from(sheet.querySelectorAll('img')).every((image) => image.complete);
};

/**
 * Waits for the data, the fonts and every picture, then reports ready. The print snapshot is
 * taken at once, so anything still loading prints as a grey placeholder.
 */
export const usePrintReady = (sheetRef: RefObject<HTMLElement | null>, isLoaded: boolean): boolean => {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (!isLoaded) {
      setIsReady(false);
      return undefined;
    }
    let isCurrent = true;
    const startedAt = Date.now();
    let timer: ReturnType<typeof setTimeout>;
    const check = async () => {
      await document.fonts.ready;
      if (!isCurrent) return;
      const sheet = sheetRef.current;
      if ((sheet && isSettled(sheet)) || Date.now() - startedAt > GIVE_UP_MS) setIsReady(true);
      else timer = setTimeout(check, POLL_MS);
    };
    check();
    return () => {
      isCurrent = false;
      clearTimeout(timer);
    };
  }, [isLoaded, sheetRef]);

  return isReady;
};
