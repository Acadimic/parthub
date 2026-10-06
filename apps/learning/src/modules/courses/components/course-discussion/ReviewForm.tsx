import { type CourseReviewDto } from '@repo/shared/contracts';
import { DISCUSSION_LIMITS } from '@repo/shared/utils';
import { Button, RatingInput, TextArea } from '@repo/ui/app';
import { useDiscussionStore } from '@stores';
import { getObjectId, successToast } from '@utils/helpers';
import { useState } from 'react';

interface IProps {
  courseId: string;
  /** The learner's existing review when editing it, or null for a first review. */
  review: CourseReviewDto | null;
  onDone: () => void;
  onCancel: (() => void) | null;
}

export const ReviewForm = ({ courseId, review, onDone, onCancel }: IProps) => {
  const [rating, setRating] = useState(review?.rating ?? 0);
  const [body, setBody] = useState(review?.body ?? '');
  const [isSaving, setIsSaving] = useState(false);

  const submit = async () => {
    if (!rating) return;
    setIsSaving(true);
    const isSaved = await useDiscussionStore
      .getState()
      .saveReview({ _id: review?._id ?? getObjectId(), course: courseId, rating, body: body.trim() });
    setIsSaving(false);
    if (!isSaved) return;
    successToast({ message: review ? 'Your review was updated.' : 'Thanks for your review!' });
    onDone();
  };

  return (
    <div className="flex flex-col gap-3">
      <RatingInput value={rating} onChange={setRating} />
      <TextArea
        value={body}
        rows={3}
        maxLength={DISCUSSION_LIMITS.MAX_BODY_LENGTH}
        placeholder="What did you like? What could be better? (optional)"
        onChange={(event) => setBody(event.target.value)}
        className="resize-none"
      />
      <div className="flex items-center justify-end gap-1.5">
        {onCancel ? <Button isSubtle className="px-3 py-1.5 text-xs" text="Cancel" onClick={onCancel} /> : null}
        <Button
          className="px-4 py-1.5 text-xs"
          text={review ? 'Update review' : 'Submit review'}
          disabled={!rating}
          isLoading={isSaving}
          onClick={submit}
        />
      </div>
    </div>
  );
};
