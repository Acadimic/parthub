import { BlankState } from '@components/others';
import { ArrowRightIcon, ChatsCircleIcon, StarIcon } from '@phosphor-icons/react';
import { Button, RatingStars, RatingSummary } from '@repo/ui/app';
import { Badge, ExpandableText, Skeleton } from '@repo/ui/core';
import { useRequest } from '@repo/ui/hooks';
import { cn } from '@repo/ui/lib';
import { useDiscussionLookups, useDiscussionStore } from '@stores';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { CommentAuthor, StaffComposer } from './DiscussionParts';
import { ThreadList } from './ThreadList';

type SectionView = 'comments' | 'reviews';

/** The course's reviews, read-only: teachers see what learners say but do not rate their own course. */
const ReviewsView = () => {
  const { rating, getReviews, hasMoreReviews } = useDiscussionLookups();
  const { isLoading: isLoadingMore } = useRequest(useDiscussionStore, 'moreReviews');
  const reviews = getReviews();

  if (!rating) return <Skeleton height={112} className="rounded-xl" />;
  return (
    <div className="grid gap-4 md:grid-cols-[minmax(0,280px)_minmax(0,1fr)] md:items-start">
      <RatingSummary rating={rating} />
      {reviews.length ? (
        <div className="flex flex-col">
          <div className="flex flex-col divide-y divide-border">
            {reviews.map((review) => (
              <div key={review._id} className="flex flex-col gap-1.5 py-4 first:pt-0">
                <CommentAuthor
                  row={review}
                  isEdited={false}
                  context={null}
                  trailing={<RatingStars value={review.rating} className="h-3.5 shrink-0 pt-1" />}
                />
                {review.body ? (
                  <div className="pl-[42px]">
                    <ExpandableText text={review.body} className="whitespace-pre-wrap break-words text-sm" />
                  </div>
                ) : null}
              </div>
            ))}
          </div>
          {hasMoreReviews ? (
            <Button
              isSecondary
              className="self-center px-4 py-1.5 text-xs"
              text="Load more reviews"
              isLoading={isLoadingMore}
              onClick={() => useDiscussionStore.getState().loadMoreReviews()}
            />
          ) : null}
        </div>
      ) : (
        <BlankState label="No reviews yet" description="Learners rate the course from its Discussion tab." />
      )}
    </div>
  );
};

/**
 * A course page's discussion: its threads, with a box to post to the course's learners, and its
 * reviews. The full inbox, across courses and with filters, is the Discussions page.
 */
export const CourseDiscussionSection = ({ courseId }: { courseId: string }) => {
  const [view, setView] = useState<SectionView>('comments');
  const { rating, getTopLevelComments } = useDiscussionLookups();
  const waiting = getTopLevelComments().filter((comment) => !comment.isStaff && !comment.isAnswered).length;
  const load = () => useDiscussionStore.getState().loadComments({ kind: 'course', courseId });

  useEffect(() => {
    load();
    useDiscussionStore.getState().loadReviews(courseId);
  }, [courseId]);

  const views = [
    { key: 'comments' as const, label: 'Comments', icon: <ChatsCircleIcon weight="bold" className="h-3.5 w-3.5" /> },
    {
      key: 'reviews' as const,
      label: rating?.count ? `Reviews · ${rating.average.toFixed(1)}` : 'Reviews',
      icon: <StarIcon weight="fill" className="h-3.5 w-3.5 text-warning" />,
    },
  ];

  return (
    <section className="rounded-lg border border-border bg-background">
      <header className="flex flex-wrap items-center gap-3 border-b border-border px-4 py-3">
        <div className="flex min-w-[10rem] flex-1 items-center gap-2">
          <h2 className="text-sm font-semibold text-foreground">Discussion & reviews</h2>
          {waiting ? (
            <Badge tone="warning" appearance="soft" className="whitespace-nowrap px-1.5 py-0 text-xxs">
              {waiting} need{waiting === 1 ? 's' : ''} a reply
            </Badge>
          ) : null}
        </div>
        <div className="flex gap-1 rounded-lg bg-muted p-1" role="tablist" aria-label="Discussion view">
          {views.map((item) => (
            <Button
              key={item.key}
              role="tab"
              aria-selected={view === item.key}
              isSubtle={view !== item.key}
              className={cn(
                'rounded-md px-3 py-1 text-xs',
                view === item.key ? 'shadow-sm' : 'text-muted-foreground hover:text-foreground',
              )}
              leftsection={item.icon}
              text={item.label}
              onClick={() => setView(item.key)}
            />
          ))}
        </div>
        <Link
          href={`/discussions?course=${courseId}`}
          className="flex items-center gap-1 text-xs font-medium text-primary hover:underline"
        >
          Open in Discussions
          <ArrowRightIcon className="h-3 w-3" />
        </Link>
      </header>
      <div className="flex flex-col gap-3 px-4 py-4">
        {view === 'reviews' ? (
          <ReviewsView />
        ) : (
          <>
            <StaffComposer
              courseId={courseId}
              parentId={null}
              placeholder="Post an update or a tip for this course's learners…"
              isAutoFocus={false}
              onPosted={() => undefined}
              onCancel={null}
            />
            <ThreadList
              isShowingCourse={false}
              onSelectLesson={null}
              emptyLabel="No comments yet"
              emptyDescription="Questions learners post while studying this course will appear here."
              onRetry={load}
            />
          </>
        )}
      </div>
    </section>
  );
};
