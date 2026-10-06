import { BlankState } from '@components/others';
import { ChatsCircleIcon, StarIcon } from '@phosphor-icons/react';
import { Button } from '@repo/ui/app';
import { Skeleton } from '@repo/ui/core';
import { useRequest } from '@repo/ui/hooks';
import { cn } from '@repo/ui/lib';
import { useDiscussionLookups, useDiscussionStore } from '@stores';
import { type ReactNode, useEffect, useState } from 'react';
import { CourseReviews } from './CourseReviews';
import { CommentComposer } from './CommentComposer';
import { CommentItem } from './CommentItem';

const CommentSkeleton = () => (
  <div className="flex gap-2.5">
    <Skeleton variant="circle" width={32} height={32} className="shrink-0" />
    <div className="flex flex-1 flex-col gap-2 pt-1">
      <Skeleton width="40%" height={10} className="rounded" />
      <Skeleton width="90%" height={10} className="rounded" />
      <Skeleton width="70%" height={10} className="rounded" />
    </div>
  </div>
);

/** The threads, or whichever of loading, failed and empty stands in for them. */
const CommentList = ({ courseId }: { courseId: string }) => {
  const { getTopLevelComments } = useDiscussionLookups();
  const comments = getTopLevelComments();
  const { isLoading, isFailed } = useRequest(useDiscussionStore, 'comments');

  if (comments.length) {
    return (
      <div className="flex flex-col divide-y divide-border">
        {comments.map((comment) => (
          <div key={comment._id} className="py-4 first:pt-1">
            <CommentItem comment={comment} isReply={false} />
          </div>
        ))}
      </div>
    );
  }
  if (isLoading) {
    return (
      <div className="flex flex-col gap-5 pt-2">
        <CommentSkeleton />
        <CommentSkeleton />
        <CommentSkeleton />
      </div>
    );
  }
  if (isFailed) {
    return (
      <BlankState
        label="The discussion could not be loaded"
        action={
          <Button
            isSecondary
            className="px-3 py-1.5 text-xs"
            text="Try again"
            onClick={() => useDiscussionStore.getState().loadComments(courseId)}
          />
        }
      />
    );
  }
  return <BlankState label="No comments yet" description="Be the first to start a conversation about this course." />;
};

type DiscussionView = 'comments' | 'reviews';

/** Comments and reviews side by side in one tab, switched by a pair of buttons under the title. */
const ViewSwitch = ({ view, onChange }: { view: DiscussionView; onChange: (view: DiscussionView) => void }) => {
  const { rating } = useDiscussionLookups();
  const views: { key: DiscussionView; label: string; icon: ReactNode }[] = [
    { key: 'comments', label: 'Comments', icon: <ChatsCircleIcon weight="bold" className="h-3.5 w-3.5" /> },
    {
      key: 'reviews',
      label: rating?.count ? `Reviews · ${rating.average.toFixed(1)}` : 'Reviews',
      icon: <StarIcon weight="fill" className={cn('h-3.5 w-3.5', view !== 'reviews' && 'text-warning')} />,
    },
  ];
  return (
    <div className="grid grid-cols-2 gap-1 rounded-lg bg-muted p-1" role="tablist" aria-label="Discussion view">
      {views.map((item) => (
        <Button
          key={item.key}
          role="tab"
          aria-selected={view === item.key}
          isSubtle={view !== item.key}
          className={cn(
            'justify-center rounded-md px-3 py-1.5 text-xs',
            view === item.key ? 'shadow-sm' : 'text-muted-foreground hover:text-foreground',
          )}
          leftsection={item.icon}
          text={item.label}
          onClick={() => onChange(item.key)}
        />
      ))}
    </div>
  );
};

/** The course's discussion: comments with their replies, and the course's ratings and reviews. */
export const CourseDiscussion = ({ courseId }: { courseId: string }) => {
  const { hasMoreComments } = useDiscussionLookups();
  const { isLoading: isLoadingMore } = useRequest(useDiscussionStore, 'moreComments');
  const [view, setView] = useState<DiscussionView>('comments');

  // The rating loads with the comments so the Reviews switch can show it before it is opened.
  useEffect(() => {
    const store = useDiscussionStore.getState();
    store.loadComments(courseId);
    store.loadReviews(courseId);
  }, [courseId]);

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex items-center gap-2.5">
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
          <ChatsCircleIcon weight="fill" className="h-5 w-5" />
        </span>
        <div>
          <div className="text-sm font-semibold">Discussion</div>
          <div className="text-xs text-muted-foreground">Ask a question, share what helped, or rate the course.</div>
        </div>
      </div>
      <ViewSwitch view={view} onChange={setView} />
      {view === 'reviews' ? (
        <CourseReviews courseId={courseId} />
      ) : (
        <>
          <CommentComposer
            courseId={courseId}
            parentId={null}
            placeholder="Start a discussion…"
            isAutoFocus={false}
            onPosted={() => undefined}
            onCancel={null}
          />
          <CommentList courseId={courseId} />
          {hasMoreComments ? (
            <Button
              isSecondary
              className="self-center px-4 py-1.5 text-xs"
              text="Load older comments"
              isLoading={isLoadingMore}
              onClick={() => useDiscussionStore.getState().loadMoreComments()}
            />
          ) : null}
        </>
      )}
    </div>
  );
};
