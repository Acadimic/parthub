import { FileDropZone } from '@components/app/selects';
import { useAttachment } from '@hooks/attachment.hook';
import { type TicketReplyDto } from '@repo/shared/contracts';
import { TICKET_LIMITS } from '@repo/shared/utils';
import { CommentComposer } from '@repo/ui/app';

interface IProps {
  ticketId: string;
  /** Posts the reply; resolves to whether it was saved, which clears the box. */
  onReply: (payload: TicketReplyDto) => Promise<boolean>;
}

/** A reply on a ticket, with files uploaded only once it is sent. */
export const TicketReplyBox = ({ ticketId, onReply }: IProps) => {
  const { uploadFilesToS3 } = useAttachment();

  const submit = async (body: string, files: File[]) => {
    const attachments = await uploadFilesToS3(ticketId, files);
    if (attachments.length !== files.length) return false;
    return onReply({ body, attachments });
  };

  return (
    <CommentComposer
      placeholder="Write a reply"
      submitLabel="Reply"
      rows={3}
      isAutoFocus={false}
      onSubmit={submit}
      onCancel={null}
      renderFilePicker={(trigger, onPick) => (
        <FileDropZone
          selectedFiles={[]}
          setSelectedFiles={onPick}
          maxFiles={TICKET_LIMITS.MAX_ATTACHMENTS}
          hidePreview
          isImage
          isPdf
        >
          {trigger}
        </FileDropZone>
      )}
    />
  );
};
