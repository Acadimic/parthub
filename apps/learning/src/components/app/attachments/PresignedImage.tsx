import { useAttachment } from '@hooks/attachment.hook';
import { ImageIcon as Img } from '@phosphor-icons/react';
import { cn } from '@repo/ui/lib';
import React, { useEffect, useState } from 'react';

interface IProps {
  url: string | null;
  className?: string;
  isStatic?: boolean;
  noOpen?: boolean; // If true, the image will not open in a new tab on click
  /**
   * What to show when there is no image to draw — no address, one that could not be signed, or
   * one that failed to load. Defaults to the generic picture icon; a logo tile passes an initial.
   */
  fallback?: React.ReactNode;
}

const PresignedImageComponent = ({ url, className, isStatic, noOpen, fallback }: IProps) => {
  const [presignedUrl, setPresignedUrl] = useState<string>('');
  // Downloaded, not just signed: until then a shimmer holds the frame and the picture fades in after.
  const [isLoaded, setIsLoaded] = useState<boolean>(false);
  // A signed URL can still point at nothing — an object removed from the bucket, or one whose row
  // predates the current key layout. Without this the browser draws its own broken-image box.
  const [hasFailed, setHasFailed] = useState<boolean>(false);
  const { getPresignedUrls } = useAttachment();

  const fetchAndSetPresignedUrl = async () => {
    if (!url) return;
    const [signed] = await getPresignedUrls([url]);
    if (signed) setPresignedUrl(signed);
    else setHasFailed(true);
  };

  const onClick = () => {
    if (noOpen || !presignedUrl) return;
    window.open(presignedUrl, '_blank');
  };

  // Re-signs whenever `url` changes, not only when nothing is signed yet. A virtualised table
  // recycles row components across rows, so the same instance is handed a different logo after a
  // sort, filter or search; the old guard (`!presignedUrl`) kept the previous row's image on it.
  useEffect(() => {
    setHasFailed(false);
    setIsLoaded(false);
    if (!url) {
      setPresignedUrl('');
      return;
    }
    if (isStatic) {
      setPresignedUrl(url);
      return;
    }
    setPresignedUrl('');
    fetchAndSetPresignedUrl();
  }, [url]);

  return (
    <div
      className={cn(
        'relative flex h-full w-full items-center justify-center text-muted-foreground',
        !noOpen && 'cursor-pointer',
      )}
      onClick={onClick}
    >
      {!url || hasFailed ? (
        <div className="flex h-full w-full items-center justify-center bg-muted">
          {fallback ?? <Img weight="light" className={`w-full h-full ${className ? className : ''}`} />}
        </div>
      ) : (
        <>
          {isLoaded ? null : <div className="absolute inset-0 animate-pulse bg-muted" />}
          {/* The fade is on a wrapper, so it does not override a transition the caller gives the image. */}
          {presignedUrl ? (
            <div
              className={cn('h-full w-full transition-opacity duration-300', isLoaded ? 'opacity-100' : 'opacity-0')}
            >
              <img
                src={presignedUrl}
                alt=""
                onLoad={() => setIsLoaded(true)}
                onError={() => setHasFailed(true)}
                className={`w-full h-full ${className ? className : ''}`}
              />
            </div>
          ) : null}
        </>
      )}
    </div>
  );
};

PresignedImageComponent.displayName = 'PresignedImage';

export const PresignedImage = React.memo(PresignedImageComponent);
