import { Loader } from '@components/app';
import { useAttachment } from '@hooks/attachment.hook';
import { useEffect, useState } from 'react';
import ReactPlayer from 'react-player';

interface IProps {
  url: string;
  className?: string;
  isStatic?: boolean;
}

export const VideoPlayer = ({ url, isStatic }: IProps) => {
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

  useEffect(() => {
    // console.log('####url: ', url);
    if (url && isStatic) setPresignedUrl(url);
    else fetchAndSetPresignedUrl();
  }, [url]);

  return (
    <div className={`w-full h-full`}>
      {isLoading || !url ? <Loader isLoading={isLoading} /> : null}
      {presignedUrl ? <ReactPlayer playing controls src={presignedUrl} width="100%" height="100%" /> : <div>Error</div>}
    </div>
  );
};
