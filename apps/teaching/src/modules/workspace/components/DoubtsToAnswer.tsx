import { Avatar } from '@components/app/avatars';
import { useSourceName } from '@modules/discussions';
import { ChatsCircleIcon, CheckCircleIcon } from '@phosphor-icons/react';
import { CommentInboxStatus } from '@repo/shared/enums';
import { Card, Skeleton } from '@repo/ui/core';
import { getRelativeTime } from '@repo/ui/lib';
import { useRequest } from '@repo/ui/hooks';
import { useDiscussionLookups, useDiscussionStore } from '@stores';
import Link from 'next/link';
import { useEffect } from 'react';
import { SectionHeader } from './SectionHeader';

/** Threads listed before "View all". */
const LIMIT = 4;

/** The newest learner questions nobody on staff has answered yet, each opening the inbox. */
export const DoubtsToAnswer = () => {
  const { getTopLevelComments, authorMap, needsReplyCount } = useDiscussionLookups();
  const { isLoading } = useRequest(useDiscussionStore, 'comments');
  const getName = useSourceName();
  const threads = getTopLevelComments()
    .filter((comment) => !comment.isAnswered && !comment.isStaff)
    .slice(0, LIMIT);

  useEffect(() => {
    const store = useDiscussionStore.getState();
    store.loadComments({ kind: 'inbox', filters: { status: CommentInboxStatus.NEEDS_REPLY } });
    store.loadNeedsReplyCount();
  }, []);

  return (
    <section>
      <SectionHeader
        title="Doubts to answer"
        count={needsReplyCount}
        hint="Learner questions with no reply from your team yet."
        href="/discussions"
      />
      <Card className="rounded-lg border px-0 py-0">
        {isLoading && !threads.length ? (
          <div className="flex flex-col gap-3 p-4">
            <Skeleton height={36} className="rounded" />
            <Skeleton height={36} className="rounded" />
          </div>
        ) : null}
        {!isLoading && !threads.length ? (
          <div className="flex items-center gap-3 px-4 py-5 text-sm text-muted-foreground">
            <CheckCircleIcon weight="fill" className="h-5 w-5 shrink-0 text-success" />
            All caught up — every question has an answer.
          </div>
        ) : null}
        <ul className="divide-y divide-border">
          {threads.map((thread) => {
            const author = thread.createdBy ? authorMap[thread.createdBy] : undefined;
            const name = author?.name ?? 'Learner';
            const where = [getName(thread.course), getName(thread.material ?? thread.testPaper)]
              .filter(Boolean)
              .join(' · ');
            return (
              <li key={thread._id}>
                <Link
                  href={`/discussions?course=${thread.course}`}
                  className="flex items-start gap-3 px-4 py-3 transition-colors hover:bg-accent/50"
                >
                  <Avatar
                    id={thread.createdBy ?? thread._id}
                    name={name}
                    avatar={author?.avatar}
                    size={32}
                    className="text-xs"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 text-xs">
                      <span className="truncate font-semibold text-foreground">{name}</span>
                      <span className="shrink-0 text-muted-foreground">
                        {thread.createdAt ? getRelativeTime(thread.createdAt) : ''}
                      </span>
                    </div>
                    {where ? <div className="truncate text-xxs text-muted-foreground">{where}</div> : null}
                    <p className="mt-0.5 line-clamp-2 text-sm text-foreground">
                      {thread.body || `${thread.attachments.length} attachment(s)`}
                    </p>
                  </div>
                  <ChatsCircleIcon className="mt-1 h-4 w-4 shrink-0 text-muted-foreground" />
                </Link>
              </li>
            );
          })}
        </ul>
      </Card>
    </section>
  );
};
