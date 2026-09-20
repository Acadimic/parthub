import { Select } from '@components/app/selects';
import { DrawerSection, TextArea, TextInput } from '@repo/ui/app';
import { Badge, Checkbox } from '@repo/ui/core';
import { cn } from '@repo/ui/lib';
import { type ISelectItem } from '@interfaces';
import {
  COURSE_LIMITS,
  type CoursePace,
  EXAM_STYLES,
  type IAiCourseContext,
  type IAiCourseSetup,
  LANGUAGES,
  PACES,
  totalDays,
} from '@utils/ai/course-generator';

interface IProps {
  setup: IAiCourseSetup;
  onChange: (fields: Partial<IAiCourseSetup>) => void;
  standardItems: ISelectItem[];
  subjectItems: ISelectItem[];
  /** What the prompt will list, so the teacher sees how much can be reused before writing it. */
  context: IAiCourseContext | null;
  /** The saved lessons are still being fetched; the count below is not final. */
  isLoadingLessons?: boolean;
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, Math.floor(value) || min));

interface IToggle {
  key: 'includeQuizzes' | 'includeSessions';
  label: string;
  hint: string;
}
const TOGGLES: IToggle[] = [
  { key: 'includeQuizzes', label: 'Quizzes', hint: "A short test every few days and at each week's end" },
  { key: 'includeSessions', label: 'Live sessions', hint: 'One session a week, where a teacher helps most' },
];

/** Step one of a course: who it is for, how long, how hard, and what a day may hold. */
export const AiCourseSetup = ({ setup, onChange, standardItems, subjectItems, context, isLoadingLessons }: IProps) => {
  const days = totalDays(setup);
  return (
    <div className="flex flex-col gap-6">
      <DrawerSection
        title="Who is it for"
        isRequired
        hint="Pick the standards. Subjects are optional: leave them empty for every subject of the standards."
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <Select
            label="Standards"
            required
            items={standardItems}
            isGrouped
            values={setup.standards}
            onChange={(items) => onChange({ standards: items.map((item) => item.value), subjects: [] })}
            placeholder="Select standards"
          />
          <Select
            label="Subjects"
            items={subjectItems}
            values={setup.subjects}
            onChange={(items) => onChange({ subjects: items.map((item) => item.value) })}
            isDisabled={!setup.standards.length}
            placeholder={setup.standards.length ? 'All subjects' : 'Choose a standard first'}
          />
        </div>
      </DrawerSection>

      <DrawerSection
        title="Length and pace"
        hint="The plan lays the syllabus across these days, easy to hard within each week."
      >
        <div className="grid gap-3 sm:grid-cols-3">
          <TextInput
            label="Weeks"
            type="number"
            min={COURSE_LIMITS.minWeeks}
            max={COURSE_LIMITS.maxWeeks}
            className="font-mono"
            value={setup.weeks}
            onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
              onChange({ weeks: clamp(Number(event.target.value), COURSE_LIMITS.minWeeks, COURSE_LIMITS.maxWeeks) })
            }
          />
          <TextInput
            label="Study days a week"
            type="number"
            min={COURSE_LIMITS.minDaysPerWeek}
            max={COURSE_LIMITS.maxDaysPerWeek}
            className="font-mono"
            value={setup.daysPerWeek}
            onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
              onChange({
                daysPerWeek: clamp(
                  Number(event.target.value),
                  COURSE_LIMITS.minDaysPerWeek,
                  COURSE_LIMITS.maxDaysPerWeek,
                ),
              })
            }
          />
          <div className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-foreground">Pace</span>
            <div className="flex gap-1 rounded-lg border border-border p-1" role="radiogroup" aria-label="Pace">
              {(Object.keys(PACES) as CoursePace[]).map((pace) => (
                <button
                  key={pace}
                  type="button"
                  role="radio"
                  aria-checked={setup.pace === pace}
                  onClick={() => onChange({ pace })}
                  className={cn(
                    'flex-1 rounded-md px-2 py-1.5 text-xs font-medium transition-colors',
                    setup.pace === pace
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-accent',
                  )}
                  title={PACES[pace].hint}
                >
                  {PACES[pace].label}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <Select
            label="Exam style"
            items={EXAM_STYLES.map((style) => ({ label: style, value: style }))}
            values={[setup.examStyle]}
            onChange={(items) => items[0] && onChange({ examStyle: items[0].value })}
            isSingleSelect
            noSort
          />
          <Select
            label="Language"
            items={LANGUAGES.map((language) => ({ label: language, value: language }))}
            values={[setup.language]}
            onChange={(items) => items[0] && onChange({ language: items[0].value })}
            isSingleSelect
            noSort
          />
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          {TOGGLES.map((toggle) => (
            <label
              key={toggle.key}
              htmlFor={`ai-course-${toggle.key}`}
              className="flex cursor-pointer items-start gap-2.5 rounded-lg border border-border bg-background px-3 py-2.5 transition-colors hover:border-primary/40"
            >
              <Checkbox
                id={`ai-course-${toggle.key}`}
                checked={setup[toggle.key]}
                onChange={(checked) => onChange({ [toggle.key]: checked })}
                className="mt-0.5"
              />
              <span className="min-w-0">
                <span className="block text-sm font-medium text-foreground">{toggle.label}</span>
                <span className="block text-xs text-muted-foreground">{toggle.hint}</span>
              </span>
            </label>
          ))}
        </div>
      </DrawerSection>

      <DrawerSection
        title="Pricing"
        hint="A suggestion for the plans; nothing is charged until the course is published."
      >
        <div className="grid gap-3 sm:grid-cols-3">
          <label
            htmlFor="ai-course-isPaid"
            className="flex cursor-pointer items-start gap-2.5 rounded-lg border border-border bg-background px-3 py-2.5 transition-colors hover:border-primary/40"
          >
            <Checkbox
              id="ai-course-isPaid"
              checked={setup.isPaid}
              onChange={(checked) => onChange({ isPaid: checked })}
              className="mt-0.5"
            />
            <span className="min-w-0">
              <span className="block text-sm font-medium text-foreground">Paid course</span>
              <span className="block text-xs text-muted-foreground">Untick for one free plan</span>
            </span>
          </label>
          <TextInput
            label="Monthly (₹)"
            type="number"
            min={0}
            className="font-mono"
            value={setup.monthlyAmount}
            disabled={!setup.isPaid}
            onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
              onChange({ monthlyAmount: Math.max(0, Math.floor(Number(event.target.value) || 0)) })
            }
          />
          <TextInput
            label="Yearly (₹)"
            type="number"
            min={0}
            className="font-mono"
            value={setup.yearlyAmount}
            disabled={!setup.isPaid}
            onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
              onChange({ yearlyAmount: Math.max(0, Math.floor(Number(event.target.value) || 0)) })
            }
          />
        </div>
        <TextArea
          label="Anything else"
          value={setup.instructions}
          onChange={(event: React.ChangeEvent<HTMLTextAreaElement>) => onChange({ instructions: event.target.value })}
          placeholder="Optional: the textbook you follow, an exam date to build towards, topics to stress or skip."
        />
      </DrawerSection>

      {context ? (
        <DrawerSection
          title="What will be created"
          hint="Decided from your choices. Everything can be edited after the import."
        >
          <div className="rounded-lg border border-border bg-muted/30 p-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone="neutral" appearance="soft">
                {days} {days === 1 ? 'day' : 'days'} in {setup.weeks} {setup.weeks === 1 ? 'week' : 'weeks'}
              </Badge>
              <Badge tone="neutral" appearance="soft">
                ~{PACES[setup.pace].minutesPerDay} min a day
              </Badge>
              {setup.includeQuizzes ? (
                <Badge tone="neutral" appearance="soft">
                  quizzes
                </Badge>
              ) : null}
              {setup.includeSessions ? (
                <Badge tone="neutral" appearance="soft">
                  {setup.weeks} live {setup.weeks === 1 ? 'session' : 'sessions'}
                </Badge>
              ) : null}
              <Badge tone="success" appearance="soft">
                {setup.isPaid ? 'monthly + yearly plans' : 'free plan'}
              </Badge>
            </div>
            <p className="mt-3 text-sm text-foreground">
              {context.standards.map((standard) => standard.name).join(', ')} ·{' '}
              {context.subjects.map((subject) => subject.name).join(', ')}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {isLoadingLessons ? 'Loading saved lessons… ' : ''}
              The model may reuse {context.materials.length} saved{' '}
              {context.materials.length === 1 ? 'lesson' : 'lessons'} and {context.testPapers.length} saved{' '}
              {context.testPapers.length === 1 ? 'test paper' : 'test papers'} for these standards, and will ask for new
              ones where nothing fits.
            </p>
          </div>
        </DrawerSection>
      ) : null}
    </div>
  );
};
