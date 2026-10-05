import { Button, Tooltip } from '@repo/ui/app';
import { cn } from '@repo/ui/lib';
import { ShareFatIcon } from '@phosphor-icons/react';
import { useCourseStore } from '@stores';
import { getAbsoluteUrl, successToast } from '@utils/helpers';

interface IProps {
  courseId: string;
  /** `outline` stands alone beside a call to action; `subtle` sits in a group of icon buttons. */
  appearance: 'outline' | 'subtle';
}

/** Shares the course's public address, `/courses/<slug>`, which anyone can open signed in or not. */
export const shareCourse = async (courseId: string) => {
  const url = getAbsoluteUrl(useCourseStore.getState().getCoursePathById(courseId));
  const canShare = typeof navigator.share === 'function';
  if (canShare) {
    try {
      await navigator.share({ url });
      return;
    } catch {
      // The learner dismissed the share sheet, or it is not allowed here; fall back to copying.
    }
  }
  await navigator.clipboard.writeText(url);
  successToast({ message: 'Course link copied to clipboard.' });
};

export const ShareCourse = ({ courseId, appearance }: IProps) => {
  const handleShare = () => shareCourse(courseId);

  const isSubtle = appearance === 'subtle';
  return (
    <Tooltip title="Share course">
      <Button
        isSecondary={!isSubtle}
        isSubtle={isSubtle}
        isRound
        aria-label="Share course"
        className={cn(isSubtle ? 'h-8 w-8 p-0 text-muted-foreground hover:text-foreground' : 'p-2')}
        onClick={handleShare}
        leftsection={<ShareFatIcon weight="bold" className={isSubtle ? 'h-4 w-4' : 'h-5 w-5'} />}
      />
    </Tooltip>
  );
};
