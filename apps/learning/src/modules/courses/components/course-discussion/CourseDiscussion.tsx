import { BlankState } from '@components/others';
import { Button } from '@repo/ui/app';
import { Skeleton } from '@repo/ui/core';
import { useRequest } from '@repo/ui/hooks';
import { useDiscussionLookups, useDiscussionStore } from '@stores';
import { useEffect } from 'react';
import { type CommentSourceIds, CommentComposer } from './CommentComposer';
import { CommentItem } from './CommentItem';
import { CourseRatingRow } from './CourseReviews';
import { useOpenItem } from './useOpenItem';

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

/**
 * The course's public discussion in the outline pane: its rating in one line, then every thread on
 * the course. A new thread is recorded against the lesson in the frame, which its chip then names.
 * A private question for the course team is the Doubts tab beside this one.
 */
export const CourseDiscussion = ({ courseId }: { courseId: string }) => {
  const { hasMoreComments } = useDiscussionLookups();
  const { isLoading: isLoadingMore } = useRequest(useDiscussionStore, 'moreComments');
  const open = useOpenItem(courseId);
  const source: CommentSourceIds = open
    ? { courseModule: open.courseModule, material: open.material, testPaper: open.testPaper }
    : null;

  useEffect(() => {
    useDiscussionStore.getState().loadComments(courseId);
  }, [courseId]);

  return (
    <div className="flex flex-col gap-3 p-4">
      <CourseRatingRow courseId={courseId} />
      <div className="flex flex-col gap-1.5">
        <div>
          <div className="text-xs font-semibold">Start a discussion</div>
          <div className="text-xxs text-muted-foreground">Everyone on the course can read and reply.</div>
        </div>
        <CommentComposer
          courseId={courseId}
          parentId={null}
          source={source}
          placeholder="Ask a question or share what helped you…"
          isAutoFocus={false}
          onPosted={() => undefined}
          onCancel={null}
        />
      </div>
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
    </div>
  );
};
