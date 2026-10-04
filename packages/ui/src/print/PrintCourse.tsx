import { PlayCircleIcon } from '@phosphor-icons/react';
import { MaterialType } from '@repo/shared/enums';
import { RichTextView } from '../content/RichTextView';
import { useResolvedImageUrl } from '../content/RichTextImage';
import { cn } from '../lib/cn';
import { ACADIMIC_LOGO, AcadimicLink, formatPrintDate, PrintClosing } from './PrintBrand';
import { PrintDocHeader } from './PrintDocHeader';
import { PRINT_TEXT } from './PrintQuestion';
import { PrintSheet } from './PrintShell';
import { PrintTestPaper } from './PrintTestPaper';
import type { IPrintCourse, IPrintMaterial, IPrintModule, IPrintQuiz } from './types';

const moduleMinutes = ({ materials, quizzes }: IPrintModule) =>
  materials.reduce((sum, material) => sum + (material.durationMins ?? 0), 0) +
  quizzes.reduce((sum, quiz) => sum + (quiz.paper.paper.durationMins ?? 0), 0);

const formatStudyTime = (minutes: number) => {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.round((minutes / 60) * 10) / 10;
  return `${hours}h`;
};

/** "Week 2 · Day 3 · 95 min", leaving out whatever the module does not have. */
const moduleWhen = (item: IPrintModule) =>
  [
    item.module.week ? `Week ${item.module.week}` : '',
    item.module.day ? `Day ${item.module.day}` : '',
    moduleMinutes(item) ? `${moduleMinutes(item)} min` : '',
  ]
    .filter(Boolean)
    .join(' · ');

const pad = (value: number) => String(value).padStart(2, '0');

/** "Quiz · Module 3", then what the printout reveals. */
const quizEyebrow = (quiz: IPrintQuiz, moduleNumber: number) => {
  const base = `Quiz · Module ${moduleNumber}`;
  if (quiz.version !== 'answers') return base;
  return quiz.solutions === 'shown' ? `${base} · With answers and solutions` : `${base} · With answers`;
};

/** Concentric discs and a dashed arc: the cover's one decoration, in the accent colour. */
const CoverArt = () => (
  <svg
    className="absolute -right-[40mm] -top-[30mm] h-[170mm] w-[170mm] max-sm:-right-[30mm] max-sm:-top-[20mm] max-sm:h-[90mm] max-sm:w-[90mm]"
    viewBox="0 0 400 400"
    aria-hidden="true"
  >
    <defs>
      <linearGradient id="print-cover-a" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#3b4fd0" />
        <stop offset="1" stopColor="#7a5af5" />
      </linearGradient>
    </defs>
    <circle cx="230" cy="170" r="170" fill="#eef0fc" />
    <circle cx="270" cy="150" r="104" fill="url(#print-cover-a)" />
    <circle cx="150" cy="268" r="40" fill="#3b4fd0" opacity=".14" />
    <path
      d="M40 300 Q 160 120 330 80"
      stroke="#fff"
      strokeWidth="3"
      fill="none"
      strokeDasharray="2 9"
      strokeLinecap="round"
      opacity=".9"
    />
    <circle cx="330" cy="80" r="7" fill="#fff" />
  </svg>
);

const CoverStat = ({ value, label }: { value: string | number; label: string }) => (
  <div className="rounded-xl border border-border bg-card px-[4.5mm] py-[4mm]">
    <b className="block text-[20pt] font-extrabold leading-tight">{value}</b>
    <span className="text-[8pt] font-semibold uppercase tracking-[0.08em] text-muted-foreground">{label}</span>
  </div>
);

const Thumbnail = ({ src }: { src: string }) => {
  const { url, isLoading } = useResolvedImageUrl(src);
  if (isLoading) return <span data-pending />;
  if (!url) return null;
  return (
    <img
      src={url}
      alt=""
      className="absolute right-[20mm] top-[38mm] h-[46mm] w-[46mm] rounded-2xl border-4 border-card object-cover shadow-lg max-sm:hidden"
    />
  );
};

const Cover = ({ data, eyebrow }: { data: IPrintCourse; eyebrow: string }) => {
  const { course, modules } = data;
  const lessons = modules.reduce((sum, item) => sum + item.materials.length, 0);
  const quizzes = modules.reduce((sum, item) => sum + item.quizzes.length, 0);
  const minutes = modules.reduce((sum, item) => sum + moduleMinutes(item), 0);
  // The cover is one fixed page: a long description is clamped and only the first outcomes fit.
  const outcomes = (course.outcomes ?? []).slice(0, 4);
  return (
    <section className="print-cover relative flex h-[297mm] flex-col overflow-hidden rounded-md bg-card px-[20mm] pb-[18mm] pt-[22mm] shadow-sm max-sm:h-auto max-sm:px-5 max-sm:pb-6 max-sm:pt-8 print:break-after-page print:rounded-none print:shadow-none">
      <CoverArt />
      {course.thumbnail ? <Thumbnail src={course.thumbnail} /> : null}
      <img src={ACADIMIC_LOGO} alt="Acadimic" className="relative h-[11mm] w-auto self-start max-sm:h-8" />
      <p className="relative mt-[48mm] max-sm:mt-24 text-[9pt] font-bold uppercase tracking-[0.14em] text-primary">
        {eyebrow}
      </p>
      <h1 className="relative mt-[5mm] max-w-[150mm] break-words text-[38pt] font-extrabold leading-[1.05] tracking-[-0.02em] max-sm:text-[24pt]">
        {course.name}
      </h1>
      {course.description ? (
        <p className="relative mt-[6mm] line-clamp-4 max-w-[135mm] text-[12pt] leading-[1.45] text-muted-foreground max-sm:text-[10.5pt]">
          {course.description}
        </p>
      ) : null}
      <div className="relative mt-[12mm] grid max-w-[160mm] grid-cols-4 gap-[4mm] max-sm:mt-8 max-sm:grid-cols-2 max-sm:gap-2">
        <CoverStat value={modules.length} label="Modules" />
        <CoverStat value={lessons} label="Lessons" />
        <CoverStat value={quizzes} label="Quizzes" />
        <CoverStat value={formatStudyTime(minutes)} label="Study time" />
      </div>
      {outcomes.length ? (
        <div className="relative mt-[10mm] max-w-[160mm]">
          <p className="mb-3 text-[8.5pt] font-bold uppercase tracking-[0.12em] text-muted-foreground">
            You will be able to
          </p>
          <ul className="grid grid-cols-2 gap-x-8 gap-y-2.5 max-sm:grid-cols-1">
            {outcomes.map((outcome) => (
              <li key={outcome} className="relative pl-[6mm] text-[10pt] text-muted-foreground">
                <span className="absolute left-0 top-[0.45em] h-[3mm] w-[3mm] rounded-full border-[1.2mm] border-primary bg-primary/20" />
                {outcome}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      <div className="relative mt-auto flex items-end justify-between border-t border-border pt-[6mm] text-[9pt] text-muted-foreground max-sm:mt-8 max-sm:gap-4">
        <div>
          <div>Made with Acadimic</div>
          <AcadimicLink className="text-[10pt] font-bold text-primary" />
        </div>
        <div className="text-right">Printed {formatPrintDate(new Date())}</div>
      </div>
    </section>
  );
};

const Contents = ({ modules }: { modules: IPrintModule[] }) => (
  <PrintSheet isNewPage={false}>
    <p className="text-[8.5pt] font-bold uppercase tracking-[0.14em] text-primary">Contents</p>
    <h2 className="mb-8 mt-1.5 text-[24pt] font-extrabold">What’s inside</h2>
    <ol>
      {modules.map((item) => (
        <li
          key={item.module._id}
          className="grid grid-cols-[11mm_1fr_auto] gap-x-4 border-t border-border py-[4.5mm] break-inside-avoid max-sm:grid-cols-[11mm_1fr] max-sm:gap-x-3"
        >
          <span className="flex h-[9mm] w-[9mm] items-center justify-center rounded-lg bg-primary text-[10pt] font-extrabold text-primary-foreground">
            {item.number}
          </span>
          <div>
            <a href={`#module-${item.module._id}`} className="text-[11.5pt] font-bold text-foreground">
              {item.module.name}
            </a>
            {item.module.description ? (
              <p className="mt-0.5 text-[9pt] text-muted-foreground">{item.module.description}</p>
            ) : null}
          </div>
          <span className="whitespace-nowrap text-[8.5pt] font-semibold text-muted-foreground max-sm:col-start-2 max-sm:row-start-2 max-sm:mt-1">
            {moduleWhen(item)}
          </span>
          <ul className="col-span-2 col-start-2 mt-2.5 columns-2 gap-x-8 max-sm:col-[1/-1] max-sm:columns-1">
            {[
              ...item.materials.map((material) => ({ id: material._id, kind: 'Lesson', name: material.name })),
              ...item.quizzes.map((quiz) => ({ id: quiz.paper.paper._id, kind: 'Quiz', name: quiz.paper.paper.name })),
            ].map((row) => (
              <li
                key={row.id}
                className="flex items-baseline gap-2 py-[0.8mm] text-[9.5pt] text-muted-foreground break-inside-avoid"
              >
                <span className="min-w-[11mm] text-[7.5pt] font-bold uppercase tracking-[0.06em] text-primary">
                  {row.kind}
                </span>
                {row.name}
              </li>
            ))}
          </ul>
        </li>
      ))}
    </ol>
  </PrintSheet>
);

const Lesson = ({ material, label }: { material: IPrintMaterial; label: string }) => (
  <article className="mt-8 first:mt-0">
    <div className="mb-5 flex items-baseline justify-between gap-6 border-b-2 border-foreground pb-2.5 break-after-avoid">
      <div>
        <span className="mb-1 block text-[8pt] font-bold uppercase tracking-[0.1em] text-primary">{label}</span>
        <h3 className="text-[15.5pt] font-extrabold">{material.name}</h3>
      </div>
      {material.durationMins ? (
        <span className="shrink-0 rounded-full bg-primary/10 px-2.5 py-0.5 text-[7.8pt] font-semibold text-primary">
          {material.durationMins} min
        </span>
      ) : null}
    </div>
    {material.url ? (
      <div className="mb-4 flex items-center gap-3 rounded-xl border border-border px-4 py-3 break-inside-avoid">
        <PlayCircleIcon weight="fill" className="h-6 w-6 shrink-0 text-primary" />
        <div className="min-w-0 text-[9.5pt]">
          <p className="font-semibold">{material.type === MaterialType.VIDEO ? 'Video lesson' : 'Linked resource'}</p>
          <a href={material.url} className="break-all text-primary">
            {material.url}
          </a>
        </div>
      </div>
    ) : null}
    <RichTextView value={material.content} className={cn(PRINT_TEXT, 'hyphens-auto')} />
  </article>
);

/** A whole course, or one module of it printed on its own. */
type PrintScope = 'course' | 'module';

/** A module's opening: the coloured band inside a course, the document header when printed alone. */
const ModuleOpening = ({ item, courseName, scope }: { item: IPrintModule; courseName: string; scope: PrintScope }) => {
  if (scope === 'course') return <ModuleBand item={item} />;
  const minutes = moduleMinutes(item);
  return (
    <div id={`module-${item.module._id}`} className="mb-9">
      <PrintDocHeader
        eyebrow={`Module ${pad(item.number)} · ${courseName}`}
        title={item.module.name}
        stats={[
          { value: item.materials.length, label: 'Lessons' },
          { value: item.quizzes.length, label: 'Quizzes' },
          ...(minutes ? [{ value: minutes, label: 'Minutes' }] : []),
        ]}
        size="large"
      />
      {item.module.description ? (
        <p className="mt-4 text-[10pt] text-muted-foreground">{item.module.description}</p>
      ) : null}
    </div>
  );
};

const ModuleBand = ({ item }: { item: IPrintModule }) => (
  <div
    id={`module-${item.module._id}`}
    className="relative mb-9 overflow-hidden rounded-xl bg-gradient-to-br from-primary to-[#5a3fd0] px-8 py-7 text-primary-foreground break-inside-avoid max-sm:px-5 max-sm:py-5"
  >
    <span className="absolute -right-[14mm] -top-[18mm] h-[60mm] w-[60mm] rounded-full bg-primary-foreground/10" />
    <p className="relative text-[8.5pt] font-bold uppercase tracking-[0.14em] text-primary-foreground/80">
      Module {pad(item.number)}
      {item.module.week ? ` · Week ${item.module.week}` : ''}
    </p>
    <h2 className="relative mt-2 text-[21pt] font-extrabold leading-tight max-sm:text-[17pt]">{item.module.name}</h2>
    {item.module.description ? (
      <p className="relative mt-2 max-w-[140mm] text-[10pt] text-primary-foreground/90">{item.module.description}</p>
    ) : null}
  </div>
);

interface IModuleSheetProps {
  item: IPrintModule;
  courseName: string;
  scope: PrintScope;
  isNewPage: boolean;
}

const ModuleSheet = ({ item, courseName, scope, isNewPage }: IModuleSheetProps) => (
  <PrintSheet isNewPage={isNewPage}>
    <ModuleOpening item={item} courseName={courseName} scope={scope} />
    {item.materials.map((material, lessonIndex) => (
      <Lesson key={material._id} material={material} label={`Lesson ${item.number}.${lessonIndex + 1}`} />
    ))}
    {item.quizzes.map((quiz) => (
      <div key={quiz.paper.paper._id} className="mt-10 print:break-before-page">
        <PrintTestPaper
          paper={quiz.paper}
          version={quiz.version}
          solutions={quiz.solutions}
          eyebrow={quizEyebrow(quiz, item.number)}
          placement="embedded"
          sitting={null}
        />
      </div>
    ))}
  </PrintSheet>
);

export interface IPrintCourseProps {
  data: IPrintCourse;
  /** The line above the title on the cover: "Course · Class 11 · Physics". */
  eyebrow: string;
  /**
   * `course` prints the cover, the contents and every module. `module` prints the modules alone,
   * under the course's name, for a single module printed on its own.
   */
  scope: PrintScope;
}

/** A whole course, or one module of it: lessons and quizzes, then the closing panel. */
export const PrintCourse = ({ data, eyebrow, scope }: IPrintCourseProps) => (
  <>
    {scope === 'course' ? (
      <>
        <Cover data={data} eyebrow={eyebrow} />
        <Contents modules={data.modules} />
      </>
    ) : null}
    {data.modules.map((item, index) => (
      <ModuleSheet
        key={item.module._id}
        item={item}
        courseName={data.course.name}
        scope={scope}
        isNewPage={scope === 'course' || index > 0}
      />
    ))}
    <PrintSheet isNewPage={false}>
      <PrintClosing />
    </PrintSheet>
  </>
);
