import { useAttachment } from '@hooks/attachment.hook';
import { type AttachmentDto } from '@repo/shared/contracts';
import { CommentAttachments } from '@repo/ui/app';
import { PresignedImage } from './PresignedImage';

/** A ticket's files, signed through this app's presigned-URL cache. */
export const SignedAttachments = ({ attachments }: { attachments: AttachmentDto[] }) => {
  const { getPresignedUrls } = useAttachment();
  const openFile = async (attachment: AttachmentDto) => {
    const [url] = await getPresignedUrls([attachment.url]);
    if (url) window.open(url, '_blank', 'noopener');
  };
  return (
    <CommentAttachments
      attachments={attachments}
      renderImage={(image) => <PresignedImage url={image.url} className="object-cover" />}
      onOpenFile={openFile}
    />
  );
};
