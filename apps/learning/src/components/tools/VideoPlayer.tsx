import { BlankState } from '@components/others';
import { useAttachment } from '@hooks/attachment.hook';
import { Loader } from '@repo/ui/app';
import { useCloseOnBack } from '@repo/ui/hooks';
import { cn } from '@repo/ui/lib';
import { useEffect, useState } from 'react';
import ReactPlayer from 'react-player';
import { FullScreenBar } from './FullScreenBar';

interface IProps {
  url: string;
  isStatic?: boolean;
  /** Owned by the frame around the viewer, whose toolbar carries the toggle. */
  isFullScreen: boolean;
  onFullScreenChange: (isFullScreen: boolean) => void;
}

export const VideoPlayer = ({ url, isStatic, isFullScreen, onFullScreenChange }: IProps) => {
  // Starts loading unless the address is usable as is, so the error state cannot flash first.
  const [isLoading, setIsLoading] = useState<boolean>(!isStatic);
  const [presignedUrl, setPresignedUrl] = useState<string>('');
  const { getPresignedUrls } = useAttachment();

  const fetchAndSetPresignedUrl = async () => {
    if (!url) return;
    setIsLoading(true);
    const urls = await getPresignedUrls([url]);
    urls.length > 0 && setPresignedUrl(urls[0]);
    setIsLoading(false);
  };

  useEffect(() => {
    if (url && isStatic) setPresignedUrl(url);
    else fetchAndSetPresignedUrl();
  }, [url]);

  // Besides the footer's exit button, the back button and Escape are the way out.
  useCloseOnBack(isFullScreen, () => onFullScreenChange(false));

  useEffect(() => {
    if (!isFullScreen) return;
    const handleKeyDown = (event: KeyboardEvent) => event.key === 'Escape' && onFullScreenChange(false);
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullScreen, onFullScreenChange]);

  const getPlayer = () => {
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
    return <ReactPlayer playing controls src={presignedUrl} width="100%" height="100%" />;
  };

  // Not FullScreenModal, which the other viewers use: mounting the player a second time inside it
  // restarts playback. The same node is pinned over the page instead, at the modal's layer, with
  // the shared footer under it; the player's wrapper is there in both modes so it never remounts.
  return (
    <div className={cn('relative h-full w-full', isFullScreen && 'fixed inset-0 z-[1300] flex flex-col bg-black')}>
      <div className={cn('relative w-full', isFullScreen ? 'min-h-0 flex-1' : 'h-full')}>{getPlayer()}</div>
      {isFullScreen ? <FullScreenBar onExit={() => onFullScreenChange(false)} /> : null}
    </div>
  );
};
