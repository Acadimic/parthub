import { type AttachmentDto } from '@repo/shared/contracts';
import { isVideoAttachment } from '@repo/shared/utils';
import { VideoPlayer, ViewUrlContent } from '@components/tools';

interface IProps {
  attachment: AttachmentDto;
  isFullScreen: boolean;
  onFullScreenChange: (isFullScreen: boolean) => void;
}

/**
 * One attachment in the lesson frame: the player for anything `isVideoAttachment` counts as a
 * video — the rule that also orders the reader's pages and labels the lesson — and a document view
 * for the rest. An address is used as it is unless the file was uploaded, which needs signing.
 */
export const AttachmentContent = ({ attachment, isFullScreen, onFullScreenChange }: IProps) => {
  if (isVideoAttachment(attachment)) {
    return (
      <VideoPlayer
        url={attachment.url}
        isStatic={!attachment.isUploaded}
        isFullScreen={isFullScreen}
        onFullScreenChange={onFullScreenChange}
      />
    );
  }
  return (
    <ViewUrlContent
      url={attachment.url}
      isStatic={!attachment.isUploaded}
      isFullScreen={isFullScreen}
      onFullScreenChange={onFullScreenChange}
    />
  );
};
