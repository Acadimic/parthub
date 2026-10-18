import { FileDropZone, Select } from '@components/app/selects';
import { AccountSettingsType, TicketCategory, TicketReason } from '@enums';
import { useAttachment } from '@hooks/attachment.hook';
import { CaretRightIcon, ChatCircleDotsIcon } from '@phosphor-icons/react';
import { type TicketDto } from '@repo/shared/contracts';
import {
  ACTIVE_TICKET_STATUSES,
  AccountSettingsRoutes,
  TICKET_LIMITS,
  TICKET_REASON_LABELS,
  TICKET_REASONS,
} from '@repo/shared/utils';
import { Button, CommentComposer, TicketStatusBadge } from '@repo/ui/app';
import { Badge } from '@repo/ui/core';
import { useLoadOnce } from '@repo/ui/hooks';
import { cn, getRelativeTime } from '@repo/ui/lib';
import { isUnreadTicket, useTicketStore } from '@stores';
import { errorToast, getObjectId, successToast } from '@utils/helpers';
import { useRouter } from 'next/router';
import { useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { type IOpenItem, useOpenItem } from './useOpenItem';

/** How many doubts the tab lists before pointing at Help & support for the rest. */
const VISIBLE_DOUBTS = 8;

/** What a doubt asked from here is about, for the box's heading. */
const getThing = (open: IOpenItem | null): string => {
  if (!open) return 'course';
  return open.isTest ? 'test' : 'lesson';
};

const REASON_ITEMS = TICKET_REASONS[TicketCategory.DOUBT].map((value) => ({
  label: TICKET_REASON_LABELS[value],
  value,
}));

/** Asks a doubt about the lesson in the frame, or the course when nothing is open: a reason, the doubt, and files. */
const DoubtComposer = ({ courseId, open }: { courseId: string; open: IOpenItem | null }) => {
  const { uploadFilesToS3 } = useAttachment();
  // The most common reason is picked already, so a doubt is one box away.
  const [reason, setReason] = useState<TicketReason>(TicketReason.CONCEPT_UNCLEAR);
  const thing = getThing(open);

  const submit = async (body: string, files: File[]) => {
    if (!body) {
      errorToast({ message: 'Write your doubt in a line or two.' });
      return false;
    }
    const _id = getObjectId();
    const attachments = await uploadFilesToS3(_id, files);
    // The upload toasts its own failure; sending without the files would lose them silently.
    if (attachments.length !== files.length) return false;
    const ticket = await useTicketStore.getState().createTicket({
      _id,
      category: TicketCategory.DOUBT,
      reason,
      body,
      attachments,
      course: courseId,
      courseModule: open?.courseModule ?? null,
      material: open?.material ?? null,
      testPaper: open?.testPaper ?? null,
      pageUrl: window.location.href,
    });
    if (!ticket) return false;
    successToast({ message: `Doubt ${ticket.code} sent to the course team.` });
    setReason(TicketReason.CONCEPT_UNCLEAR);
    return true;
  };

  return (
    <section className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
      <header className="flex items-center gap-3 border-b border-border bg-gradient-to-r from-primary/10 to-transparent px-4 py-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
          <ChatCircleDotsIcon weight="fill" className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <div className="text-sm font-semibold">Ask a doubt</div>
          <div className="truncate text-xs text-muted-foreground">
            {open ? `About this ${thing} · ${open.name}` : 'About this course'}
          </div>
        </div>
      </header>
      <div className="flex flex-col gap-3 px-4 py-3">
        <Select
          placeholder="What do you need help with?"
          // The pane is narrow: smaller text, and the reasons are sentences, not names to title-case.
          className="[&_*]:text-xs [&_*]:normal-case"
          panelClassName="[&_*]:text-xs [&_*]:normal-case"
          noSearch
          noSort
          isSingleSelect
          values={[reason]}
          items={REASON_ITEMS}
          // `ISelectItem.value` is a string; the items are built from the enum, so this narrows what it already is.
          onChange={(values) =>
            setReason((values[0]?.value as TicketReason | undefined) ?? TicketReason.CONCEPT_UNCLEAR)
          }
        />
        <CommentComposer
          placeholder="Say which step or line you are stuck on; a photo of your working helps."
          submitLabel="Send doubt"
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
      </div>
    </section>
  );
};

const DoubtRow = ({ ticket, onOpen }: { ticket: TicketDto; onOpen: () => void }) => {
  const isUnread = isUnreadTicket(ticket);
  const when = ticket.updatedAt ? getRelativeTime(ticket.updatedAt) : '';
  return (
    <button
      type="button"
      onClick={onOpen}
      className="group flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-accent"
    >
      <span className={cn('mt-1.5 h-2 w-2 shrink-0 rounded-full', isUnread ? 'bg-primary' : 'bg-border')} />
      {isUnread ? <span className="sr-only">New reply</span> : null}
      <span className="min-w-0 flex-1">
        <span className={cn('line-clamp-2 text-sm', isUnread ? 'font-semibold text-foreground' : 'text-foreground')}>
          {ticket.body}
        </span>
        <span className="mt-0.5 block truncate text-xxs text-muted-foreground">
          {[ticket.targetName, when].filter(Boolean).join(' · ')}
        </span>
      </span>
      <span className="flex shrink-0 items-center gap-1 pt-0.5">
        {ticket.status ? <TicketStatusBadge status={ticket.status} /> : null}
        <CaretRightIcon
          weight="bold"
          className="h-3 w-3 text-muted-foreground transition-transform group-hover:translate-x-0.5"
        />
      </span>
    </button>
  );
};

/** The learner's doubts on this course, newest first; each opens its thread under Help & support. */
const DoubtList = ({ courseId }: { courseId: string }) => {
  const { push } = useRouter();
  const { isLoading } = useLoadOnce(useTicketStore, 'tickets', (state) => state.loadMyTickets);
  const doubts = useTicketStore(
    useShallow((state) =>
      state.getTickets().filter((ticket) => ticket.category === TicketCategory.DOUBT && ticket.course === courseId),
    ),
  );
  const openCount = doubts.filter((ticket) => ticket.status && ACTIVE_TICKET_STATUSES.includes(ticket.status)).length;
  const reportsRoute = AccountSettingsRoutes[AccountSettingsType.REPORTS];

  if (!doubts.length) {
    if (isLoading) return null;
    return (
      <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-border px-4 py-6 text-center">
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <ChatCircleDotsIcon className="h-4 w-4" />
        </span>
        <p className="text-sm font-medium">No doubts yet</p>
        <p className="text-xs text-muted-foreground">Stuck on something? Ask above and the course team will reply.</p>
      </div>
    );
  }
  return (
    <section className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
      <header className="flex items-center justify-between gap-3 border-b border-border px-4 py-2.5">
        <span className="text-sm font-semibold">Your doubts</span>
        <Badge tone={openCount ? 'warning' : 'neutral'}>{openCount ? `${openCount} open` : 'All answered'}</Badge>
      </header>
      <div className="flex flex-col divide-y divide-border">
        {doubts.slice(0, VISIBLE_DOUBTS).map((ticket) => (
          <DoubtRow
            key={ticket._id}
            ticket={ticket}
            onOpen={() => push({ pathname: reportsRoute, query: { ticket: ticket._id } })}
          />
        ))}
        {doubts.length > VISIBLE_DOUBTS ? (
          <Button
            isSubtle
            className="justify-center py-2 text-xs text-primary"
            text={`All ${doubts.length} doubts`}
            onClick={() => push(reportsRoute)}
          />
        ) : null}
      </div>
    </section>
  );
};

/**
 * The outline pane's Doubts tab: a box to ask the course team about the lesson in the frame, and
 * the learner's doubts so far. Doubts are private tickets, so their threads live under Help & support;
 * the public conversation is the Discussion tab beside this one.
 */
export const CourseDoubts = ({ courseId }: { courseId: string }) => {
  const open = useOpenItem(courseId);
  return (
    <div className="flex flex-col gap-3 p-4">
      <DoubtComposer courseId={courseId} open={open} />
      <DoubtList courseId={courseId} />
    </div>
  );
};
