import { useStandardStore } from '@stores';

/**
 * The spoken language of the first of these standards that has one — a language course's own, such
 * as `es-ES` — for the editor to start pronunciation marks in. `''` for any other course.
 */
export const useSpeechLocale = (standardIds: (string | undefined)[]): string =>
  useStandardStore(
    (state) =>
      standardIds.map((id) => (id ? state.getStandardById(id)?.locale : undefined)).find((locale) => !!locale) ?? '',
  );
