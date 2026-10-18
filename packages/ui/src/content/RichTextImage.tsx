import { ImageBrokenIcon } from '@phosphor-icons/react';
import { type CSSProperties, type TransitionEvent, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useRichTextMedia } from '../contexts/rich-text-media-context';
import { cn } from '../lib/cn';

export interface IRichTextImageProps {
  src: string;
  alt: string;
  caption: string;
  width: string;
  className?: string;
}

/** How wide a picture may grow. It never grows past its own size, so a small tile stays small. */
export const IMAGE_WIDTH_CLASSES: Record<string, string> = {
  small: 'max-w-[18rem]',
  medium: 'max-w-[32rem]',
  full: 'max-w-full',
};

/** A figure drawn as SVG — by the course agent, an AI reply or the editor — rather than a photo. */
const isDrawnFigure = (src: string): boolean => /\.svg(\?|#|$)/i.test(src);

/** Resolves a stored `src` to a loadable URL through the app's media provider. */
export const useResolvedImageUrl = (src: string): { url: string; isLoading: boolean } => {
  const { resolveMediaUrl } = useRichTextMedia();
  const [state, setState] = useState({ url: '', isLoading: true });
  useEffect(() => {
    let isCurrent = true;
    setState({ url: '', isLoading: true });
    resolveMediaUrl(src)
      .catch(() => '')
      .then((url) => isCurrent && setState({ url, isLoading: false }));
    return () => {
      isCurrent = false;
    };
  }, [src, resolveMediaUrl]);
  return state;
};

/** The shimmer's height while a picture's own height is unknown; `h-48`. */
const PLACEHOLDER_HEIGHT = 192;

/**
 * Reveals a picture once it has downloaded: its frame holds the shimmer's height, grows to the
 * picture's over 300ms while the picture fades in, then lets go so it follows the column's width.
 * The text below glides into place rather than jumping.
 */
export const useImageReveal = (url: string) => {
  const imageRef = useRef<HTMLImageElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [height, setHeight] = useState<number | 'auto'>(PLACEHOLDER_HEIGHT);

  useEffect(() => {
    setIsLoaded(false);
    setHeight(PLACEHOLDER_HEIGHT);
  }, [url]);

  useLayoutEffect(() => {
    const image = imageRef.current;
    if (!isLoaded || !image) return;
    // An equal height starts no transition, so nothing would ever let go of the fixed one.
    setHeight(image.offsetHeight === PLACEHOLDER_HEIGHT ? 'auto' : image.offsetHeight);
  }, [isLoaded]);

  const frameStyle: CSSProperties = { height };
  const onFrameTransitionEnd = (event: TransitionEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget && event.propertyName === 'height') setHeight('auto');
  };
  return { imageRef, isLoaded, onLoad: () => setIsLoaded(true), frameStyle, onFrameTransitionEnd };
};

/** The frame that grows, and the classes that fade the picture in; print shows both whole at once. */
export const REVEAL_FRAME_CLASS = 'relative overflow-hidden transition-[height] duration-300 print:h-auto';
export const getRevealImageClass = (isLoaded: boolean) =>
  cn('transition-opacity duration-300 print:opacity-100', isLoaded ? 'opacity-100' : 'opacity-0');

/**
 * A picture in authored content: the image, centred, with its caption beneath. Stored objects are
 * signed on display, so the document keeps an address that never expires.
 */
export const RichTextImage = ({ src, alt, caption, width, className }: IRichTextImageProps) => {
  const { url, isLoading } = useResolvedImageUrl(src);
  const { imageLoading } = useRichTextMedia();
  const [hasFailed, setHasFailed] = useState(false);
  const { imageRef, isLoaded, onLoad, frameStyle, onFrameTransitionEnd } = useImageReveal(url);
  // A new address gets a fresh attempt; a failure belongs to the URL that failed.
  useEffect(() => setHasFailed(false), [url]);
  const frame = cn('mx-auto w-full', IMAGE_WIDTH_CLASSES[width] ?? IMAGE_WIDTH_CLASSES.full);

  let picture;
  if (!isLoading && (!url || hasFailed)) {
    picture = (
      <div
        className={cn(
          frame,
          'flex items-center gap-2 rounded border border-dashed border-border p-4 text-xs text-muted-foreground',
        )}
      >
        <ImageBrokenIcon className="h-4 w-4 shrink-0" />
        <span>{alt || 'Image unavailable'}</span>
      </div>
    );
  } else {
    picture = (
      <div className={cn(frame, REVEAL_FRAME_CLASS)} style={frameStyle} onTransitionEnd={onFrameTransitionEnd}>
        {isLoaded ? null : (
          // Marked pending only until the address is known; print then waits on the image itself.
          <div
            className="absolute inset-0 animate-pulse rounded bg-muted"
            aria-label={alt}
            data-pending={isLoading || undefined}
          />
        )}
        {url ? (
          <img
            ref={imageRef}
            src={url}
            alt={alt}
            loading={imageLoading}
            onLoad={onLoad}
            onError={() => setHasFailed(true)}
            // Natural size, capped by the column: a photo never blurs and a figure drawn as a small
            // tile (an answer option) stays a tile. Generated SVGs carry their width for this reason.
            className={cn(
              // Capped in height too, so one tall figure never takes the whole screen in the topic reader.
              'mx-auto block h-auto max-h-[min(60vh,28rem)] w-auto max-w-full rounded object-contain',
              // A drawn figure (SVG) is dark ink an image cannot recolour from the theme, so in dark
              // mode it is inverted, hues turned back; a photo is left as it is. Print is always light.
              isDrawnFigure(src) && 'dark:hue-rotate-180 dark:invert',
              getRevealImageClass(isLoaded),
            )}
          />
        ) : null}
      </div>
    );
  }

  return (
    <figure className={cn('my-4', className)}>
      {picture}
      {caption ? <figcaption className="mt-2 text-center text-xs text-muted-foreground">{caption}</figcaption> : null}
    </figure>
  );
};
