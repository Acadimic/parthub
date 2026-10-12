import { FileDropZone } from '@components/app/selects';
import { useAttachment } from '@hooks/attachment.hook';
import { TICKET_LIMITS } from '@repo/shared/utils';
import { CommentComposer } from '@repo/ui/app';
import { useTicketStore } from '@stores';

/** A support reply on a ticket, with files uploaded only once it is sent. */
export const TicketReplyBox = ({ ticketId }: { ticketId: string }) => {
  const { uploadFilesToS3 } = useAttachment();

  const submit = async (body: string, files: File[]) => {
    const attachments = await uploadFilesToS3(ticketId, files);
    // The upload toasts its own failure; replying without the files would lose them silently.
    if (attachments.length !== files.length) return false;
    return useTicketStore.getState().reply(ticketId, { body, attachments });
  };

  return (
    <CommentComposer
      placeholder="Reply to the learner"
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
