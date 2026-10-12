import { type AttachmentDto, type TicketDto } from '@repo/shared/contracts';
import { TicketStatus } from '@repo/shared/enums';
import { TICKET_CATEGORY_LABELS, TICKET_REASON_LABELS, TICKET_STATUS_LABELS } from '@repo/shared/utils';
import { type ReactNode } from 'react';
import { Badge, type BadgeTone } from '../../core/Badge';
import { getRelativeTime } from '../../lib/date-time';
import { cn } from '../../lib/cn';

const STATUS_TONE: Record<TicketStatus, BadgeTone> = {
  [TicketStatus.OPEN]: 'warning',
  [TicketStatus.IN_PROGRESS]: 'info',
  [TicketStatus.RESOLVED]: 'success',
  [TicketStatus.DISMISSED]: 'neutral',
};

export const TicketStatusBadge = ({ status }: { status: TicketStatus }) => (
  <Badge tone={STATUS_TONE[status]} withDot>
    {TICKET_STATUS_LABELS[status]}
  </Badge>
);

/** "Question · The marked answer is wrong": what kind of report it is, in one line. */
export const getTicketKind = (ticket: TicketDto): string =>
  `${TICKET_CATEGORY_LABELS[ticket.category]} · ${TICKET_REASON_LABELS[ticket.reason]}`;

interface IListItemProps {
  ticket: TicketDto;
  /** Who raised it, in a staff inbox; null in the reporter's own list. */
  reporterName: string | null;
  isSelected: boolean;
  /** A reply the reader has not opened yet. */
  isUnread: boolean;
  onClick: () => void;
}

/** One row in a list of tickets: the kind, what it is about, its status and when it last moved. */
export const TicketListItem = ({ ticket, reporterName, isSelected, isUnread, onClick }: IListItemProps) => (
  <button
    type="button"
    onClick={onClick}
    className={cn(
      'flex w-full flex-col gap-1 rounded-lg border px-3 py-2.5 text-left transition-colors',
      isSelected ? 'border-primary bg-primary/5' : 'border-border bg-background hover:bg-accent',
    )}
  >
    <span className="flex items-center gap-2">
      {isUnread ? <span className="h-2 w-2 shrink-0 rounded-full bg-primary" aria-label="New reply" /> : null}
      <span className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">{getTicketKind(ticket)}</span>
      {ticket.status ? <TicketStatusBadge status={ticket.status} /> : null}
    </span>
    <span className="truncate text-xs text-muted-foreground">
      {[ticket.code, ticket.targetName || ticket.body, reporterName].filter(Boolean).join(' · ')}
    </span>
    {ticket.updatedAt ? (
      <span className="text-xxs text-muted-foreground">Updated {getRelativeTime(ticket.updatedAt)}</span>
    ) : null}
  </button>
);

interface IThreadProps {
  ticket: TicketDto;
  reporterName: string;
  /** What a staff reply is signed as: "Teacher" in the course's inbox, "Support" elsewhere. */
  staffLabel: string;
  renderAttachments: (attachments: AttachmentDto[]) => ReactNode;
  /** Shown under the header: links to what was reported, staff actions. */
  actions: ReactNode;
  /** The reply box, or a note saying why there is none. */
  footer: ReactNode;
}

interface IThreadMessage {
  _id: string;
  body: string;
  attachments: AttachmentDto[];
  isStaff: boolean;
  createdAt: string;
}

/** A ticket and its replies: the original report first, then the conversation oldest first. */
export const TicketThread = ({
  ticket,
  reporterName,
  staffLabel,
  renderAttachments,
  actions,
  footer,
}: IThreadProps) => {
  const messages: IThreadMessage[] = [
    {
      _id: ticket._id,
      body: ticket.body,
      attachments: ticket.attachments,
      isStaff: false,
      createdAt: ticket.createdAt ?? '',
    },
    ...(ticket.messages ?? []),
  ];
  return (
    <div className="flex flex-col gap-4">
      <header className="flex flex-col gap-2 border-b border-border pb-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-xs text-muted-foreground">{ticket.code}</span>
          {ticket.status ? <TicketStatusBadge status={ticket.status} /> : null}
        </div>
        <h2 className="text-base font-semibold text-foreground">{getTicketKind(ticket)}</h2>
        {ticket.targetName || ticket.courseName ? (
          <p className="text-sm text-muted-foreground">
            {[ticket.targetName, ticket.courseName !== ticket.targetName ? ticket.courseName : '']
              .filter(Boolean)
              .join(' · ')}
          </p>
        ) : null}
        {actions}
      </header>
      <ol className="flex flex-col gap-3">
        {messages.map((message) => (
          <li
            key={message._id}
            className={cn(
              'max-w-[90%] rounded-xl border px-3 py-2.5',
              message.isStaff ? 'self-end border-primary/30 bg-primary/5' : 'self-start border-border bg-muted/40',
            )}
          >
            <p className="mb-1 text-xs font-semibold text-muted-foreground">
              {message.isStaff ? staffLabel : reporterName}
              {message.createdAt ? <span className="font-normal"> · {getRelativeTime(message.createdAt)}</span> : null}
            </p>
            {message.body ? (
              <p className="whitespace-pre-wrap break-words text-sm text-foreground">{message.body}</p>
            ) : null}
            {renderAttachments(message.attachments)}
          </li>
        ))}
      </ol>
      {footer}
    </div>
  );
};
