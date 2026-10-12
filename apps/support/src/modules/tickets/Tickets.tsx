import { SignedAttachments } from '@components/app/attachments';
import { Select } from '@components/app/selects';
import { CaretLeftIcon, LifebuoyIcon } from '@phosphor-icons/react';
import { TicketCategory, TicketInboxStatus } from '@repo/shared/enums';
import { ALL, TICKET_CATEGORY_LABELS, isCourseTicket } from '@repo/shared/utils';
import { Button, Loader, TicketListItem, TicketThread } from '@repo/ui/app';
import { Card } from '@repo/ui/core';
import { cn } from '@repo/ui/lib';
import { useTicketLookups, useTicketStore } from '@stores';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { RefundForm, StatusActions } from './TicketActions';
import { TicketReplyBox } from './TicketReplyBox';

const CATEGORY_ITEMS = [
  { label: 'All kinds', value: ALL },
  ...Object.values(TicketCategory).map((category) => ({ label: TICKET_CATEGORY_LABELS[category], value: category })),
];

const TicketDetail = ({ ticketId, onBack }: { ticketId: string; onBack: () => void }) => {
  const ticket = useTicketStore((state) => state.ticketMap[ticketId]);
  const reporter = useTicketStore((state) => (ticket?.createdBy ? state.reporterMap[ticket.createdBy] : undefined));
  const loadTicket = useTicketStore((state) => state.loadTicket);
  const isFailed = useTicketStore((state) => state.isFailed('ticket'));

  useEffect(() => {
    loadTicket(ticketId);
  }, [ticketId, loadTicket]);

  if (!ticket?.messages) {
    return isFailed ? (
      <p className="py-16 text-center text-sm text-muted-foreground">This ticket could not be opened.</p>
    ) : (
      <Loader isLoading />
    );
  }
  return (
    <div className="flex flex-col gap-3">
      <Button
        isSubtle
        text="All tickets"
        className="self-start text-sm md:hidden"
        leftsection={<CaretLeftIcon weight="bold" className="h-4 w-4" />}
        onClick={onBack}
      />
      <TicketThread
        ticket={ticket}
        reporterName={reporter?.name ?? 'Learner'}
        staffLabel="Staff"
        renderAttachments={(attachments) => <SignedAttachments attachments={attachments} />}
        actions={
          <div className="flex flex-col gap-3 pt-1">
            <p className="text-xs text-muted-foreground">
              {[reporter?.email, isCourseTicket(ticket.category) ? 'The course team can answer this too' : '']
                .filter(Boolean)
                .join(' · ')}
              {ticket.pageUrl ? (
                <>
                  {' · '}
                  <span className="break-all">Reported from {ticket.pageUrl}</span>
                </>
              ) : null}
            </p>
            <StatusActions ticket={ticket} />
            <RefundForm ticket={ticket} />
          </div>
        }
        footer={<TicketReplyBox ticketId={ticket._id} />}
      />
    </div>
  );
};

/** Every reported issue on the platform, for platform staff: payments and refunds first of all. */
export const Tickets = () => {
  const { query, push, pathname } = useRouter();
  const { hasMore, isLoading, isFailed, loadMore, reporterMap } = useTicketLookups();
  const tickets = useTicketStore(useShallow((state) => state.getTickets()));
  const [status, setStatus] = useState(TicketInboxStatus.ACTIVE);
  const [category, setCategory] = useState<string>(ALL);
  const ticketId = typeof query.ticket === 'string' ? query.ticket : null;

  useEffect(() => {
    useTicketStore.getState().loadInbox({
      status,
      ...(category === ALL ? {} : { category: category as TicketCategory }),
    });
  }, [status, category]);

  const open = (id: string | null) => push({ pathname, query: id ? { ticket: id } : {} }, undefined, { shallow: true });

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 pb-16">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
          <LifebuoyIcon weight="fill" className="h-5 w-5" />
        </span>
        <div>
          <h1 className="text-lg font-semibold">Tickets</h1>
          <p className="text-xs text-muted-foreground">
            Payment, refund, general and contact messages from learners, and every content report.
          </p>
        </div>
      </div>
      <Card className="flex flex-wrap items-center gap-3 rounded-lg border px-4 py-3">
        <div className="flex gap-1 rounded-lg bg-muted p-1" role="tablist" aria-label="Which tickets">
          {[
            { key: TicketInboxStatus.ACTIVE, label: 'Open' },
            { key: TicketInboxStatus.ALL, label: 'All tickets' },
          ].map((item) => (
            <Button
              key={item.key}
              role="tab"
              aria-selected={status === item.key}
              isSubtle={status !== item.key}
              className={cn(
                'rounded-md px-3 py-1.5 text-xs',
                status === item.key ? 'shadow-sm' : 'text-muted-foreground hover:text-foreground',
              )}
              text={item.label}
              onClick={() => setStatus(item.key)}
            />
          ))}
        </div>
        <div className="ml-auto w-full sm:w-56">
          <Select
            items={CATEGORY_ITEMS}
            values={[category]}
            onChange={(values) => setCategory(values[0]?.value ?? ALL)}
            isSingleSelect
            noSort
            placeholder="All kinds"
          />
        </div>
      </Card>
      {isFailed('tickets') ? (
        <Card className="rounded-lg border p-6 text-center text-sm text-muted-foreground">
          The tickets could not be loaded. Check that the app&apos;s API key matches the server&apos;s and try again.
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
          <Card className={cn('flex flex-col gap-2 rounded-lg border p-3', ticketId && 'hidden md:flex')}>
            <Loader isLoading={isLoading('tickets') && !tickets.length} />
            {!isLoading('tickets') && !tickets.length ? (
              <p className="px-2 py-8 text-center text-sm text-muted-foreground">Nothing here.</p>
            ) : null}
            {tickets.map((ticket) => (
              <TicketListItem
                key={ticket._id}
                ticket={ticket}
                reporterName={reporterMap[ticket.createdBy ?? '']?.name ?? null}
                isSelected={ticket._id === ticketId}
                isUnread={false}
                onClick={() => open(ticket._id)}
              />
            ))}
            {hasMore ? (
              <Button isSubtle text="Load more" isLoading={isLoading('moreTickets')} onClick={() => loadMore()} />
            ) : null}
          </Card>
          <Card className={cn('rounded-lg border p-4', !ticketId && 'hidden md:block')}>
            {ticketId ? (
              <TicketDetail ticketId={ticketId} onBack={() => open(null)} />
            ) : (
              <p className="py-16 text-center text-sm text-muted-foreground">Choose a ticket to read it.</p>
            )}
          </Card>
        </div>
      )}
    </div>
  );
};
