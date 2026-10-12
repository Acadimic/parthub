import { BlankState } from '@components/others';
import { CollectionType } from '@enums';
import { PencilSimpleIcon, TrashIcon } from '@phosphor-icons/react';
import { type CourseReviewDto } from '@repo/shared/contracts';
import { PositionType } from '@repo/shared/enums';
import { Button, Link, Modal, RatingStars, RatingSummary, SoftConfirmModal } from '@repo/ui/app';
import { Accordion, ExpandableText, Skeleton } from '@repo/ui/core';
import { useRequest } from '@repo/ui/hooks';
import {
  useDiscussionLookups,
  useDiscussionStore,
  useSelectedCourse,
  useSelectedUser,
  useSelectorLookups,
} from '@stores';
import { getCoursePath } from '@utils/helpers';
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

/** Confirms and deletes the learner's review; `onDeleted` runs only once the server has removed it. */
const DeleteReviewConfirm = ({
  review,
  isOpen,
  onCancel,
  onDeleted,
}: {
  review: CourseReviewDto;
  isOpen: boolean;
  onCancel: () => void;
  onDeleted: () => void;
}) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const remove = async () => {
    setIsDeleting(true);
    const isDeleted = await useDiscussionStore.getState().saveReview({ ...review, _deleted: true });
    setIsDeleting(false);
    if (isDeleted) onDeleted();
  };
  return (
    <SoftConfirmModal
      isOpen={isOpen}
      isDestructive
      isLoading={isDeleting}
      confirmText="Delete"
      title="Delete your review"
      description="Your rating will no longer count towards the course's average."
      onCancel={onCancel}
      onConfirm={remove}
    />
  );
};

/** The learner's own review: a form until they write one, then the review with Edit and Delete. */
const MyReview = ({ courseId, review }: { courseId: string; review: CourseReviewDto | null }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

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
      <DeleteReviewConfirm
        review={review}
        isOpen={isConfirmingDelete}
        onCancel={() => setIsConfirmingDelete(false)}
        onDeleted={() => setIsConfirmingDelete(false)}
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
    // The rating says there are reviews, so an empty list here means the reader wrote the only one.
    return (
      <p className="rounded-xl border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">
        Your review is the only one so far.
      </p>
    );
  }
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col divide-y divide-border rounded-xl border border-border bg-background px-4">
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

/** Rate the course, or change or delete the rating, from a dialog: the learning view has no room for the form. */
const RateCourseModal = ({
  courseId,
  review,
  isOpen,
  onClose,
}: {
  courseId: string;
  review: CourseReviewDto | null;
  isOpen: boolean;
  onClose: () => void;
}) => {
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

  return (
    <>
      <Modal
        title={review ? 'Edit your review' : 'Rate this course'}
        description="Your rating helps other learners choose, and your teacher improve."
        position={PositionType.TOP}
        isOpen={isOpen}
        onClose={onClose}
        component={
          <div className="flex flex-col gap-3 pb-2">
            <ReviewForm
              key={review?._id ?? 'new'}
              courseId={courseId}
              review={review}
              onDone={onClose}
              onCancel={onClose}
            />
            {review ? (
              <Button
                isSubtle
                className="self-start px-2 py-1 text-xs text-muted-foreground hover:text-destructive"
                leftsection={<TrashIcon className="h-3.5 w-3.5" />}
                text="Delete my review"
                onClick={() => setIsConfirmingDelete(true)}
              />
            ) : null}
          </div>
        }
      />
      {review ? (
        <DeleteReviewConfirm
          review={review}
          isOpen={isConfirmingDelete}
          onCancel={() => setIsConfirmingDelete(false)}
          onDeleted={() => {
            setIsConfirmingDelete(false);
            onClose();
          }}
        />
      ) : null}
    </>
  );
};

/**
 * The course's rating in one line for the learning view: the average and count, linking to the
 * reviews on the course page, and the learner's own rating with a way to give or change it.
 */
export const CourseRatingRow = ({ courseId }: { courseId: string }) => {
  const course = useSelectedCourse();
  const { rating, myReview } = useDiscussionLookups();
  const { isFailed } = useRequest(useDiscussionStore, 'rating');
  const [isRating, setIsRating] = useState(false);

  // Once per course: the tab content remounts on every switch, and the store already holds it then.
  useEffect(() => {
    const store = useDiscussionStore.getState();
    if (store.courseId !== courseId || !store.rating) store.loadReviews(courseId);
  }, [courseId]);

  if (!rating) {
    if (isFailed) return null;
    return <Skeleton height={40} className="rounded-lg" />;
  }
  const reviewsHref = course ? `${getCoursePath(course)}#reviews` : null;
  const summary = (
    <span className="flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground">
      <RatingStars value={rating.average} className="h-3.5 shrink-0" />
      {rating.count ? (
        <>
          <span className="font-semibold text-foreground">{rating.average.toFixed(1)}</span>
          <span className="truncate underline-offset-2 group-hover:underline">
            {rating.count} {rating.count === 1 ? 'review' : 'reviews'}
          </span>
        </>
      ) : (
        <span className="truncate">No reviews yet</span>
      )}
    </span>
  );
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card px-3 py-2">
      {reviewsHref && rating.count ? (
        <Link
          href={reviewsHref}
          isSubtle
          className="group min-w-0 px-1 py-0.5"
          aria-label="Read the reviews on the course page"
        >
          {summary}
        </Link>
      ) : (
        summary
      )}
      {myReview ? (
        <Button
          isSubtle
          className="shrink-0 gap-1.5 px-2 py-1 text-xs"
          aria-label="Edit your review"
          leftsection={<RatingStars value={myReview.rating} className="h-3" />}
          text="Yours"
          onClick={() => setIsRating(true)}
        />
      ) : (
        <Button
          isSecondary
          className="shrink-0 px-2.5 py-1 text-xs"
          text="Rate course"
          onClick={() => setIsRating(true)}
        />
      )}
      <RateCourseModal courseId={courseId} review={myReview} isOpen={isRating} onClose={() => setIsRating(false)} />
    </div>
  );
};

interface ISectionProps {
  courseId: string;
  /** A signed-in learner who may open the course can rate it here; everyone else reads. */
  canReview: boolean;
}

/** Before the first review: no chart of zeros, just the invitation, or a line for a visitor who cannot rate. */
const NoReviewsYet = ({ courseId, canReview }: ISectionProps) => {
  if (!canReview) {
    return (
      <p className="rounded-xl border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">
        No reviews yet. Learners who take the course can rate it here.
      </p>
    );
  }
  return (
    <div className="md:max-w-md">
      <p className="mb-3 text-sm text-muted-foreground">No reviews yet. Yours would be the first.</p>
      <MyReview key="new" courseId={courseId} review={null} />
    </div>
  );
};

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

  // Closed until asked for: by its header, by the stars in the hero (which also set the hash, so a
  // click with the hash already set still opens it), or by arriving on `#reviews`.
  const { isCourseReviewsOpen: isOpen, setIsCourseReviewsOpen: setIsOpen } = useSelectorLookups();
  useEffect(() => {
    const openOnHash = () => {
      if (window.location.hash === '#reviews') setIsOpen(true);
    };
    openOnHash();
    window.addEventListener('hashchange', openOnHash);
    return () => {
      window.removeEventListener('hashchange', openOnHash);
      setIsOpen(false);
    };
  }, []);

  const body = (() => {
    if (!rating) return <ReviewsPending onRetry={load} />;
    if (!rating.count) return <NoReviewsYet courseId={courseId} canReview={canReview} />;
    return (
      <div className="grid gap-4 md:grid-cols-[minmax(0,280px)_minmax(0,1fr)] md:items-start">
        <div className="flex flex-col gap-4 md:sticky md:top-20">
          <RatingSummary rating={rating} />
          {canReview ? <MyReview key={myReview?._id ?? 'new'} courseId={courseId} review={myReview} /> : null}
        </div>
        <ReviewList excludeUserId={canReview ? (selectedUser?._id ?? null) : null} />
      </div>
    );
  })();

  const title = (
    <span className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
      <span className="text-lg font-semibold">Reviews</span>
      {rating?.count ? (
        <span className="flex items-center gap-1.5 text-sm font-normal text-muted-foreground">
          <RatingStars value={rating.average} className="h-3.5" />
          <span className="font-semibold text-foreground">{rating.average.toFixed(1)}</span>
          <span>
            {rating.count} {rating.count === 1 ? 'review' : 'reviews'}
          </span>
        </span>
      ) : (
        <span className="text-sm font-normal text-muted-foreground">No reviews yet</span>
      )}
    </span>
  );

  return (
    <section id="reviews" className="scroll-mt-24">
      <Accordion
        type="single"
        openIndexes={isOpen ? [0] : []}
        onOpenIndexesChange={(indexes) => setIsOpen(indexes.length > 0)}
        // The padding is aimed at the trigger alone: a catch-all `[&_button]` would restyle the stars and
        // buttons inside the panel too.
        className="rounded-xl border border-border bg-background [&>div]:border-b-0 [&>div>h3>button]:px-4 [&>div>h3>button]:py-3"
        contentClassName="px-4 pb-4"
        items={[{ title, component: body }]}
      />
    </section>
  );
};

/** The course's stars and review count beside its title, linking down to the Reviews section. */
export const CourseRatingLink = ({ courseId }: { courseId: string }) => {
  const { rating, courseId: loadedCourseId } = useDiscussionLookups();
  const { setIsCourseReviewsOpen } = useSelectorLookups();
  if (loadedCourseId !== courseId || !rating?.count) return null;
  return (
    <a
      href="#reviews"
      onClick={() => setIsCourseReviewsOpen(true)}
      className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
    >
      <span className="font-semibold text-foreground">{rating.average.toFixed(1)}</span>
      <RatingStars value={rating.average} className="h-3.5" />
      <span className="underline-offset-2 hover:underline">
        ({rating.count} {rating.count === 1 ? 'review' : 'reviews'})
      </span>
    </a>
  );
};
