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

  useEffect(() => {
    if (url && isStatic) setPresignedUrl(url);
    else if (!presignedUrl) fetchAndSetPresignedUrl();
  }, [url]);

  return (
    <div
      className={`flex items-center justify-center w-full h-full text-muted-foreground ${noOpen ? '' : 'cursor-pointer'}`}
      onClick={onClick}
    >
      {isLoading || !url || !presignedUrl ? (
        <div className="bg-muted w-full h-full">
          <Img weight="light" className={`w-full h-full ${className ? className : ''}`} />
        </div>
      ) : (
        <img src={presignedUrl} alt="img" className={`w-full h-full ${className ? className : ''}`} />
      )}
    </div>
  );
};

PresignedImageComponent.displayName = 'PresignedImage';

export const PresignedImage = React.memo(PresignedImageComponent);
