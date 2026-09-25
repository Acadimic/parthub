import { useAttachment } from '@hooks/attachment.hook';
import { ImageIcon as Img } from '@phosphor-icons/react';
import React, { useEffect, useState } from 'react';

interface IProps {
  url: string | null;
  className?: string;
  isStatic?: boolean;
  noOpen?: boolean; // If true, the image will not open in a new tab on click
}

const PresignedImageComponent = ({ url, className, isStatic, noOpen }: IProps) => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [presignedUrl, setPresignedUrl] = useState<string>('');
  // A signed URL can still point at nothing — an object removed from the bucket, or one whose row
  // predates the current key layout. Without this the browser draws its own broken-image box.
  const [hasFailed, setHasFailed] = useState<boolean>(false);
  const { getPresignedUrls } = useAttachment();

  const fetchAndSetPresignedUrl = async () => {
    if (!url) return;
    setIsLoading(true);
    const urls = await getPresignedUrls([url]);
    urls.length > 0 && setPresignedUrl(urls[0]);
    // setTimeout(() => setIsLoading(false), 1000);
    setIsLoading(false);
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
      className={`flex items-center justify-center w-full h-full text-muted-foreground ${noOpen ? '' : 'cursor-pointer'}`}
      onClick={onClick}
    >
      {isLoading || !url || !presignedUrl || hasFailed ? (
        <div className="bg-muted w-full h-full">
          <Img weight="light" className={`w-full h-full ${className ? className : ''}`} />
        </div>
      ) : (
        <img
          src={presignedUrl}
          alt=""
          onError={() => setHasFailed(true)}
          className={`w-full h-full ${className ? className : ''}`}
        />
      )}
    </div>
  );
};

PresignedImageComponent.displayName = 'PresignedImage';

export const PresignedImage = React.memo(PresignedImageComponent);
