import { Select } from '@components/app/selects';
import { CommentFiles } from '@modules/discussions/components';
import { CaretLeftIcon, FlagIcon } from '@phosphor-icons/react';
import { type TicketDto } from '@repo/shared/contracts';
import { TicketCategory, TicketInboxStatus, TicketStatus } from '@repo/shared/enums';
import { ALL, TICKET_CATEGORY_LABELS, isActiveTicket, isCourseTicket } from '@repo/shared/utils';
import { Button, Link, Loader, TicketListItem, TicketThread } from '@repo/ui/app';
import { Card } from '@repo/ui/core';
import { cn } from '@repo/ui/lib';
import { useTicketLookups, useTicketStore } from '@stores';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { TicketReplyBox } from './TicketReplyBox';

const CATEGORY_ITEMS = [
  { label: 'All kinds', value: ALL },
  ...[TicketCategory.DOUBT, TicketCategory.QUESTION, TicketCategory.CONTENT, TicketCategory.PAYMENT].map(
    (category) => ({
      label: TICKET_CATEGORY_LABELS[category],
      value: category,
    }),
  ),
];

/** Where the teacher fixes what was reported. */
const TargetLink = ({ ticket }: { ticket: TicketDto }) => {
  if (ticket.testPaper) return <Link href={`/test-papers/${ticket.testPaper}`}>Open the test paper</Link>;
  if (ticket.course) return <Link href={`/courses/${ticket.course}`}>Open the course</Link>;
  return null;
};

/** Resolve, dismiss or reopen a question or content report. */
const StatusActions = ({ ticket }: { ticket: TicketDto }) => {
  const [isSaving, setIsSaving] = useState(false);
  const setStatus = async (status: TicketStatus) => {
    setIsSaving(true);
    await useTicketStore.getState().setStatus(ticket._id, status);
    setIsSaving(false);
  };
  if (ticket.status && !isActiveTicket(ticket.status)) {
    return (
      <Button isSecondary text="Reopen" isLoading={isSaving} onClick={() => setStatus(TicketStatus.IN_PROGRESS)} />
    );
  }
  return (
    <div className="flex gap-2">
      <Button text="Mark resolved" isLoading={isSaving} onClick={() => setStatus(TicketStatus.RESOLVED)} />
      <Button isSubtle text="Dismiss" disabled={isSaving} onClick={() => setStatus(TicketStatus.DISMISSED)} />
    </div>
  );
};

const ReportDetail = ({ ticketId, onBack }: { ticketId: string; onBack: () => void }) => {
  const ticket = useTicketStore((state) => state.ticketMap[ticketId]);
  const reporter = useTicketStore((state) => (ticket?.createdBy ? state.reporterMap[ticket.createdBy] : undefined));
  const loadTicket = useTicketStore((state) => state.loadTicket);
  const isFailed = useTicketStore((state) => state.isFailed('ticket'));

  useEffect(() => {
    loadTicket(ticketId);
  }, [ticketId, loadTicket]);

  if (!ticket?.messages) {
    return isFailed ? (
      <p className="py-16 text-center text-sm text-muted-foreground">This report could not be opened.</p>
    ) : (
      <Loader isLoading />
    );
  }
  const isHandledHere = isCourseTicket(ticket.category);
  return (
    <div className="flex flex-col gap-3">
      <Button
        isSubtle
        text="All reports"
        className="self-start text-sm md:hidden"
        leftsection={<CaretLeftIcon weight="bold" className="h-4 w-4" />}
        onClick={onBack}
      />
      <TicketThread
        ticket={ticket}
        reporterName={reporter?.name ?? 'Learner'}
        staffLabel="Staff"
        renderAttachments={(attachments) => <CommentFiles attachments={attachments} />}
        actions={
          <div className="flex flex-wrap items-center gap-3 pt-1">
            {isHandledHere ? <StatusActions ticket={ticket} /> : null}
            <TargetLink ticket={ticket} />
          </div>
        }
        footer={
          isHandledHere ? (
            <TicketReplyBox ticketId={ticket._id} />
          ) : (
            <p className="rounded-lg bg-muted/60 px-3 py-2 text-sm text-muted-foreground">
              Platform support handles payment reports and refunds. You can follow this one here.
            </p>
          )
        }
      />
    </div>
  );
};

/**
 * Doubts learners asked privately and problems they reported with the organization's questions and
 * lessons, which the teacher answers and fixes, and payment reports about its sales, which platform
 * support handles.
 */
export const Reports = () => {
  const { query, push, pathname } = useRouter();
  const { activeCount, hasMore, isLoading, isFailed, loadMore, reporterMap } = useTicketLookups();
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

  useEffect(() => {
    useTicketStore.getState().loadActiveCount();
  }, []);

  const open = (id: string | null) => push({ pathname, query: id ? { ticket: id } : {} }, undefined, { shallow: true });
  const statuses = [
    { key: TicketInboxStatus.ACTIVE, label: 'Open', count: activeCount },
    { key: TicketInboxStatus.ALL, label: 'All reports', count: 0 },
  ];

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 pb-16">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
          <FlagIcon weight="fill" className="h-5 w-5" />
        </span>
        <div>
          <h1 className="text-lg font-semibold">Doubts & Reports</h1>
          <p className="text-xs text-muted-foreground">
            Doubts learners asked privately, and problems they found in your questions and lessons. Reply, fix the
            content, and mark each one resolved.
          </p>
        </div>
      </div>
      <Card className="flex flex-wrap items-center gap-3 rounded-lg border px-4 py-3">
        <div className="flex gap-1 rounded-lg bg-muted p-1" role="tablist" aria-label="Which reports">
          {statuses.map((item) => (
            <Button
              key={item.key}
              role="tab"
              aria-selected={status === item.key}
              isSubtle={status !== item.key}
              className={cn(
                'rounded-md px-3 py-1.5 text-xs',
                status === item.key ? 'shadow-sm' : 'text-muted-foreground hover:text-foreground',
              )}
              text={item.count ? `${item.label} · ${item.count}` : item.label}
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
          The reports could not be loaded. Try again in a moment.
        </Card>
      ) : null}
      <div
        className={cn(
          'grid grid-cols-1 gap-4 md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]',
          isFailed('tickets') && 'hidden',
        )}
      >
        <Card className={cn('flex flex-col gap-2 rounded-lg border p-3', ticketId && 'hidden md:flex')}>
          <Loader isLoading={isLoading('tickets') && !tickets.length} />
          {!isLoading('tickets') && !isFailed('tickets') && !tickets.length ? (
            <p className="px-2 py-8 text-center text-sm text-muted-foreground">
              {status === TicketInboxStatus.ACTIVE ? 'Nothing open. All caught up.' : 'No reports yet.'}
            </p>
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
            <ReportDetail ticketId={ticketId} onBack={() => open(null)} />
          ) : (
            <p className="py-16 text-center text-sm text-muted-foreground">Choose a report to read it.</p>
          )}
        </Card>
      </div>
    </div>
  );
};
