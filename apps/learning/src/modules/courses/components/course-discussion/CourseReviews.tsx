import { BlankState } from '@components/others';
import { CollectionType } from '@enums';
import { PencilSimpleIcon, TrashIcon } from '@phosphor-icons/react';
import { type CourseReviewDto } from '@repo/shared/contracts';
import { Button, RatingStars, RatingSummary, SoftConfirmModal } from '@repo/ui/app';
import { ExpandableText, Skeleton } from '@repo/ui/core';
import { useRequest } from '@repo/ui/hooks';
import { useDiscussionLookups, useDiscussionStore, useSelectedUser } from '@stores';
import { useEffect, useState } from 'react';
import { DiscussionAuthorLine, isEdited } from './DiscussionAuthorLine';
import { ReviewForm } from './ReviewForm';
import { LikeButton } from './LikeButton';

const ReviewItem = ({ review, isMine }: { review: CourseReviewDto; isMine: boolean }) => {
  const { getAuthor } = useDiscussionLookups();
  return (
    <div className="flex flex-col gap-1.5">
      <DiscussionAuthorLine
        userId={review.createdBy ?? review._id}
        author={review.createdBy ? getAuthor(review.createdBy) : undefined}
        isMine={isMine}
        createdAt={review.createdAt}
        isEdited={isEdited(review)}
        trailing={<RatingStars value={review.rating} className="h-3.5 shrink-0 pt-1" />}
      />
      {review.body ? (
        <div className="pl-[42px]">
          <ExpandableText text={review.body} className="whitespace-pre-wrap break-words text-sm text-foreground" />
        </div>
      ) : null}
      <div className="pl-[42px]">
        <LikeButton itemId={review._id} collectionRef={CollectionType.COURSE_REVIEW} />
      </div>
    </div>
  );
};

/** The learner's own review: a form until they write one, then the review with Edit and Delete. */
export const MyReview = ({ courseId, review }: { courseId: string; review: CourseReviewDto | null }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const remove = async () => {
    if (!review) return;
    setIsDeleting(true);
    const isDeleted = await useDiscussionStore.getState().saveReview({ ...review, _deleted: true });
    setIsDeleting(false);
    if (isDeleted) setIsConfirmingDelete(false);
  };

  if (!review || isEditing) {
    return (
      <div className="rounded-xl border border-primary/30 bg-primary/5 p-4">
        <div className="mb-2 text-sm font-semibold">{review ? 'Edit your review' : 'Rate this course'}</div>
        {review ? null : (
          <p className="mb-3 text-xs text-muted-foreground">
            Your rating helps other learners choose, and your teacher improve.
          </p>
        )}
        <ReviewForm
          courseId={courseId}
          review={review}
          onDone={() => setIsEditing(false)}
          onCancel={review ? () => setIsEditing(false) : null}
        />
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-caps text-muted-foreground">Your review</span>
        <div className="flex items-center gap-1">
          <Button
            isSubtle
            aria-label="Edit your review"
            className="rounded-full p-1.5 text-muted-foreground hover:text-foreground"
            leftsection={<PencilSimpleIcon className="h-4 w-4" />}
            onClick={() => setIsEditing(true)}
          />
          <Button
            isSubtle
            aria-label="Delete your review"
            className="rounded-full p-1.5 text-muted-foreground hover:text-destructive"
            leftsection={<TrashIcon className="h-4 w-4" />}
            onClick={() => setIsConfirmingDelete(true)}
          />
        </div>
      </div>
      <ReviewItem review={review} isMine />
      <SoftConfirmModal
        isOpen={isConfirmingDelete}
        isDestructive
        isLoading={isDeleting}
        confirmText="Delete"
        title="Delete your review"
        description="Your rating will no longer count towards the course's average."
        onCancel={() => setIsConfirmingDelete(false)}
        onConfirm={remove}
      />
    </div>
  );
};

/** Everyone else's reviews newest first, with a button for the next page. */
const ReviewList = ({ excludeUserId }: { excludeUserId: string | null }) => {
  const { getReviews, hasMoreReviews } = useDiscussionLookups();
  const { isLoading: isLoadingMore } = useRequest(useDiscussionStore, 'moreReviews');
  const reviews = getReviews().filter((review) => review.createdBy !== excludeUserId);

  if (!reviews.length) {
    // With the learner's own review shown beside the list, an empty list means nobody else's.
    const label = excludeUserId ? 'No other reviews yet' : 'No reviews yet';
    return <BlankState label={label} description="Reviews from learners will appear here." />;
  }
  return (
    <div className="flex flex-col">
      <div className="flex flex-col divide-y divide-border">
        {reviews.map((review) => (
          <div key={review._id} className="py-4">
            <ReviewItem review={review} isMine={false} />
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
  );
};

/** Stands in for the reviews while the rating loads, or after it failed. */
const ReviewsPending = ({ onRetry }: { onRetry: () => void }) => {
  const { isFailed } = useRequest(useDiscussionStore, 'rating');
  if (isFailed) {
    return (
      <BlankState
        label="Reviews could not be loaded"
        action={<Button isSecondary className="px-3 py-1.5 text-xs" text="Try again" onClick={onRetry} />}
      />
    );
  }
  return (
    <div className="flex flex-col gap-4">
      <Skeleton height={112} className="rounded-xl" />
      <Skeleton height={160} className="rounded-xl" />
    </div>
  );
};

/** The rating, the learner's own review, and everyone else's: the Reviews view of the Discussion tab. */
export const CourseReviews = ({ courseId }: { courseId: string }) => {
  const selectedUser = useSelectedUser();
  const { rating, myReview } = useDiscussionLookups();
  const load = () => useDiscussionStore.getState().loadReviews(courseId);

  // Loaded by `CourseDiscussion`, which shows the rating on its switch before this view opens.
  if (!rating) return <ReviewsPending onRetry={load} />;
  return (
    <div className="flex flex-col gap-4">
      <RatingSummary rating={rating} />
      <MyReview key={myReview?._id ?? 'new'} courseId={courseId} review={myReview} />
      <ReviewList excludeUserId={selectedUser?._id ?? null} />
    </div>
  );
};

interface ISectionProps {
  courseId: string;
  /** A signed-in learner who may open the course can rate it here; everyone else reads. */
  canReview: boolean;
}

/**
 * The course page's Reviews section. A visitor with no session reads the published reviews; a
 * signed-in learner gets their own review back too, and may write one when they can open the course.
 */
export const CourseReviewsSection = ({ courseId, canReview }: ISectionProps) => {
  const selectedUser = useSelectedUser();
  const isSignedIn = Boolean(selectedUser);
  const { rating, myReview } = useDiscussionLookups();
  const load = () => {
    const store = useDiscussionStore.getState();
    return isSignedIn ? store.loadReviews(courseId) : store.loadPublishedReviews(courseId);
  };

  useEffect(() => {
    load();
  }, [courseId, isSignedIn]);

  return (
    <section id="reviews" className="flex scroll-mt-24 flex-col gap-3">
      <h2 className="text-lg font-semibold">Reviews</h2>
      {rating ? (
        <div className="grid gap-4 md:grid-cols-[minmax(0,280px)_minmax(0,1fr)] md:items-start">
          <div className="flex flex-col gap-4 md:sticky md:top-20">
            <RatingSummary rating={rating} />
            {canReview ? <MyReview key={myReview?._id ?? 'new'} courseId={courseId} review={myReview} /> : null}
          </div>
          <div className="rounded-xl border border-border bg-background px-4">
            <ReviewList excludeUserId={canReview ? (selectedUser?._id ?? null) : null} />
          </div>
        </div>
      ) : (
        <ReviewsPending onRetry={load} />
      )}
    </section>
  );
};

/** The course's stars and review count beside its title, linking down to the Reviews section. */
export const CourseRatingLink = ({ courseId }: { courseId: string }) => {
  const { rating, courseId: loadedCourseId } = useDiscussionLookups();
  if (loadedCourseId !== courseId || !rating?.count) return null;
  return (
    <a href="#reviews" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
      <span className="font-semibold text-foreground">{rating.average.toFixed(1)}</span>
      <RatingStars value={rating.average} className="h-3.5" />
      <span className="underline-offset-2 hover:underline">
        ({rating.count} {rating.count === 1 ? 'review' : 'reviews'})
      </span>
    </a>
  );
};
