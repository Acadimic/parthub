import {
  type ChapterDto,
  type CourseDto,
  type CourseModuleDto,
  type MaterialDto,
  type PlanDto,
  type StandardDto,
  type SubjectDto,
  type TestPaperDto,
} from '../contracts';
import {
  AI_COURSE_FORMAT,
  type IAiCourse,
  type IAiCourseDay,
  type IAiLessonRef,
  type IAiLessonSpec,
  type IAiPendingWork,
  type IAiTestRef,
} from '../interfaces';
import { CurrencyType, LevelType, PeriodType } from '../enums';
import { createObjectId, slugify } from '../utils/object-id.util';
import { type IAiIssue, parseJsonObject, repairIssue } from './common';
import { EXAM_STYLES, LANGUAGES } from './test-paper-generator';

export type CoursePace = 'light' | 'standard' | 'intensive';

/** What the teacher decides; everything else the prompt settles. */
export interface IAiCourseSetup {
  standards: string[];
  /** Empty means every subject of the standards. */
  subjects: string[];
  weeks: number;
  daysPerWeek: number;
  pace: CoursePace;
  examStyle: string;
  language: string;
  includeQuizzes: boolean;
  includeSessions: boolean;
  isPaid: boolean;
  monthlyAmount: number;
  yearlyAmount: number;
  instructions: string;
}

/** The workspace the prompt lists and the validator checks against. */
export interface IAiCourseContext {
  courseId: string;
  standards: StandardDto[];
  subjects: SubjectDto[];
  chapters: ChapterDto[];
  /** Saved lessons for these standards and subjects; the model may reuse them by id. */
  materials: MaterialDto[];
  /** Saved test papers for these standards; likewise. */
  testPapers: TestPaperDto[];
}

export const PACES: Record<CoursePace, { label: string; minutesPerDay: number; hint: string }> = {
  light: { label: 'Light', minutesPerDay: 45, hint: 'about 45 minutes a day' },
  standard: { label: 'Standard', minutesPerDay: 75, hint: 'about 75 minutes a day' },
  intensive: { label: 'Intensive', minutesPerDay: 120, hint: 'about two hours a day' },
};

export const COURSE_LIMITS = { minWeeks: 1, maxWeeks: 24, minDaysPerWeek: 1, maxDaysPerWeek: 7, maxDays: 120 } as const;

export const DEFAULT_COURSE_SETUP: IAiCourseSetup = {
  standards: [],
  subjects: [],
  weeks: 8,
  daysPerWeek: 5,
  pace: 'standard',
  examStyle: EXAM_STYLES[0],
  language: LANGUAGES[0],
  includeQuizzes: true,
  includeSessions: true,
  isPaid: true,
  monthlyAmount: 499,
  yearlyAmount: 3999,
  instructions: '',
};

export const totalDays = (setup: IAiCourseSetup): number =>
  Math.min(COURSE_LIMITS.maxDays, setup.weeks * setup.daysPerWeek);

const nameOf = (rows: { _id: string; name: string }[], id: string) => rows.find((row) => row._id === id)?.name ?? id;

/**
 * The prompt a teacher pastes into a model.
 *
 * The workspace's ids go in as data — standards, subjects, chapters, and every saved lesson and
 * test for them — so the model reuses what exists by id and only asks for what is missing. The
 * ladder, the pace and the shape of a day are spelled out so the plan reads as one course.
 */
export const buildCourseBlueprintPrompt = (setup: IAiCourseSetup, context: IAiCourseContext): string => {
  const pace = PACES[setup.pace];
  const days = totalDays(setup);
  const standards = context.standards.map((standard) => ({ id: standard._id, name: standard.name }));
  const subjects = context.subjects.map((subject) => ({ id: subject._id, name: subject.name }));
  const chapters = context.chapters.map((chapter) => ({
    id: chapter._id,
    name: chapter.name,
    standard: nameOf(context.standards, chapter.standard),
    subject: nameOf(context.subjects, chapter.subject),
  }));
  const existingLessons = context.materials.map((material) => ({
    id: material._id,
    name: material.name,
    level: material.level,
    durationMins: material.durationMins,
    subject: material.subject ? nameOf(context.subjects, material.subject) : undefined,
    chapter: material.chapter ? nameOf(context.chapters, material.chapter) : undefined,
    tag: material.tag || undefined,
  }));
  const existingTests = context.testPapers.map((paper) => ({
    id: paper._id,
    name: paper.name,
    questions: paper.totalQuestions,
    durationMins: paper.durationMins,
    subjects: (paper.subjects ?? []).map((id) => nameOf(context.subjects, id)),
  }));
  const scope = `${standards.map((s) => s.name).join(', ')} — ${subjects.map((s) => s.name).join(', ')}`;

  return `# Role

You are a senior curriculum designer for ${scope}, preparing students for the ${setup.examStyle}. You design courses that teachers actually run: a syllabus laid across days, each day sized to what a student can do, each idea built on the one before. You return the design as one JSON document that a system imports directly.

# Task

Design a ${setup.weeks}-week course of ${setup.daysPerWeek} study days a week (${days} days in all) on ${scope}, in ${setup.language}, at a ${pace.label.toLowerCase()} pace (${pace.hint}). Return it in the exact JSON format in the "Output" section, and return the JSON only.

# Workspace data (use these ids verbatim)

\`\`\`json
${JSON.stringify(
  {
    courseId: context.courseId,
    standards,
    subjects,
    chapters,
    existingLessons,
    existingTests,
    levels: Object.values(LevelType),
  },
  null,
  2,
)}
\`\`\`

# Research (do this before designing)

Search the web for the official ${setup.examStyle} syllabus for ${scope} and the prescribed textbook's chapter order, so the topics are the real ones in the official order. Write them as the "outline" first — one line per topic, in teaching order — then lay them across the days so that every outline line is taught on some day and nothing is repeated.

# How to plan the days

1. **Pace**: a day's "estimatedMins" — its lessons, its quiz and its session together — should be close to ${pace.minutesPerDay} minutes and never more than ${Math.round(pace.minutesPerDay * 1.5)}.
2. **Ladder**: within each week the lesson levels climb from easy to medium to hard and never fall back; the course as a whole climbs the same way. Each day names in its description what it assumes from earlier days.
3. **Reuse first**: where an existing lesson (from "existingLessons") teaches a day's topic at the right level, put its id in "lessons" as { "use": id } rather than asking for a new one. Likewise a fitting existing test as { "use": id } in "tests". Never invent an id; every "use" must come from the workspace data. Do not use the same lesson on two days.
4. **New lessons**: a day has one to three lessons. For a lesson that does not exist, give { "generate": { name, level, topics, durationMins, chapter } } — a name a student would recognise, the level from the ladder, three to six topic phrases, a realistic duration (20–60 minutes), and the chapter id when chapters are listed.
${setup.includeQuizzes ? '5. **Quizzes**: roughly every third day, and on the last day of every week, one short test: { "generate": { name, questionCount (8–15), chapters (ids), topics, durationMins (15–30) } }. Other days have "tests": [].' : '5. **No tests**: leave every "tests" array empty.'}
${setup.includeSessions ? '6. **Live sessions**: one per week, on the day that most needs a teacher — a hard idea, or a review before a test: { "title", "durationMins" (45–60), "agenda" (three to five lines) }. Other days omit "session".' : '6. **No live sessions**: omit "session" everywhere.'}
7. **Week themes**: each week has a theme of a few words; the first day of a week introduces it and the last consolidates it.
8. **Description, outcomes, prerequisites**: plain prose, no Markdown. The description is two to four short paragraphs a parent or student would read on a course page: who it is for, what it covers, how it is taught. Outcomes are five to eight "can do" statements. Prerequisites are two to five lines.
9. **Plans**: ${setup.isPaid ? `a monthly plan around ₹${setup.monthlyAmount} and a yearly plan around ₹${setup.yearlyAmount}, in INR, with "realAmount" the list price before discount (at least the amount)` : 'one free monthly plan with amount 0 and realAmount 0'}. Names a buyer would understand.
${setup.instructions.trim() ? `\n### Additional instructions from the teacher\n${setup.instructions.trim()}\n` : ''}
# Output

Return exactly one JSON object and nothing else — no prose, no code fence. It must match this TypeScript type:

\`\`\`ts
interface Output {
  format: "${AI_COURSE_FORMAT}";
  courseId: string;                 // the id above
  standards: string[];              // the ids above
  subjects: string[];               // the ids above
  title: string;
  tagline: string;                  // at most 120 characters
  description: string;              // plain prose
  outcomes: string[];
  prerequisites: string[];
  outline: string[];
  generatedBy: string;              // your model name
  weeks: Array<{
    ref: string;                    // "W1", "W2" …
    theme: string;
    days: Array<{
      ref: string;                  // "W1-D1" …
      name: string;
      description: string;          // one or two sentences
      topics: string[];
      estimatedMins: number;
      lessons: Array<{ use: string } | { generate: { name: string; level: ${Object.values(LevelType)
        .map((level) => `"${level}"`)
        .join(' | ')}; topics: string[]; durationMins: number; chapter?: string } }>;
      tests: Array<{ use: string } | { generate: { name: string; questionCount: number; chapters: string[]; topics: string[]; durationMins: number } }>;
      session?: { title: string; durationMins: number; agenda: string[] };
    }>;
  }>;
  plans: Array<{ name: string; period: "monthly" | "yearly"; amount: number; realAmount: number; currency: "INR" | "USD" }>;
}
\`\`\`

# Before you answer, check

- Exactly ${setup.weeks} weeks of ${setup.daysPerWeek} days; every "ref" unique; every day has at least one lesson, test or session.
- Every "use" id is in the workspace data and no lesson is used twice; every "chapter" id is in the list.
- Every outline line is covered by some day's topics; no two days teach the same thing.
- Each day's estimatedMins is near ${pace.minutesPerDay}; the levels climb within each week.
- The JSON parses: strings quoted, no trailing commas, no comments.`;
};

// ------------------------------------------------------------------------------------------------
// Validation
// ------------------------------------------------------------------------------------------------

export interface IParsedAiCourse {
  file: IAiCourse | null;
  issues: IAiIssue[];
}

export const parseAiCourse = (text: string): IParsedAiCourse => {
  const { value: raw, issue, repairs } = parseJsonObject(text);
  if (!raw) return { file: null, issues: issue ? [issue] : [] };
  const issues: IAiIssue[] = repairIssue(repairs);
  if (raw.format !== AI_COURSE_FORMAT) {
    issues.push({ level: 'error', path: 'format', message: `"format" must be "${AI_COURSE_FORMAT}".` });
  }
  if (!Array.isArray(raw.weeks) || !raw.weeks.length) {
    issues.push({ level: 'error', path: 'weeks', message: '"weeks" must be a non-empty array.' });
    return { file: null, issues };
  }
  return { file: raw as unknown as IAiCourse, issues };
};

const LEVEL_RANK: Record<LevelType, number> = { [LevelType.EASY]: 0, [LevelType.MEDIUM]: 1, [LevelType.HARD]: 2 };

const isUse = (ref: IAiLessonRef | IAiTestRef): ref is { use: string } => 'use' in ref && typeof ref.use === 'string';

interface IDayCheck {
  day: IAiCourseDay;
  path: string;
  setup: IAiCourseSetup;
  context: IAiCourseContext;
  issues: IAiIssue[];
  /** Lesson ids already placed on an earlier day, so a repeat can be flagged. */
  usedLessons: Set<string>;
}

const checkDay = ({ day, path, setup, context, issues, usedLessons }: IDayCheck) => {
  if (!day.name?.trim()) issues.push({ level: 'error', path, message: 'The day has no name.' });
  const lessons = day.lessons ?? [];
  const tests = day.tests ?? [];
  if (!lessons.length && !tests.length && !day.session) {
    issues.push({ level: 'error', path, message: 'The day has no lessons, tests or session.' });
  }
  const pace = PACES[setup.pace].minutesPerDay;
  if (typeof day.estimatedMins === 'number' && day.estimatedMins > pace * 1.5) {
    issues.push({
      level: 'warning',
      path: `${path}.estimatedMins`,
      message: `${day.estimatedMins} minutes is well over the ${pace}-minute pace.`,
    });
  }
  lessons.forEach((lesson, index) => {
    const at = `${path}.lessons[${index}]`;
    if (isUse(lesson)) {
      if (!context.materials.some((material) => material._id === lesson.use)) {
        issues.push({ level: 'error', path: at, message: 'Uses a lesson id that is not in the workspace.' });
      } else if (usedLessons.has(lesson.use)) {
        issues.push({ level: 'warning', path: at, message: 'This lesson is already used on another day.' });
      }
      usedLessons.add(lesson.use);
      return;
    }
    const spec = lesson.generate;
    if (!spec?.name?.trim()) issues.push({ level: 'error', path: at, message: 'A lesson to generate needs a name.' });
    if (!spec?.topics?.length) issues.push({ level: 'error', path: at, message: 'A lesson to generate needs topics.' });
    if (spec && !Object.values(LevelType).includes(spec.level)) {
      issues.push({
        level: 'error',
        path: `${at}.level`,
        message: `"level" must be one of ${Object.values(LevelType).join(', ')}.`,
      });
    }
    if (spec?.chapter && !context.chapters.some((chapter) => chapter._id === spec.chapter)) {
      issues.push({ level: 'error', path: `${at}.chapter`, message: 'The chapter id is not in the workspace.' });
    }
  });
  tests.forEach((test, index) => {
    const at = `${path}.tests[${index}]`;
    if (isUse(test)) {
      if (!context.testPapers.some((paper) => paper._id === test.use)) {
        issues.push({ level: 'error', path: at, message: 'Uses a test paper id that is not in the workspace.' });
      }
      return;
    }
    const spec = test.generate;
    if (!spec?.name?.trim()) issues.push({ level: 'error', path: at, message: 'A test to generate needs a name.' });
    if (!spec || typeof spec.questionCount !== 'number' || spec.questionCount <= 0) {
      issues.push({ level: 'error', path: at, message: 'A test to generate needs a positive questionCount.' });
    }
    (spec?.chapters ?? []).forEach((chapterId) => {
      if (!context.chapters.some((chapter) => chapter._id === chapterId)) {
        issues.push({ level: 'error', path: `${at}.chapters`, message: 'A chapter id is not in the workspace.' });
      }
    });
  });
  if (day.session && (!day.session.title?.trim() || typeof day.session.durationMins !== 'number')) {
    issues.push({
      level: 'warning',
      path: `${path}.session`,
      message: 'The session needs a title and a duration; it will import without them.',
    });
  }
};

/** Everything the shape check could not know: ids, counts, the ladder, coverage, plans. */
export const validateAiCourse = (file: IAiCourse, setup: IAiCourseSetup, context: IAiCourseContext): IAiIssue[] => {
  const issues: IAiIssue[] = [];
  if (file.courseId !== context.courseId) {
    issues.push({ level: 'error', path: 'courseId', message: 'This file was generated for a different course.' });
  }
  const standardIds = new Set(context.standards.map((standard) => standard._id));
  const subjectIds = new Set(context.subjects.map((subject) => subject._id));
  (file.standards ?? []).forEach((id) => {
    if (!standardIds.has(id)) {
      issues.push({
        level: 'error',
        path: 'standards',
        message: 'A standard id is not one this course was set up with.',
      });
    }
  });
  (file.subjects ?? []).forEach((id) => {
    if (!subjectIds.has(id)) {
      issues.push({
        level: 'error',
        path: 'subjects',
        message: 'A subject id is not one this course was set up with.',
      });
    }
  });
  if (!file.title?.trim()) issues.push({ level: 'error', path: 'title', message: 'The course has no title.' });
  if ((file.description ?? '').split(/\s+/).length < 60) {
    issues.push({
      level: 'warning',
      path: 'description',
      message: 'The description is short; two to four paragraphs were asked for.',
    });
  }
  const dayCount = file.weeks.reduce((sum, week) => sum + (week.days?.length ?? 0), 0);
  const expected = totalDays(setup);
  if (dayCount !== expected) {
    issues.push({
      level: 'warning',
      path: 'weeks',
      message: `${dayCount} days in the file; the setup asked for ${expected}.`,
    });
  }
  const refs = new Set<string>();
  const usedLessons = new Set<string>();
  const topicsCovered = new Set<string>();
  file.weeks.forEach((week, weekIndex) => {
    const weekPath = week.ref || `weeks[${weekIndex}]`;
    if (!week.days?.length) {
      issues.push({ level: 'error', path: weekPath, message: 'The week has no days.' });
      return;
    }
    let previousRank = -1;
    week.days.forEach((day, dayIndex) => {
      const path = day.ref || `${weekPath}.days[${dayIndex}]`;
      if (refs.has(path)) issues.push({ level: 'warning', path, message: 'Duplicate ref.' });
      refs.add(path);
      checkDay({ day, path, setup, context, issues, usedLessons });
      (day.topics ?? []).forEach((topic) => topicsCovered.add(topic.trim().toLowerCase()));
      const ranks = (day.lessons ?? [])
        .filter((lesson) => !isUse(lesson))
        .map((lesson) => LEVEL_RANK[(lesson as { generate: IAiLessonSpec }).generate.level] ?? 0);
      const rank = ranks.length ? Math.max(...ranks) : previousRank;
      if (rank < previousRank) {
        issues.push({ level: 'warning', path, message: 'Easier than the day before it; a week should climb.' });
      }
      previousRank = rank;
    });
  });
  const uncovered = (file.outline ?? []).filter((line) => {
    const key = line.trim().toLowerCase();
    return key && ![...topicsCovered].some((topic) => topic.includes(key) || key.includes(topic));
  });
  if (uncovered.length) {
    issues.push({
      level: 'warning',
      path: 'outline',
      message: `${uncovered.length} outline ${uncovered.length === 1 ? 'line is' : 'lines are'} not named in any day's topics: ${uncovered.slice(0, 3).join('; ')}${uncovered.length > 3 ? '…' : ''}`,
    });
  }
  (file.plans ?? []).forEach((plan, index) => {
    if (!['monthly', 'yearly'].includes(plan.period)) {
      issues.push({ level: 'error', path: `plans[${index}]`, message: 'Plan period must be monthly or yearly.' });
    }
    if (typeof plan.amount !== 'number' || plan.amount < 0) {
      issues.push({ level: 'error', path: `plans[${index}]`, message: 'Plan amount must be a number.' });
    }
  });
  return issues;
};

// ------------------------------------------------------------------------------------------------
// Import
// ------------------------------------------------------------------------------------------------

export interface IImportedCourse {
  course: CourseDto;
  plans: PlanDto[];
  modules: CourseModuleDto[];
  /** How many lessons and tests the modules still owe. */
  pendingLessons: number;
  pendingTests: number;
}

const EMPTY_STATS: CourseDto['stats'] = {
  daysCount: 0,
  videosCount: 0,
  readingsCount: 0,
  testsCount: 0,
  meetsCount: 0,
  testsDurationMins: 0,
  materialsDurationMins: 0,
  meetsDurationMins: 0,
};

const toPending = (day: IAiCourseDay): IAiPendingWork[] => [
  ...(day.lessons ?? [])
    .filter((lesson): lesson is Exclude<IAiLessonRef, { use: string }> => !isUse(lesson))
    .map((lesson) => ({
      key: createObjectId(),
      kind: 'lesson' as const,
      spec: lesson.generate,
      status: 'pending' as const,
    })),
  ...(day.tests ?? [])
    .filter((test): test is Exclude<IAiTestRef, { use: string }> => !isUse(test))
    .map((test) => ({ key: createObjectId(), kind: 'test' as const, spec: test.generate, status: 'pending' as const })),
  // A session is scheduled later, once the teacher picks a start date, so it waits here too.
  ...(day.session?.title?.trim()
    ? [{ key: createObjectId(), kind: 'session' as const, spec: day.session, status: 'pending' as const }]
    : []),
];

const toPlans = (file: IAiCourse, setup: IAiCourseSetup, courseId: string): PlanDto[] => {
  const source = file.plans?.length
    ? file.plans
    : [
        {
          name: setup.isPaid ? 'Monthly' : 'Free',
          period: 'monthly' as const,
          amount: setup.isPaid ? setup.monthlyAmount : 0,
          realAmount: setup.isPaid ? setup.monthlyAmount : 0,
          currency: 'INR' as const,
        },
      ];
  return source.map((plan, index) => ({
    _id: createObjectId(),
    name: plan.name?.trim() || (plan.period === 'yearly' ? 'Yearly' : 'Monthly'),
    courses: [courseId],
    meets: [],
    amount: Math.max(0, Math.round(plan.amount)),
    realAmount: Math.max(Math.round(plan.amount), Math.round(plan.realAmount ?? plan.amount)),
    currency: plan.currency === 'USD' ? CurrencyType.USD : CurrencyType.INR,
    interval: 1,
    period: plan.period === 'yearly' ? PeriodType.YEARLY : PeriodType.MONTHLY,
    order: index,
    isRecommended: plan.period === 'yearly',
  }));
};

/** The rows an import writes: the course, its plans, and one module per day in file order. */
export const toImportedCourse = (
  file: IAiCourse,
  setup: IAiCourseSetup,
  context: IAiCourseContext,
  existingCourseCount: number,
): IImportedCourse => {
  const courseId = context.courseId;
  const course: CourseDto = {
    _id: courseId,
    name: file.title.trim(),
    slug: slugify(file.title.trim()),
    description: [file.tagline?.trim(), file.description?.trim()].filter(Boolean).join('\n\n'),
    standards: context.standards.map((standard) => standard._id),
    subjects: setup.subjects,
    courses: [courseId],
    meets: [],
    order: existingCourseCount,
    isPublished: false,
    tag: 'ai_generated',
    attachments: [],
    stats: { ...EMPTY_STATS },
    outline: (file.outline ?? []).map((line) => line.trim()).filter(Boolean),
    outcomes: (file.outcomes ?? []).map((line) => line.trim()).filter(Boolean),
    prerequisites: (file.prerequisites ?? []).map((line) => line.trim()).filter(Boolean),
  };
  let day = 0;
  let pendingLessons = 0;
  let pendingTests = 0;
  const modules: CourseModuleDto[] = file.weeks.flatMap((week, weekIndex) =>
    (week.days ?? []).map((item) => {
      day += 1;
      const pending = toPending(item);
      pendingLessons += pending.filter((work) => work.kind === 'lesson').length;
      pendingTests += pending.filter((work) => work.kind === 'test').length;
      const theme = week.theme?.trim();
      return {
        _id: createObjectId(),
        course: courseId,
        name: item.name.trim(),
        slug: slugify(item.name.trim()),
        description: [theme ? `Week ${weekIndex + 1} — ${theme}` : '', item.description?.trim()]
          .filter(Boolean)
          .join(': '),
        day,
        week: weekIndex + 1,
        topics: (item.topics ?? []).map((topic) => topic.trim()).filter(Boolean),
        materials: (item.lessons ?? []).filter(isUse).map((lesson) => lesson.use),
        testPapers: (item.tests ?? []).filter(isUse).map((test) => test.use),
        meets: [],
        pending: pending.length ? pending : undefined,
      };
    }),
  );
  return { course, plans: toPlans(file, setup, courseId), modules, pendingLessons, pendingTests };
};
