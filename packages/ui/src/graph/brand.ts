/**
 * The Acadimic mark stamped on a downloaded graph. Every app serves both versions from
 * `public/images`, as the shared `Logo` does: the dark mark for a light background, the light mark
 * for a dark one.
 */
const MARK_ON_LIGHT = '/images/logo-dark.svg';
const MARK_ON_DARK = '/images/logo-light.svg';

const loaded = new Map<string, Promise<HTMLImageElement | null>>();

/** True for a dark colour, given as the browser reports it: `rgb(16, 17, 22)`. */
export const isDarkColour = (colour: string): boolean => {
  const [red = 255, green = 255, blue = 255] = (colour.match(/\d+(\.\d+)?/g) ?? []).map(Number);
  // Perceived brightness (ITU-R BT.601), 0 to 255.
  return 0.299 * red + 0.587 * green + 0.114 * blue < 128;
};

/**
 * The mark that reads on `background`, loaded once and kept for every later download. Null when it
 * cannot be loaded: the image is still saved, just without it.
 */
export const loadBrandMark = (background: string): Promise<HTMLImageElement | null> => {
  const src = isDarkColour(background) ? MARK_ON_DARK : MARK_ON_LIGHT;
  const cached = loaded.get(src);
  if (cached) return cached;
  const mark = new Promise<HTMLImageElement | null>((resolve) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => resolve(null);
    image.src = src;
  });
  loaded.set(src, mark);
  return mark;
};
