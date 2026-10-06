import { PresignedImage } from '@components/app/attachments';
import { useAttachment } from '@hooks/attachment.hook';
import { type AttachmentDto } from '@repo/shared/contracts';
import { CommentAttachments as SharedAttachments } from '@repo/ui/app';

/** A comment's files, signed through this app's presigned-URL cache. */
export const CommentAttachments = ({ attachments }: { attachments: AttachmentDto[] }) => {
  const { getPresignedUrls } = useAttachment();
  const openFile = async (attachment: AttachmentDto) => {
    const [url] = await getPresignedUrls([attachment.url]);
    if (url) window.open(url, '_blank', 'noopener');
  };
  return (
    <SharedAttachments
      attachments={attachments}
      renderImage={(image) => <PresignedImage url={image.url} className="object-cover" />}
      onOpenFile={openFile}
    />
  );
};
