import { type AttachmentDto } from '@repo/shared/contracts';
import { useState } from 'react';
import { Attachment } from './Attachment';
import { FileViewerModal } from './FileViewerModal';

interface IProps {
  attachments: AttachmentDto[];
  /** Removes this attachment. Absent, the list is read-only. */
  onRemove?: (attachment: AttachmentDto) => void;
  /** Opens a link's editor. Only links are editable; an uploaded file is replaced, not edited. */
  onEdit?: (attachment: AttachmentDto) => void;
  className?: string;
}

/**
 * An entity's attachments as chips, with one viewer for the list. A file opens in the viewer; a
 * link opens in a new tab, because a frame cannot show most third-party pages.
 */
export const Attachments = ({ attachments, onRemove, onEdit, className }: IProps) => {
  const [previewing, setPreviewing] = useState<AttachmentDto | null>(null);
  if (!attachments.length) return null;

  const preview = (attachment: AttachmentDto) => {
    if (attachment.isUploaded) setPreviewing(attachment);
    else if (attachment.url) window.open(attachment.url, '_blank', 'noopener');
  };

  return (
    <>
      <div className={className ?? 'flex w-full max-w-full flex-wrap items-center justify-start gap-1.5'}>
        {attachments.map((attachment, index) => (
          <Attachment
            key={attachment.key || index}
            index={index}
            fileName={attachment.fileName || attachment.url || 'Untitled'}
            extension={attachment.fileExtension}
            url={attachment.url}
            isStatic={!attachment.isUploaded}
            onPreview={attachment.url ? () => preview(attachment) : undefined}
            onEdit={onEdit && !attachment.isUploaded ? () => onEdit(attachment) : undefined}
            onRemove={onRemove ? () => onRemove(attachment) : undefined}
          />
        ))}
      </div>
      <FileViewerModal attachment={previewing} onClose={() => setPreviewing(null)} />
    </>
  );
};
