import { ImageBrokenIcon } from '@phosphor-icons/react';
import { useEffect, useState } from 'react';
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

/**
 * A picture in authored content: the image, centred, with its caption beneath. Stored objects are
 * signed on display, so the document keeps an address that never expires.
 */
export const RichTextImage = ({ src, alt, caption, width, className }: IRichTextImageProps) => {
  const { url, isLoading } = useResolvedImageUrl(src);
  const [hasFailed, setHasFailed] = useState(false);
  // A new address gets a fresh attempt; a failure belongs to the URL that failed.
  useEffect(() => setHasFailed(false), [url]);
  const frame = cn('mx-auto w-full', IMAGE_WIDTH_CLASSES[width] ?? IMAGE_WIDTH_CLASSES.full);

  let picture;
  if (isLoading) picture = <div className={cn(frame, 'h-48 animate-pulse rounded bg-muted')} aria-label={alt} />;
  else if (!url || hasFailed) {
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
      <img
        src={url}
        alt={alt}
        loading="lazy"
        onError={() => setHasFailed(true)}
        // Natural size, capped by the column: a photo never blurs and a figure drawn as a small
        // tile (an answer option) stays a tile. Generated SVGs carry their width for this reason.
        className={cn(frame, 'block h-auto w-auto rounded')}
      />
    );
  }

  return (
    <figure className={cn('my-4', className)}>
      {picture}
      {caption ? <figcaption className="mt-2 text-center text-xs text-muted-foreground">{caption}</figcaption> : null}
    </figure>
  );
};
