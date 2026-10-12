import { FileDropZone } from '@components/app/selects';
import { useAttachment } from '@hooks/attachment.hook';
import { TICKET_LIMITS } from '@repo/shared/utils';
import { CommentComposer } from '@repo/ui/app';
import { useTicketStore } from '@stores';

/** A staff reply on a report, with files uploaded only once it is sent. */
export const TicketReplyBox = ({ ticketId }: { ticketId: string }) => {
  const { uploadFilesToS3 } = useAttachment();

  const submit = async (body: string, files: File[]) => {
    // The upload removes what it sent and toasts the reason when any file fails.
    const attachments = await uploadFilesToS3(ticketId, files).catch(() => null);
    if (!attachments) return false;
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
