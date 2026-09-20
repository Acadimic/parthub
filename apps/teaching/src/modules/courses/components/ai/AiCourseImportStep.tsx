import { type CourseModuleDto, type MaterialDto, type TestPaperDto } from '@repo/shared/contracts';
import { type IAiLessonSpec, type IAiTestSpec } from '@repo/shared/interfaces';
import { AiIssueList } from '@components/app/ai';
import {
  BookOpenTextIcon,
  CheckCircleIcon,
  FileTextIcon,
  SparkleIcon,
  UploadSimpleIcon,
  VideoCameraIcon,
} from '@phosphor-icons/react';
import { Button, DrawerSection, TextArea } from '@repo/ui/app';
import { Badge } from '@repo/ui/core';
import { type IAiIssue } from '@utils/ai/common';
import { type IImportedCourse } from '@utils/ai/course-generator';
import { useMaterialLookups, useTestPaperLookups } from '@stores';
import { useRef } from 'react';

interface IProps {
  text: string;
  onChangeText: (text: string) => void;
  issues: IAiIssue[];
  imported: IImportedCourse | null;
  /** Session titles by module id, from the reply; sessions are created in a later phase. */
  sessionTitles: Map<string, string>;
}

const ItemRow = ({ icon, name, badge }: { icon: React.ReactNode; name: string; badge: React.ReactNode }) => (
  <li className="flex items-center gap-1.5 text-foreground">
    <span className="shrink-0 text-muted-foreground">{icon}</span>
    <span className="truncate">{name}</span>
    {badge}
  </li>
);

const EXISTING = (
  <Badge tone="success" appearance="soft" className="px-1 py-0 text-xxs">
    existing
  </Badge>
);

const toGenerate = (label: string) => (
  <Badge tone="warning" appearance="soft" className="gap-1 px-1 py-0 text-xxs capitalize">
    <SparkleIcon className="h-3 w-3" />
    {label}
  </Badge>
);

interface IItem {
  key: string;
  icon: React.ReactNode;
  name: string;
  badge: React.ReactNode;
}

/** A day's items in reading order: reused lessons, lessons to generate, reused tests, tests to generate. */
const moduleItems = (courseModule: CourseModuleDto, materials: MaterialDto[], testPapers: TestPaperDto[]): IItem[] => {
  const lessonIcon = <BookOpenTextIcon className="h-3.5 w-3.5" />;
  const testIcon = <FileTextIcon className="h-3.5 w-3.5" />;
  const pending = courseModule.pending ?? [];
  return [
    ...materials.map((material) => ({ key: material._id, icon: lessonIcon, name: material.name, badge: EXISTING })),
    ...pending
      .filter((work) => work.kind === 'lesson')
      .map((work) => ({
        key: work.key,
        icon: lessonIcon,
        name: (work.spec as IAiLessonSpec).name,
        badge: toGenerate((work.spec as IAiLessonSpec).level ?? 'to generate'),
      })),
    ...testPapers.map((paper) => ({ key: paper._id, icon: testIcon, name: paper.name, badge: EXISTING })),
    ...pending
      .filter((work) => work.kind === 'test')
      .map((work) => ({
        key: work.key,
        icon: testIcon,
        name: (work.spec as IAiTestSpec).name,
        badge: toGenerate(`${(work.spec as IAiTestSpec).questionCount ?? '?'} questions to generate`),
      })),
  ];
};

/** Day, name, the live-session badge, and the topics line. */
const ModuleHeading = ({ courseModule, sessionTitle }: { courseModule: CourseModuleDto; sessionTitle?: string }) => (
  <>
    <div className="flex flex-wrap items-center gap-1.5">
      <span className="text-xxs font-semibold uppercase tracking-caps text-primary">Day {courseModule.day}</span>
      <span className="text-sm font-semibold text-foreground">{courseModule.name}</span>
      {sessionTitle ? (
        <Badge tone="neutral" appearance="soft" className="gap-1 px-1.5 py-0 text-xxs">
          <VideoCameraIcon className="h-3 w-3" />
          live session
        </Badge>
      ) : null}
    </div>
    {courseModule.topics?.length ? (
      <p className="mt-0.5 text-xs text-muted-foreground">{courseModule.topics.join(' · ')}</p>
    ) : null}
  </>
);

const ModuleRow = ({ courseModule, sessionTitle }: { courseModule: CourseModuleDto; sessionTitle?: string }) => {
  const { getMaterialsByIds } = useMaterialLookups();
  const { getTestPapersByIds } = useTestPaperLookups();
  return (
    <li className="rounded-lg border border-border bg-background px-3 py-2.5">
      <ModuleHeading courseModule={courseModule} sessionTitle={sessionTitle} />
      <ul className="mt-2 flex flex-col gap-1 text-xs">
        {moduleItems(
          courseModule,
          getMaterialsByIds(courseModule.materials ?? []),
          getTestPapersByIds(courseModule.testPapers ?? []),
        ).map((item) => (
          <ItemRow key={item.key} icon={item.icon} name={item.name} badge={item.badge} />
        ))}
      </ul>
    </li>
  );
};

/** Modules grouped by their week, in week order. */
const groupByWeek = (modules: CourseModuleDto[]) =>
  [...new Set(modules.map((courseModule) => courseModule.week ?? 1))].map((week) => ({
    week,
    modules: modules.filter((courseModule) => (courseModule.week ?? 1) === week),
  }));

/** The theme the importer wrote into the week's first description, if any. */
const weekTheme = (modules: CourseModuleDto[], week: number): string => {
  const prefix = `Week ${week} — `;
  const description = modules[0]?.description ?? '';
  return description.startsWith(prefix) ? description.slice(prefix.length).split(':')[0] : '';
};

/** The course as the import will create it: name, description, counts, plans, outcomes. */
const CourseSummary = ({ imported }: { imported: IImportedCourse }) => (
  <div className="rounded-lg border border-border bg-muted/30 p-3">
    <p className="text-sm font-semibold text-foreground">{imported.course.name}</p>
    {imported.course.description ? (
      <p className="mt-1 whitespace-pre-line text-xs text-muted-foreground">{imported.course.description}</p>
    ) : null}
    <div className="mt-2 flex flex-wrap items-center gap-1.5">
      <Badge tone="neutral" appearance="soft">
        {imported.modules.length} days
      </Badge>
      <Badge tone="success" appearance="soft">
        {imported.modules.reduce((sum, courseModule) => sum + (courseModule.materials?.length ?? 0), 0)} lessons reused
      </Badge>
      <Badge tone="warning" appearance="soft">
        {imported.pendingLessons} lessons to generate
      </Badge>
      <Badge tone="warning" appearance="soft">
        {imported.pendingTests} quizzes to generate
      </Badge>
      {imported.plans.map((plan) => (
        <Badge key={plan._id} tone="neutral" appearance="soft">
          {plan.name}: {plan.currency === 'USD' ? '$' : '₹'}
          {plan.amount}
        </Badge>
      ))}
    </div>
    {imported.course.outcomes?.length ? (
      <ul className="mt-2 list-disc pl-4 text-xs text-muted-foreground">
        {imported.course.outcomes.map((outcome, index) => (
          <li key={index}>{outcome}</li>
        ))}
      </ul>
    ) : null}
  </div>
);

/** Step three: paste the reply, see what is wrong, preview the course week by week. */
export const AiCourseImportStep = ({ text, onChangeText, issues, imported, sessionTitles }: IProps) => {
  const fileRef = useRef<HTMLInputElement>(null);
  const errors = issues.filter((issue) => issue.level === 'error');
  const warnings = issues.filter((issue) => issue.level === 'warning');

  const readFile = (file: File | undefined) => {
    if (!file) return;
    file.text().then(onChangeText);
  };

  const weeks = imported ? groupByWeek(imported.modules) : [];

  return (
    <div className="flex flex-col gap-6">
      <DrawerSection
        title="The model's reply"
        isRequired
        hint="Paste the JSON, or upload the .json file. It is checked as you go."
        action={
          <>
            <input
              ref={fileRef}
              type="file"
              accept="application/json,.json,.txt"
              className="hidden"
              onChange={(event) => readFile(event.target.files?.[0])}
            />
            <Button
              isSecondary
              text="Upload file"
              leftsection={<UploadSimpleIcon weight="bold" className="h-4 w-4" />}
              onClick={() => fileRef.current?.click()}
            />
          </>
        }
      >
        <TextArea
          value={text}
          onChange={(event: React.ChangeEvent<HTMLTextAreaElement>) => onChangeText(event.target.value)}
          rows={8}
          className="font-mono text-xs leading-5"
          placeholder='{ "format": "acadimic.course/v1", ... }'
          aria-label="Generated JSON"
        />
      </DrawerSection>

      {text.trim() ? (
        <DrawerSection
          title={errors.length ? 'Fix these before importing' : 'Ready to import'}
          hint={
            errors.length
              ? `${errors.length} ${errors.length === 1 ? 'problem' : 'problems'}${warnings.length ? ` and ${warnings.length} ${warnings.length === 1 ? 'warning' : 'warnings'}` : ''}. Paste them back to the model and ask for corrected JSON.`
              : `${imported?.modules.length ?? 0} days${warnings.length ? `, ${warnings.length} ${warnings.length === 1 ? 'warning' : 'warnings'} worth a look` : ''}.`
          }
        >
          {issues.length ? (
            <AiIssueList issues={issues} />
          ) : (
            <p className="inline-flex items-center gap-1.5 text-xs text-success">
              <CheckCircleIcon weight="fill" className="h-4 w-4" />
              Everything checks out.
            </p>
          )}
        </DrawerSection>
      ) : null}

      {imported && !errors.length ? (
        <DrawerSection
          title="Preview"
          hint="The course as it will be created. Lessons and tests marked to generate become the next step's work."
        >
          <div className="flex flex-col gap-4">
            <CourseSummary imported={imported} />
            {weeks.map(({ week, modules }) => (
              <div key={week} className="flex flex-col gap-2">
                <p className="text-xs font-semibold text-foreground">
                  Week {week}
                  {weekTheme(modules, week) ? (
                    <span className="ml-1.5 font-normal text-muted-foreground">{weekTheme(modules, week)}</span>
                  ) : null}
                </p>
                <ul className="flex flex-col gap-1.5">
                  {modules.map((courseModule) => (
                    <ModuleRow
                      key={courseModule._id}
                      courseModule={courseModule}
                      sessionTitle={sessionTitles.get(courseModule._id)}
                    />
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </DrawerSection>
      ) : null}
    </div>
  );
};
