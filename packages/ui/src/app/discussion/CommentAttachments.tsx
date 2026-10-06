import { FilePdfIcon } from '@phosphor-icons/react';
import { type AttachmentDto } from '@repo/shared/contracts';
import { isDiscussionImage } from '@repo/shared/utils';
import { type ReactNode } from 'react';

interface IProps {
  attachments: AttachmentDto[];
  /** Draws one image; the app's presigned image signs its address. */
  renderImage: (attachment: AttachmentDto) => ReactNode;
  /** Opens a PDF, typically signing its address and opening it in a new tab. */
  onOpenFile: (attachment: AttachmentDto) => void;
}

/** A comment's files: images as a thumbnail grid, PDFs as chips. */
export const CommentAttachments = ({ attachments, renderImage, onOpenFile }: IProps) => {
  const images = attachments.filter((attachment) => isDiscussionImage(attachment.fileExtension));
  const files = attachments.filter((attachment) => !isDiscussionImage(attachment.fileExtension));
  if (!attachments.length) return null;
  return (
    <div className="mt-2 flex flex-col gap-2">
      {images.length ? (
        <div className={images.length === 1 ? 'max-w-[240px]' : 'grid max-w-[360px] grid-cols-3 gap-1.5'}>
          {images.map((image) => (
            <div
              key={image.key}
              title={image.fileName}
              className="aspect-square overflow-hidden rounded-lg border border-border transition-opacity hover:opacity-90"
            >
              {renderImage(image)}
            </div>
          ))}
        </div>
      ) : null}
      {files.map((file) => (
        <button
          key={file.key}
          type="button"
          onClick={() => onOpenFile(file)}
          className="flex max-w-full items-center gap-2 self-start rounded-lg border border-border bg-muted/50 px-2.5 py-1.5 text-left text-xs font-medium transition-colors hover:bg-accent"
        >
          <FilePdfIcon weight="fill" className="h-4 w-4 shrink-0 text-destructive" />
          <span className="truncate">{file.fileName}</span>
        </button>
      ))}
    </div>
  );
};
