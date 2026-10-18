import { Button, Tooltip } from '@repo/ui/app';
import { cn } from '@repo/ui/lib';
import { LessonViewMode } from '@enums';
import { ArticleIcon, BookOpenTextIcon, ListNumbersIcon } from '@phosphor-icons/react';
import { useSelectorLookups } from '@stores';
import { openCourseBook } from '@utils/course-book';

const MODES: { mode: LessonViewMode; label: string; icon: React.ReactNode }[] = [
  {
    mode: LessonViewMode.READER,
    label: 'Topics: one at a time',
    icon: <ListNumbersIcon weight="bold" className="h-3.5 w-3.5" />,
  },
  {
    mode: LessonViewMode.FULL,
    label: 'Full lesson on one page',
    icon: <ArticleIcon weight="bold" className="h-3.5 w-3.5" />,
  },
];

/**
 * Topics or the full lesson, as two icons in one pill at the start of the progress strip, then a
 * third that opens the whole course as pages. The first two are a choice that is remembered, so
 * the next lesson opens the same way; the third only opens the book, so nothing is kept for it.
 */
export const LessonViewToggle = () => {
  const { lessonViewMode, setLessonViewMode } = useSelectorLookups();
  return (
    <div
      className="flex shrink-0 items-center gap-0.5 rounded-full bg-muted/60 p-0.5"
      role="group"
      aria-label="Lesson view"
    >
      {MODES.map(({ mode, label, icon }) => {
        const isActive = lessonViewMode === mode;
        return (
          <Tooltip key={mode} title={label}>
            <Button
              isRound
              isSubtle={!isActive}
              aria-label={label}
              aria-pressed={isActive}
              className={cn('h-7 w-7 p-0', !isActive && 'text-muted-foreground hover:text-foreground')}
              onClick={() => setLessonViewMode(mode)}
              leftsection={icon}
            />
          </Tooltip>
        );
      })}
      <span aria-hidden className="mx-0.5 h-3.5 w-px bg-border" />
      <Tooltip title="Whole course as pages">
        <Button
          isRound
          isSubtle
          aria-label="Open the whole course as pages"
          className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
          onClick={openCourseBook}
          leftsection={<BookOpenTextIcon weight="bold" className="h-3.5 w-3.5" />}
        />
      </Tooltip>
    </div>
  );
};
