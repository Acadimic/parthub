import { type CourseDto } from '@repo/shared/contracts';
import { Button } from '@repo/ui/app';
import { CheckIcon, CopyIcon } from '@phosphor-icons/react';
import { getCoursePublicUrl, successToast } from '@utils/helpers';
import { useEffect, useState } from 'react';

interface IProps {
  course: CourseDto;
}

/**
 * The course's public address in the learning app, with a one-tap copy. The edit dialog sets the
 * slug from the name on every save, so it changes with a rename and links shared before stop working.
 */
export const CoursePublicLink = ({ course }: IProps) => {
  const [isCopied, setIsCopied] = useState(false);
  const link = getCoursePublicUrl(course);

  useEffect(() => {
    if (!isCopied) return undefined;
    const timer = setTimeout(() => setIsCopied(false), 1500);
    return () => clearTimeout(timer);
  }, [isCopied]);

  // Nothing to show without a slug (a name with no Latin letters or digits gives none) or the env.
  if (!link) return null;

  const copy = async () => {
    await navigator.clipboard.writeText(link);
    setIsCopied(true);
    successToast({ message: 'Course link copied.' });
  };

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-2 rounded-lg border border-border bg-muted px-3 py-2">
        <span className="min-w-0 flex-1 truncate font-mono text-xs">{link}</span>
        <Button
          isSecondary
          className="px-2.5 py-1.5 text-xs"
          onClick={copy}
          leftsection={
            isCopied ? (
              <CheckIcon weight="bold" className="h-4 w-4 text-success" />
            ) : (
              <CopyIcon weight="bold" className="h-4 w-4" />
            )
          }
        >
          {isCopied ? 'Copied' : 'Copy'}
        </Button>
      </div>
      {course.isPublished ? null : (
        <p className="text-xs text-muted-foreground">
          Live once published: learners cannot open it while it is a draft.
        </p>
      )}
    </div>
  );
};
