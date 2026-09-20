/**
 * A fresh MongoDB ObjectId as 24 hex characters, minted on the client.
 *
 * Twelve bytes as the server would mint them — four of seconds, five of a per-process random,
 * three of a counter — so client-minted ids are indistinguishable from server ones and pass
 * `IsMongoId`. Written here rather than pulled from a library because the AI importers run in the
 * browser, on the server and in a terminal agent, and each would otherwise carry its own copy.
 */
const PROCESS_RANDOM = Array.from({ length: 5 }, () =>
  Math.floor(Math.random() * 256)
    .toString(16)
    .padStart(2, '0'),
).join('');
let counter = Math.floor(Math.random() * 0xffffff);

export const createObjectId = (): string => {
  const seconds = Math.floor(Date.now() / 1000)
    .toString(16)
    .padStart(8, '0');
  counter = (counter + 1) % 0xffffff;
  return `${seconds}${PROCESS_RANDOM}${counter.toString(16).padStart(6, '0')}`;
};

/** "Laws of Motion!" → "laws-of-motion": the slug the entities store beside their name. */
export const slugify = (value: string): string =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, '')
    .replace(/\s+/g, ' ')
    .split(' ')
    .join('-');
