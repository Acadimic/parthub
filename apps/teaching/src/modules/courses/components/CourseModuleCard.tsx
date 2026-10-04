import { type MaterialDto, type MeetDto, type TestPaperDto } from '@repo/shared/contracts';
import { type IAiLessonSpec, type IAiPendingWork, type IAiTestSpec } from '@repo/shared/interfaces';
import {
  BookOpenTextIcon,
  CaretDownIcon,
  ClockIcon,
  FileTextIcon,
  PencilSimpleIcon,
  PrinterIcon,
  SparkleIcon,
  TrashIcon,
  VideoCameraIcon,
  YoutubeLogoIcon,
} from '@phosphor-icons/react';
import { Button, Collapse, Link, Menu, Tooltip } from '@repo/ui/app';
import { Badge } from '@repo/ui/core';
import { cn } from '@repo/ui/lib';
import { MaterialType } from '@enums';
import { type ICourseModule, useMaterialLookups, useMeetLookups, useTestPaperLookups } from '@stores';

interface IProps {
  courseModule: ICourseModule;
  /** 1-based position in the course. */
  number: number;
  isExpanded: boolean;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

/** A titled list inside the module body; hidden when there is nothing to list. */
const Group = ({ title, children, count }: { title: string; count: number; children: React.ReactNode }) =>
  count ? (
    <div>
      <p className="mb-1.5 text-xxs font-semibold uppercase tracking-caps text-muted-foreground">
        {title} · {count}
      </p>
      <ul className="flex flex-col gap-1">{children}</ul>
    </div>
  ) : null;

const Row = ({
  icon,
  children,
  meta,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
  meta?: React.ReactNode;
}) => (
  <li className="flex items-center gap-3 rounded-lg border border-border px-3 py-2 text-sm">
    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
      {icon}
    </span>
    <span className="min-w-0 flex-1 truncate">{children}</span>
    {meta ? <span className="shrink-0 text-xs text-muted-foreground">{meta}</span> : null}
  </li>
);

/** A printout opens in its own tab, where the print dialog opens by itself. */
const openPrint = (path: string) => window.open(path, '_blank');

/** The lessons and quizzes an AI plan still owes this module. */
const pendingWork = (courseModule: ICourseModule): IAiPendingWork[] =>
  (courseModule.pending ?? []).filter((work) => work.status !== 'done' && work.status !== 'skipped');

/** "2 lessons and 1 quiz", or empty. */
const pendingLabelOf = (pending: IAiPendingWork[]): string => {
  const lessons = pending.filter((work) => work.kind === 'lesson').length;
  const tests = pending.length - lessons;
  return [
    lessons ? `${lessons} ${lessons === 1 ? 'lesson' : 'lessons'}` : '',
    tests ? `${tests} ${tests === 1 ? 'quiz' : 'quizzes'}` : '',
  ]
    .filter(Boolean)
    .join(' and ');
};

const specName = (work: IAiPendingWork) => (work.spec as { name: string }).name;
const specMeta = (work: IAiPendingWork) =>
  work.kind === 'lesson'
    ? `${(work.spec as IAiLessonSpec).level ?? ''} · ${(work.spec as IAiLessonSpec).durationMins ?? '?'} min`
    : `${(work.spec as IAiTestSpec).questionCount ?? '?'} questions`;

/** What the plan still owes the module, listed like its real content so the gap is visible. */
const PendingGroup = ({ pending }: { pending: IAiPendingWork[] }) =>
  pending.length ? (
    <Group title="Planned, to generate" count={pending.length}>
      {pending.map((work) => (
        <Row
          key={work.key}
          icon={
            work.kind === 'lesson' ? <BookOpenTextIcon className="h-4 w-4" /> : <FileTextIcon className="h-4 w-4" />
          }
          meta={specMeta(work)}
        >
          {specName(work)}
        </Row>
      ))}
    </Group>
  ) : null;

const plural = (count: number, one: string, many: string) => `${count} ${count === 1 ? one : many}`;

/** The header line's figures: day, counts, minutes, and what an AI plan still owes. */
const ModuleCounts = ({
  day,
  materials,
  tests,
  meets,
  durationMins,
  pendingLabel,
}: {
  day: number;
  materials: number;
  tests: number;
  meets: number;
  durationMins: number;
  pendingLabel: string;
}) => (
  <span className="flex min-w-0 flex-1 flex-wrap items-center gap-x-2 gap-y-1">
    <Badge tone="neutral" appearance="soft" className="px-1.5 py-0 text-xxs">
      Day {day}
    </Badge>
    <span className="inline-flex items-center gap-1 text-xxs text-muted-foreground">
      <BookOpenTextIcon className="h-3 w-3" />
      {plural(materials, 'material', 'materials')}
    </span>
    <span className="inline-flex items-center gap-1 text-xxs text-muted-foreground">
      <FileTextIcon className="h-3 w-3" />
      {plural(tests, 'test', 'tests')}
    </span>
    <span className="inline-flex items-center gap-1 text-xxs text-muted-foreground">
      <VideoCameraIcon className="h-3 w-3" />
      {plural(meets, 'session', 'sessions')}
    </span>
    <span className="inline-flex items-center gap-1 text-xxs text-muted-foreground">
      <ClockIcon className="h-3 w-3" />
      {durationMins} min
    </span>
    {pendingLabel ? (
      <Badge tone="warning" appearance="soft" className="gap-1 px-1.5 py-0 text-xxs">
        <SparkleIcon className="h-3 w-3" />
        {pendingLabel} to generate
      </Badge>
    ) : null}
  </span>
);

/**
 * One module of a course: a day's worth of material, papers and sessions.
 *
 * The header line carries the counts that used to be a parenthesised run of icons; the body lists
 * the actual items, each linking where it can. Same card shape as a question or a piece of content.
 */
export const CourseModuleCard = ({ courseModule, number, isExpanded, onToggle, onEdit, onDelete }: IProps) => {
  const { getMaterialsByIds } = useMaterialLookups();
  const { getTestPapersByIds } = useTestPaperLookups();
  const { getMeetsByIds } = useMeetLookups();
  const materials: MaterialDto[] = getMaterialsByIds(courseModule.materials ?? []);
  const testPapers: TestPaperDto[] = getTestPapersByIds(courseModule.testPapers ?? []);
  const meets: MeetDto[] = getMeetsByIds(courseModule.meets ?? []);
  const durationMins =
    materials.reduce((total, material) => total + (material.durationMins ?? 0), 0) +
    testPapers.reduce((total, paper) => total + (paper.durationMins ?? 0), 0) +
    meets.reduce((total, meet) => total + (meet.durationMins ?? 0), 0);
  const isEmpty = !materials.length && !testPapers.length && !meets.length;
  const pending = pendingWork(courseModule);
  const pendingLabel = pendingLabelOf(pending);

  return (
    <article
      className={cn(
        'relative rounded-lg border bg-background transition-colors',
        isExpanded ? 'border-primary/40' : 'border-border',
      )}
    >
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isExpanded}
        className="flex w-full flex-col gap-1.5 rounded-lg px-4 py-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <span className="flex w-full items-start gap-2">
          <span className="whitespace-nowrap text-xs font-semibold uppercase leading-5 tracking-caps text-primary">
            Module {number}
          </span>
          <ModuleCounts
            day={courseModule.day}
            materials={materials.length}
            tests={testPapers.length}
            meets={meets.length}
            durationMins={durationMins}
            pendingLabel={pendingLabel}
          />
          <CaretDownIcon
            className={cn(
              'mt-0.5 h-4 w-4 shrink-0 text-muted-foreground transition-transform',
              isExpanded && 'rotate-180',
            )}
            weight="bold"
          />
          {/* A spacer the width of the menu trigger, so the caret is not hidden under it. */}
          <span className="w-7 shrink-0" aria-hidden="true" />
        </span>
        <span className="block text-base font-semibold leading-6 text-foreground">{courseModule.name}</span>
        {courseModule.description ? (
          <span className="block text-sm text-muted-foreground">{courseModule.description}</span>
        ) : null}
        {courseModule.topics?.length ? (
          <span className="block text-xs text-muted-foreground">{courseModule.topics.join(' · ')}</span>
        ) : null}
      </button>
      {/* Over the header row's spacer: a menu inside the toggle button would nest interactive elements. */}
      <div className="absolute right-3 top-2.5">
        <Menu
          menuItems={[
            { label: 'Edit module', onClick: onEdit, icon: <PencilSimpleIcon weight="bold" className="h-4 w-4" /> },
            {
              label: 'Print module',
              onClick: () => openPrint(`/courses/${courseModule.course}/print?module=${courseModule._id}`),
              icon: <PrinterIcon weight="bold" className="h-4 w-4" />,
            },
            { label: 'Delete module', onClick: onDelete, icon: <TrashIcon weight="bold" className="h-4 w-4" /> },
          ]}
          className="px-1"
        />
      </div>
      <Collapse isOpen={isExpanded}>
        <div className="flex flex-col gap-4 border-t border-border px-4 py-4">
          {isEmpty ? (
            <p className="text-sm text-muted-foreground">
              {pendingLabel
                ? `Nothing here yet: ${pendingLabel} are planned and still to be generated.`
                : 'Nothing in this module yet. Edit it to add material, papers or sessions.'}
            </p>
          ) : null}
          <PendingGroup pending={pending} />
          <Group title="Study material" count={materials.length}>
            {materials.map((material) => (
              <Row
                key={material._id}
                icon={
                  material.type === MaterialType.VIDEO ? (
                    <YoutubeLogoIcon className="h-4 w-4" />
                  ) : (
                    <BookOpenTextIcon className="h-4 w-4" />
                  )
                }
                meta={`${material.durationMins ?? 0} min`}
              >
                {material.name}
              </Row>
            ))}
          </Group>
          <Group title="Test papers" count={testPapers.length}>
            {testPapers.map((paper) => (
              <Row
                key={paper._id}
                icon={<FileTextIcon className="h-4 w-4" />}
                meta={
                  <span className="flex items-center gap-2">
                    {`${paper.totalQuestions ?? 0} questions · ${paper.maxMarks ?? 0} marks · ${paper.durationMins ?? 0} min`}
                    <Tooltip title="Print paper">
                      <Button
                        isSubtle
                        isRound
                        aria-label={`Print ${paper.name}`}
                        className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                        onClick={() => openPrint(`/test-papers/${paper._id}/print`)}
                        leftsection={<PrinterIcon weight="bold" className="h-4 w-4" />}
                      />
                    </Tooltip>
                  </span>
                }
              >
                <Link
                  href={`/test-papers/${paper._id}`}
                  isSubtle
                  className="h-auto px-0 py-0 text-sm font-medium text-foreground"
                >
                  {paper.name}
                </Link>
              </Row>
            ))}
          </Group>
          <Group title="Sessions" count={meets.length}>
            {meets.map((meet) => (
              <Row
                key={meet._id}
                icon={<VideoCameraIcon className="h-4 w-4" />}
                meta={meet.durationMins ? `${meet.durationMins} min` : undefined}
              >
                {meet.title}
              </Row>
            ))}
          </Group>
        </div>
      </Collapse>
    </article>
  );
};
