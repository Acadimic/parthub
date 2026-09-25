import { Button, ToggleTheme } from '@repo/ui/app';
import { Badge } from '@repo/ui/core';
import { XIcon } from '@phosphor-icons/react';
import { useTestPaperLookups } from '@stores';
import { Timer } from './';

interface IProps {
  isPractice?: boolean;
  toggleTimer: () => void;
  isActiveTimer: boolean;
  handleSubmitTest: () => void;
  openExit: () => void;
}

/** The sitting's top bar: which mode this is, the paper, the clock, and the way out. */
export const ExamHeader = ({ isPractice, toggleTimer, isActiveTimer, handleSubmitTest, openExit }: IProps) => {
  const testPaperStore = useTestPaperLookups();
  const { exam, getAttemptedCount } = testPaperStore;
  if (!exam) return null;
  const { title, numberOfQuestions } = exam;
  const attempted = getAttemptedCount();
  const percent = numberOfQuestions ? (attempted / numberOfQuestions) * 100 : 0;

  return (
    <header className="relative h-14 border-b border-border bg-background xl:h-16">
      <div className="flex h-full items-center gap-2 px-3 md:gap-3 md:px-6">
        <Badge tone={isPractice ? 'info' : 'primary'} className="shrink-0">
          {isPractice ? 'Practice' : 'Test'}
        </Badge>
        <div className="min-w-0 flex-1 truncate text-sm font-semibold md:text-base">{title}</div>
        {/* Mounted in practice too: its tick is what counts each question's reply time. */}
        <div className={isPractice ? 'hidden' : undefined}>
          <Timer isActiveTimer={isActiveTimer} toggleTimer={toggleTimer} handleSubmitTest={handleSubmitTest} />
        </div>
        <ToggleTheme />
        <Button
          isSubtle
          aria-label="Exit"
          className="rounded-full p-1.5"
          onClick={openExit}
          leftsection={<XIcon weight="bold" className="h-5 w-5" />}
        />
      </div>
      {/* How much of the paper is answered, as a hairline along the bottom edge. */}
      <div aria-hidden="true" className="absolute inset-x-0 bottom-0 h-0.5 bg-muted">
        <div className="h-full bg-primary transition-[width] duration-300" style={{ width: `${percent}%` }} />
      </div>
    </header>
  );
};
