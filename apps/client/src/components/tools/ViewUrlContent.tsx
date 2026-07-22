import { FullScreenModal, Loader } from '@components/app';
import { useAttachment } from '@hooks/attachment.hook';
import { useEffect, useMemo, useState } from 'react';
import { HandleContentError } from './HandleContentError';
import { ViewToolbar } from './ViewToolbar';

interface IProps {
  url: string;
  className?: string;
  isStatic?: boolean;
}

export const ViewUrlContent = ({ url, isStatic }: IProps) => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [presignedUrl, setPresignedUrl] = useState<string>('');
  const { getPresignedUrls } = useAttachment();
  const [isFullScreen, setIsFullScreen] = useState(false);

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

  const IFRAME = useMemo(() => {
    return (
      <>
        {presignedUrl ? (
          <iframe
            src={`${presignedUrl}#view=fitH&toolbar=0&navpanes=0&zoom=100&scrollbar=0`}
            className="w-full h-full bg-background-primary scale-x-[1.02] scale-y-[1.04]"
            frameBorder="0"
            title="PDF Viewer"
            seamless
            allowFullScreen
            allowTransparency
            style={{
              width: '100%',
              height: '100%',
              border: 'none',
            }}
          />
        ) : (
          <div className="overflow-auto h-full w-full">
            <HandleContentError url={url} />
          </div>
        )}
      </>
    );
  }, [presignedUrl]);

  return (
    <div className="w-full h-full overflow-hidden">
      {isLoading || !url ? <Loader isLoading={isLoading} /> : null}
      <>
        <ViewToolbar setIsFullScreen={setIsFullScreen} isFullScreen={isFullScreen} />
      </>
      {IFRAME}
      <FullScreenModal
        isOpen={isFullScreen}
        onClose={() => setIsFullScreen(false)}
        component={
          <div className="w-full h-full overflow-hidden">
            <ViewToolbar setIsFullScreen={setIsFullScreen} isFullScreen={isFullScreen} />
            {IFRAME}
          </div>
        }
      />
    </div>
  );
};
