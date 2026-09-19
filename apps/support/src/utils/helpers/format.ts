/** "post graduate competitive exams" → "Post Graduate Competitive Exams", for a stored enum value shown as a label. */
export const titleCase = (value: string): string => value.replace(/(^|\s)\S/g, (match) => match.toUpperCase());

/** "3 subjects", "1 subject" — the count with its noun agreed. */
export const pluralize = (count: number, noun: string, plural = `${noun}s`): string =>
  `${count} ${count === 1 ? noun : plural}`;
