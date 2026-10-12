import { FileDropZone, Select } from '@components/app/selects';
import { useAttachment } from '@hooks/attachment.hook';
import { InfoIcon } from '@phosphor-icons/react';
import { PositionType, TicketCategory, TicketReason } from '@repo/shared/enums';
import { type TicketDto } from '@repo/shared/contracts';
import { TICKET_LIMITS, TICKET_REASONS, TICKET_REASON_LABELS } from '@repo/shared/utils';
import { CommentComposer, Modal } from '@repo/ui/app';
import { useTicketStore } from '@stores';
import { errorToast, getObjectId, successToast } from '@utils/helpers';
import { useState } from 'react';

/** What a report is about: its category and the ids that locate it. The server checks every one. */
export type ReportTarget = Pick<
  TicketDto,
  'category' | 'course' | 'courseModule' | 'material' | 'testPaper' | 'question' | 'enrollment' | 'order'
>;

interface IProps {
  isOpen: boolean;
  onClose: () => void;
  target: ReportTarget;
  title: string;
  description: string;
}

/** The dialog's wording: a doubt asks for help, everything else reports a problem. */
const getCopy = (category: TicketCategory) =>
  category === TicketCategory.DOUBT
    ? {
        reasonLabel: 'What do you need help with?',
        placeholder: 'Ask your doubt. Say which step or line you are stuck on; a photo of your working helps.',
        submitLabel: 'Send doubt',
        noun: 'Doubt',
        bodyMissing: 'Write your doubt in a line or two.',
      }
    : {
        reasonLabel: 'What is wrong?',
        placeholder: 'Tell us what you saw and what you expected. A screenshot helps.',
        submitLabel: 'Send report',
        noun: 'Report',
        bodyMissing: 'Describe the problem in a line or two.',
      };

/** Raises a ticket: a reason, what went wrong or what is unclear, and up to five screenshots or PDFs. */
export const ReportDialog = ({ isOpen, onClose, target, title, description }: IProps) => {
  const { uploadFilesToS3 } = useAttachment();
  const [reason, setReason] = useState<TicketReason | ''>('');
  const reasons = TICKET_REASONS[target.category];
  const copy = getCopy(target.category);

  // The dialog outlives a close and may reopen for another category, whose reasons differ.
  const close = () => {
    setReason('');
    onClose();
  };

  const submit = async (body: string, files: File[]) => {
    if (!reason) {
      errorToast({ message: `Choose an answer to “${copy.reasonLabel}”` });
      return false;
    }
    if (!body) {
      errorToast({ message: copy.bodyMissing });
      return false;
    }
    const _id = getObjectId();
    const attachments = await uploadFilesToS3(_id, files);
    // The upload toasts its own failure; reporting without the files would lose them silently.
    if (attachments.length !== files.length) return false;
    const ticket = await useTicketStore.getState().createTicket({
      ...target,
      _id,
      reason,
      body,
      attachments,
      pageUrl: window.location.href,
    });
    if (!ticket) return false;
    successToast({ message: `${copy.noun} ${ticket.code} sent. Follow it under Account settings → My Reports.` });
    close();
    return true;
  };

  return (
    <Modal
      title={title}
      position={PositionType.TOP}
      isOpen={isOpen}
      onClose={close}
      component={
        <div className="flex flex-col gap-3 pb-2">
          <Select
            label={copy.reasonLabel}
            placeholder="Choose one"
            required
            withInPortal
            noSort
            isSingleSelect
            values={reason ? [reason] : []}
            items={reasons.map((value) => ({ label: TICKET_REASON_LABELS[value], value }))}
            onChange={(values) => setReason((values[0]?.value as TicketReason | undefined) ?? '')}
          />
          {reason === TicketReason.REFUND_REQUEST ? (
            <p className="text-xs text-muted-foreground">
              Refunds can be requested within {TICKET_LIMITS.REFUND_WINDOW_DAYS} days of payment. Once a refund is
              issued, access to what it bought ends.
            </p>
          ) : null}
          <CommentComposer
            placeholder={copy.placeholder}
            submitLabel={copy.submitLabel}
            rows={4}
            isAutoFocus={false}
            onSubmit={submit}
            // The header's close button already cancels; a second one crowds the footer on a phone.
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
          {/* A note under the form rather than the Modal's description, which is larger than it needs. */}
          <p className="flex items-start gap-1 text-xxs text-muted-foreground">
            <InfoIcon weight="bold" className="mt-px h-3 w-3 shrink-0" aria-hidden="true" />
            {description}
          </p>
        </div>
      }
    />
  );
};
