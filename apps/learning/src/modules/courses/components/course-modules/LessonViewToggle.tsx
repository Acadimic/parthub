import { Button, Tooltip } from '@repo/ui/app';
import { LessonViewMode } from '@enums';
import { ArticleIcon, ListNumbersIcon } from '@phosphor-icons/react';
import { useSelectorLookups } from '@stores';

const MODES: { mode: LessonViewMode; label: string; title: string; icon: React.ReactNode }[] = [
  {
    mode: LessonViewMode.READER,
    label: 'Topics',
    title: 'Read one topic at a time',
    icon: <ListNumbersIcon weight="bold" className="h-4 w-4" />,
  },
  {
    mode: LessonViewMode.FULL,
    label: 'Full lesson',
    title: 'Read the whole lesson on one page',
    icon: <ArticleIcon weight="bold" className="h-4 w-4" />,
  },
];

/** Topics or the full lesson. The choice is remembered, so the next lesson opens the same way. */
export const LessonViewToggle = () => {
  const { lessonViewMode, setLessonViewMode } = useSelectorLookups();
  return (
    <div className="flex items-center gap-0.5 rounded-full bg-muted/60 p-1" role="group" aria-label="Lesson view">
      {MODES.map(({ mode, label, title, icon }) => (
        <Tooltip key={mode} title={title}>
          <Button
            isRound
            isSubtle={lessonViewMode !== mode}
            aria-pressed={lessonViewMode === mode}
            className="h-7 px-2.5 text-xs"
            labelClassName="hidden sm:block"
            onClick={() => setLessonViewMode(mode)}
            leftsection={icon}
          >
            {label}
          </Button>
        </Tooltip>
      ))}
    </div>
  );
};
