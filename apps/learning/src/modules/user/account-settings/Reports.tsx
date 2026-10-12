import { SignedAttachments } from '@components/app/attachments';
import { ReportButton, TicketReplyBox } from '@components/app/report';
import { BlankState } from '@components/others';
import { AccountSettingsType, TicketCategory } from '@enums';
import { CaretLeftIcon } from '@phosphor-icons/react';
import { type TicketDto } from '@repo/shared/contracts';
import { AccountSettingsRoutes, TICKET_LIMITS, isActiveTicket } from '@repo/shared/utils';
import { Button, Loader, TicketListItem, TicketThread } from '@repo/ui/app';
import { useLoadOnce } from '@repo/ui/hooks';
import { isUnreadTicket, useTicketStore } from '@stores';
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { SettingsSection } from './SettingsSection';

const DAY_MS = 24 * 60 * 60 * 1000;

/** A closed ticket still takes a reply, which reopens it, for two weeks. */
const canReply = (ticket: TicketDto) =>
  !ticket.status ||
  isActiveTicket(ticket.status) ||
  Date.now() - new Date(ticket.resolvedAt ?? 0).getTime() < TICKET_LIMITS.REOPEN_WINDOW_DAYS * DAY_MS;

const ReportThread = ({ ticketId, onBack }: { ticketId: string; onBack: () => void }) => {
  const ticket = useTicketStore((state) => state.ticketMap[ticketId]);
  const loadTicket = useTicketStore((state) => state.loadTicket);
  const isFailed = useTicketStore((state) => state.isFailed('ticket'));

  useEffect(() => {
    loadTicket(ticketId);
  }, [ticketId, loadTicket]);

  const thread = ticket?.messages ? (
    <TicketThread
      ticket={ticket}
      reporterName="You"
      staffLabel={ticket.ownerOrg && ticket.category !== TicketCategory.PAYMENT ? 'Course team' : 'Support'}
      renderAttachments={(attachments) => <SignedAttachments attachments={attachments} />}
      actions={null}
      footer={
        canReply(ticket) ? (
          <TicketReplyBox
            ticketId={ticket._id}
            onReply={(payload) => useTicketStore.getState().reply(ticket._id, payload)}
          />
        ) : (
          <p className="text-sm text-muted-foreground">
            This report is closed. If the problem is back, raise a new report.
          </p>
        )
      }
    />
  ) : (
    <Loader isLoading />
  );

  return (
    <SettingsSection
      title="Report"
      action={
        <Button
          isSubtle
          text="All reports"
          className="text-sm"
          leftsection={<CaretLeftIcon weight="bold" className="h-4 w-4" />}
          onClick={onBack}
        />
      }
    >
      {isFailed && !ticket?.messages ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          This report could not be opened. It may have been removed.
        </p>
      ) : (
        thread
      )}
    </SettingsSection>
  );
};

/** The learner's reported issues: a list, and the thread of the one open in `?ticket=`. */
export const Reports = () => {
  const { query, push } = useRouter();
  const tickets = useTicketStore(useShallow((state) => state.getTickets()));
  const { isLoading } = useLoadOnce(useTicketStore, 'tickets', (state) => state.loadMyTickets);
  const ticketId = typeof query.ticket === 'string' ? query.ticket : null;
  const route = AccountSettingsRoutes[AccountSettingsType.REPORTS];

  if (ticketId) {
    return <ReportThread ticketId={ticketId} onBack={() => push(route, undefined, { shallow: true })} />;
  }

  return (
    <SettingsSection
      title={AccountSettingsType.REPORTS}
      description="Doubts you asked, problems you reported with questions, lessons, payments or the app, and the replies to them."
      action={
        <ReportButton
          isLabelled
          title="Report a problem"
          description="Something not working in the app, or a question about your account? Tell us and we will reply here."
          target={{ category: TicketCategory.GENERAL }}
        />
      }
    >
      <Loader isLoading={isLoading && !tickets.length} />
      {!isLoading && !tickets.length ? (
        <BlankState
          label="No reports yet"
          description="Ask a doubt or use the flag on a question or lesson, or Report a problem above, and it will show up here."
        />
      ) : null}
      <div className="flex flex-col gap-2">
        {tickets.map((ticket) => (
          <TicketListItem
            key={ticket._id}
            ticket={ticket}
            reporterName={null}
            isSelected={false}
            isUnread={isUnreadTicket(ticket)}
            onClick={() => push({ pathname: route, query: { ticket: ticket._id } }, undefined, { shallow: true })}
          />
        ))}
      </div>
    </SettingsSection>
  );
};
