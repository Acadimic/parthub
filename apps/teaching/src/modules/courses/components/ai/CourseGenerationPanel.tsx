import { type CourseModuleDto } from '@repo/shared/contracts';
import {
  BookOpenTextIcon,
  CalendarPlusIcon,
  FileTextIcon,
  RocketLaunchIcon,
  SparkleIcon,
  VideoCameraIcon,
} from '@phosphor-icons/react';
import { Button } from '@repo/ui/app';
import { cn } from '@repo/ui/lib';

interface IProps {
  modules: CourseModuleDto[];
  onGenerateContent: () => void;
  onScheduleSessions: () => void;
  onReview: () => void;
}

const isOpen = (status: string) => status === 'pending' || status === 'prompted';

const Stat = ({
  icon,
  count,
  label,
  isDone,
}: {
  icon: React.ReactNode;
  count: number;
  label: string;
  isDone: boolean;
}) => (
  <span
    className={cn('inline-flex items-center gap-1.5 text-sm', isDone ? 'text-muted-foreground' : 'text-foreground')}
  >
    <span
      className={cn(
        'flex h-7 w-7 items-center justify-center rounded-md',
        isDone ? 'bg-muted text-muted-foreground' : 'bg-warning/15 text-warning',
      )}
    >
      {icon}
    </span>
    <span className="font-mono font-semibold">{count}</span> {label}
  </span>
);

/**
 * Where an AI-planned course is finished: what is still owed, and the three actions that settle
 * it — generate the lessons and quizzes, schedule the sessions, review and publish. Shown only on
 * a course that came from a plan, since a hand-built course has nothing pending.
 */
export const CourseGenerationPanel = ({ modules, onGenerateContent, onScheduleSessions, onReview }: IProps) => {
  const pending = modules.flatMap((courseModule) => (courseModule.pending ?? []).filter((work) => isOpen(work.status)));
  const lessons = pending.filter((work) => work.kind === 'lesson').length;
  const quizzes = pending.filter((work) => work.kind === 'test').length;
  const sessions = pending.filter((work) => work.kind === 'session').length;
  const hasPlan = modules.some((courseModule) => (courseModule.pending ?? []).length);
  if (!hasPlan) return null;
  const isComplete = !pending.length;

  return (
    <section className="rounded-lg border border-border bg-background px-4 py-3" aria-label="Course generation">
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
        <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-foreground">
          <SparkleIcon weight="bold" className="h-4 w-4 text-primary" />
          {isComplete ? 'Plan complete' : 'Finishing the plan'}
        </span>
        <Stat
          icon={<BookOpenTextIcon className="h-4 w-4" />}
          count={lessons}
          label={lessons === 1 ? 'lesson to write' : 'lessons to write'}
          isDone={!lessons}
        />
        <Stat
          icon={<FileTextIcon className="h-4 w-4" />}
          count={quizzes}
          label={quizzes === 1 ? 'quiz to write' : 'quizzes to write'}
          isDone={!quizzes}
        />
        <Stat
          icon={<VideoCameraIcon className="h-4 w-4" />}
          count={sessions}
          label={sessions === 1 ? 'session to schedule' : 'sessions to schedule'}
          isDone={!sessions}
        />
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <Button
            isSecondary
            leftsection={<SparkleIcon weight="bold" className="h-4 w-4" />}
            text="Generate content"
            onClick={onGenerateContent}
            disabled={!lessons && !quizzes}
          />
          <Button
            isSecondary
            leftsection={<CalendarPlusIcon weight="bold" className="h-4 w-4" />}
            text="Schedule sessions"
            onClick={onScheduleSessions}
            disabled={!sessions}
          />
          <Button
            leftsection={<RocketLaunchIcon weight="bold" className="h-4 w-4" />}
            text="Review & publish"
            onClick={onReview}
          />
        </div>
      </div>
    </section>
  );
};
