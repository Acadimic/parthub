import { BlankState } from '@components/others';
import { useAttachment } from '@hooks/attachment.hook';
import { XIcon } from '@phosphor-icons/react';
import { Button, Loader } from '@repo/ui/app';
import { useCloseOnBack } from '@repo/ui/hooks';
import { cn } from '@repo/ui/lib';
import { useEffect, useState } from 'react';
import ReactPlayer from 'react-player';

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

  // Besides the overlaid close button, the back button and Escape are the way out.
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
  // restarts playback. The same node is pinned over the page instead, at the modal's layer.
  return (
    <div className={cn('relative h-full w-full', isFullScreen && 'fixed inset-0 z-[1300] bg-black')}>
      {getPlayer()}
      {isFullScreen ? (
        // Top right, clear of the player's own controls along the bottom. Dark over the video,
        // whatever the theme, since the backdrop is black in both.
        <Button
          isSubtle
          isRound
          aria-label="Exit full screen"
          className="absolute right-3 top-3 h-10 w-10 !bg-black/60 !text-white hover:!bg-black/80"
          onClick={() => onFullScreenChange(false)}
          leftsection={<XIcon weight="bold" className="h-5 w-5" />}
        />
      ) : null}
    </div>
  );
};
