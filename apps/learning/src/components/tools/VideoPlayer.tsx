import { Loader } from '@repo/ui/app';
import { BlankState } from '@components/others';
import { useAttachment } from '@hooks/attachment.hook';
import { useEffect, useState } from 'react';
import ReactPlayer from 'react-player';

interface IProps {
  url: string;
  className?: string;
  isStatic?: boolean;
}

export const VideoPlayer = ({ url, isStatic }: IProps) => {
  // Starts loading unless the address is usable as is, so the error state cannot flash first.
  const [isLoading, setIsLoading] = useState<boolean>(!isStatic);
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

  if (isLoading) return <Loader isLoading />;
  if (!presignedUrl) {
    return (
      <BlankState
        className="h-full justify-center"
        label="This video could not be opened"
        description="The file may have been removed, or the link is no longer valid."
      />
    );
  }
  return (
    <div className="h-full w-full">
      <ReactPlayer playing controls src={presignedUrl} width="100%" height="100%" />
    </div>
  );
};
