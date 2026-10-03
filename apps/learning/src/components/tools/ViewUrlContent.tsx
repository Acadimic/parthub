import { FullScreenModal, Loader } from '@repo/ui/app';
import { useAttachment } from '@hooks/attachment.hook';
import { cn } from '@repo/ui/lib';
import { useEffect, useMemo, useState } from 'react';
import { HandleContentError } from './HandleContentError';
import { FullScreenBar } from './FullScreenBar';

interface IProps {
  url: string;
  isStatic?: boolean;
  /** Owned by the frame around the viewer, whose toolbar carries the toggle. */
  isFullScreen: boolean;
  onFullScreenChange: (isFullScreen: boolean) => void;
}

export const ViewUrlContent = ({ url, isStatic, isFullScreen, onFullScreenChange }: IProps) => {
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

  // In the lesson frame the viewer is cropped: its scrollbar is turned off and it is scaled past its
  // box to hide the edge. Full screen shows it whole, so the document's own scrollbar sits at the
  // screen's right edge.
  const getIframe = (isCropped: boolean) =>
    presignedUrl ? (
      <iframe
        src={`${presignedUrl}#view=fitH&toolbar=0&navpanes=0&zoom=100${isCropped ? '&scrollbar=0' : ''}`}
        className={cn('h-full w-full bg-background', isCropped && 'scale-x-[1.02] scale-y-[1.04]')}
        frameBorder="0"
        title="PDF Viewer"
        seamless
        allowFullScreen
        allowTransparency
        style={{ width: '100%', height: '100%', border: 'none' }}
      />
    ) : (
      <div className="overflow-auto h-full w-full">
        <HandleContentError url={url} />
      </div>
    );
  const FRAMED = useMemo(() => getIframe(true), [presignedUrl]);
  const WHOLE = useMemo(() => getIframe(false), [presignedUrl]);

  return (
    <div className="w-full h-full overflow-hidden">
      {isLoading || !url ? <Loader isLoading={isLoading} /> : null}
      {FRAMED}
      <FullScreenModal
        isOpen={isFullScreen}
        onClose={() => onFullScreenChange(false)}
        component={
          <div className="flex h-full w-full flex-col overflow-hidden">
            <div className="min-h-0 flex-1 overflow-hidden">{WHOLE}</div>
            <FullScreenBar onExit={() => onFullScreenChange(false)} />
          </div>
        }
      />
    </div>
  );
};
