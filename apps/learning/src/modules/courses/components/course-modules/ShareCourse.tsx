import { Button, Tooltip } from '@repo/ui/app';
import { cn } from '@repo/ui/lib';
import { ShareFatIcon } from '@phosphor-icons/react';
import { successToast } from '@utils/helpers';

interface IProps {
  courseId: string;
  /** `outline` stands alone beside a call to action; `subtle` sits in a group of icon buttons. */
  appearance: 'outline' | 'subtle';
}

/** Copies the course's public preview address, which any learner on any organization can open. */
export const ShareCourse = ({ courseId, appearance }: IProps) => {
  const handleShare = async () => {
    const url = `${window.location.origin}/courses/${courseId}/preview`;
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
