import { BlankState } from '@components/others';
import { type CourseCommentDto } from '@repo/shared/contracts';
import { Button } from '@repo/ui/app';
import { Skeleton } from '@repo/ui/core';
import { useRequest } from '@repo/ui/hooks';
import { useDiscussionLookups, useDiscussionStore } from '@stores';
import { DiscussionThread } from './DiscussionThread';

const ThreadSkeleton = () => (
  <div className="flex gap-2.5 py-4">
    <Skeleton variant="circle" width={32} height={32} className="shrink-0" />
    <div className="flex flex-1 flex-col gap-2 pt-1">
      <Skeleton width="30%" height={10} className="rounded" />
      <Skeleton width="85%" height={10} className="rounded" />
      <Skeleton width="60%" height={10} className="rounded" />
    </div>
  </div>
);

interface IProps {
  isShowingCourse: boolean;
  onSelectLesson: ((comment: CourseCommentDto) => void) | null;
  emptyLabel: string;
  emptyDescription: string;
  onRetry: () => void;
}

/** The threads the store holds, newest first, or whichever of loading, failed and empty stands in. */
export const ThreadList = ({ isShowingCourse, onSelectLesson, emptyLabel, emptyDescription, onRetry }: IProps) => {
  const { getTopLevelComments, hasMoreComments } = useDiscussionLookups();
  const { isLoading, isFailed } = useRequest(useDiscussionStore, 'comments');
  const { isLoading: isLoadingMore } = useRequest(useDiscussionStore, 'moreComments');
  const threads = getTopLevelComments();

  if (!threads.length) {
    if (isLoading) {
      return (
        <div className="flex flex-col divide-y divide-border">
          <ThreadSkeleton />
          <ThreadSkeleton />
          <ThreadSkeleton />
        </div>
      );
    }
    if (isFailed) {
      return (
        <BlankState
          label="The discussion could not be loaded"
          action={<Button isSecondary className="px-3 py-1.5 text-xs" text="Try again" onClick={onRetry} />}
        />
      );
    }
    return <BlankState label={emptyLabel} description={emptyDescription} />;
  }

  return (
    <div className="flex flex-col">
      <div className="flex flex-col divide-y divide-border">
        {threads.map((thread) => (
          <div key={thread._id} className="py-4">
            <DiscussionThread
              comment={thread}
              isReply={false}
              isShowingCourse={isShowingCourse}
              onSelectLesson={onSelectLesson}
            />
          </div>
        ))}
      </div>
      {hasMoreComments ? (
        <Button
          isSecondary
          className="mt-2 self-center px-4 py-1.5 text-xs"
          text="Load older comments"
          isLoading={isLoadingMore}
          onClick={() => useDiscussionStore.getState().loadMoreComments()}
        />
      ) : null}
    </div>
  );
};
