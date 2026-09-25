import { Button } from '@repo/ui/app';
import { ShareFatIcon } from '@phosphor-icons/react';
import { successToast } from '@utils/helpers';

interface IProps {
  courseId: string;
  /** Icon-only, for a crowded action row. */
  isCompact?: boolean;
}

/** Copies the course's public preview address, which any learner on any organization can open. */
export const ShareCourse = ({ courseId, isCompact }: IProps) => {
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

  return (
    <Button
      isSecondary
      isRound
      aria-label="Share course"
      className={isCompact ? 'p-2' : 'px-4 py-1.5'}
      onClick={handleShare}
      leftsection={<ShareFatIcon weight="bold" className="h-5 w-5" />}
    >
      {isCompact ? null : 'Share'}
    </Button>
  );
};
