import {
  type CourseDto,
  type CourseModuleDto,
  type ILinkCheck,
  type MaterialDto,
  type MeetDto,
  type TestPaperDto,
} from '../contracts';
import { AI_COURSE_REVIEW_FORMAT, type IAiCourseReview, type IAiReviewFinding } from '../interfaces';
import { LevelType } from '../enums';
import { type IAiIssue, parseJsonObject } from './common';

export interface ICourseReviewInput {
  course: CourseDto;
  modules: CourseModuleDto[];
  materialById: Map<string, MaterialDto>;
  testPaperById: Map<string, TestPaperDto>;
  meetById: Map<string, MeetDto>;
  /** Results of the link check over every linked lesson's attachments, when it has run. */
  linkChecks?: Map<string, ILinkCheck>;
}

export interface ICoverageRow {
  line: string;
  /** Day numbers whose topics or lessons name the outline line. */
  days: number[];
}

export interface IDayPace {
  day: number;
  name: string;
  minutes: number;
}

export interface ICourseReview {
  issues: IAiIssue[];
  coverage: ICoverageRow[];
  pace: IDayPace[];
  medianMins: number;
  /** Lessons and quizzes still owed, in total. */
  pendingCount: number;
  /** Errors block publishing; warnings do not. */
  canPublish: boolean;
}

const LEVEL_RANK: Record<LevelType, number> = { [LevelType.EASY]: 0, [LevelType.MEDIUM]: 1, [LevelType.HARD]: 2 };

const norm = (value: string) => value.trim().toLowerCase();

/** Whether a syllabus line is named by a topic or a lesson title, either containing the other. */
const mentions = (line: string, candidates: string[]): boolean => {
  const key = norm(line);
  if (!key) return false;
  return candidates.some((candidate) => {
    const other = norm(candidate);
    return other && (other.includes(key) || key.includes(other));
  });
};

const dayMinutes = (courseModule: CourseModuleDto, input: ICourseReviewInput): number =>
  (courseModule.materials ?? []).reduce((sum, id) => sum + (input.materialById.get(id)?.durationMins ?? 0), 0) +
  (courseModule.testPapers ?? []).reduce((sum, id) => sum + (input.testPaperById.get(id)?.durationMins ?? 0), 0) +
  (courseModule.meets ?? []).reduce((sum, id) => sum + (input.meetById.get(id)?.durationMins ?? 0), 0);

const median = (values: number[]): number => {
  const sorted = [...values].filter((value) => value > 0).sort((a, b) => a - b);
  if (!sorted.length) return 0;
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : Math.round((sorted[mid - 1] + sorted[mid]) / 2);
};

/** Every address the course's lessons cite, for the link check. */
export const collectCourseLinks = (input: ICourseReviewInput): string[] => [
  ...new Set(
    input.modules.flatMap((courseModule) =>
      (courseModule.materials ?? []).flatMap((id) =>
        (input.materialById.get(id)?.attachments ?? [])
          .filter((attachment) => attachment.url)
          .map((attachment) => attachment.url),
      ),
    ),
  ),
];

/** One module's checks; returns how many lessons and quizzes it still owes. */
const checkModule = (
  courseModule: CourseModuleDto,
  input: ICourseReviewInput,
  medianMins: number,
  issues: IAiIssue[],
): number => {
  const path = `D${courseModule.day}`;
  const open = (courseModule.pending ?? []).filter((work) => work.status === 'pending' || work.status === 'prompted');
  const owed = open.filter((work) => work.kind !== 'session');
  const linkedCount =
    (courseModule.materials?.length ?? 0) + (courseModule.testPapers?.length ?? 0) + (courseModule.meets?.length ?? 0);
  if (!linkedCount && !owed.length) {
    issues.push({ level: 'error', path, message: `"${courseModule.name}" has no content at all.` });
  }
  if (owed.length) {
    issues.push({
      level: 'error',
      path,
      message: `${owed.length} planned ${owed.length === 1 ? 'item is' : 'items are'} still to generate.`,
    });
  }
  if (open.some((work) => work.kind === 'session')) {
    issues.push({ level: 'warning', path, message: 'A live session is planned but not scheduled yet.' });
  }
  checkLoad(courseModule, input, medianMins, issues);
  checkLinkedContent(courseModule, input, path, issues);
  return owed.length;
};

/** A day far off the course's own median is flagged either way; an empty day is reported elsewhere. */
const checkLoad = (
  courseModule: CourseModuleDto,
  input: ICourseReviewInput,
  medianMins: number,
  issues: IAiIssue[],
) => {
  if (!medianMins) return;
  const path = `D${courseModule.day}`;
  const minutes = dayMinutes(courseModule, input);
  const hasContent =
    (courseModule.materials?.length ?? 0) + (courseModule.testPapers?.length ?? 0) + (courseModule.meets?.length ?? 0) >
    0;
  if (minutes > medianMins * 1.6) {
    issues.push({ level: 'warning', path, message: `${minutes} minutes, well over the course's usual ${medianMins}.` });
  }
  if (hasContent && minutes < medianMins * 0.4) {
    issues.push({
      level: 'warning',
      path,
      message: `${minutes} minutes, much lighter than the course's usual ${medianMins}.`,
    });
  }
};

/** Linked lessons and papers must exist, and a lesson's references must answer. */
const checkLinkedContent = (
  courseModule: CourseModuleDto,
  input: ICourseReviewInput,
  path: string,
  issues: IAiIssue[],
) => {
  (courseModule.materials ?? []).forEach((id) => {
    const material = input.materialById.get(id);
    if (!material) {
      issues.push({ level: 'error', path, message: 'Links to a lesson that no longer exists.' });
      return;
    }
    const dead = (material.attachments ?? []).filter(
      (attachment) => input.linkChecks?.get(attachment.url)?.ok === false,
    );
    if (dead.length) {
      issues.push({
        level: 'error',
        path,
        message: `"${material.name}" has ${dead.length} unreachable ${dead.length === 1 ? 'reference' : 'references'}: ${dead
          .map((attachment) => attachment.fileName || attachment.url)
          .slice(0, 2)
          .join(', ')}.`,
      });
    }
  });
  (courseModule.testPapers ?? []).forEach((id) => {
    if (!input.testPaperById.get(id)) {
      issues.push({ level: 'error', path, message: 'Links to a test paper that no longer exists.' });
    }
  });
};

/**
 * What a teacher should know before publishing, computed here from what is linked.
 *
 * Errors are what would leave a learner stuck: an empty day, a day still waiting on generated
 * content, a lesson whose references are dead. Warnings are quality: syllabus lines no day covers,
 * days far off the course's own median length, weeks whose lessons get easier.
 */
export const reviewCourse = (input: ICourseReviewInput): ICourseReview => {
  const issues: IAiIssue[] = [];
  const modules = [...input.modules].sort((a, b) => a.day - b.day);

  const pace: IDayPace[] = modules.map((courseModule) => ({
    day: courseModule.day,
    name: courseModule.name,
    minutes: dayMinutes(courseModule, input),
  }));
  const medianMins = median(pace.map((row) => row.minutes));

  let pendingCount = 0;
  modules.forEach((courseModule) => {
    pendingCount += checkModule(courseModule, input, medianMins, issues);
  });

  // The ladder: within a week, the hardest lesson of a day should not be easier than the day before.
  const weeks = [...new Set(modules.map((courseModule) => courseModule.week ?? 1))];
  weeks.forEach((week) => {
    let previous = -1;
    modules
      .filter((courseModule) => (courseModule.week ?? 1) === week)
      .forEach((courseModule) => {
        const ranks = (courseModule.materials ?? [])
          .map((id) => input.materialById.get(id)?.level)
          .filter((level): level is LevelType => !!level && level in LEVEL_RANK)
          .map((level) => LEVEL_RANK[level]);
        if (!ranks.length) return;
        const rank = Math.max(...ranks);
        if (rank < previous) {
          issues.push({
            level: 'warning',
            path: `D${courseModule.day}`,
            message: 'Easier than the day before it; a week should climb.',
          });
        }
        previous = rank;
      });
  });

  // Coverage: each syllabus line against the days' topics and linked lesson names.
  const coverage: ICoverageRow[] = (input.course.outline ?? []).map((line) => ({
    line,
    days: modules
      .filter((courseModule) =>
        mentions(line, [
          ...(courseModule.topics ?? []),
          ...(courseModule.materials ?? []).map((id) => input.materialById.get(id)?.name ?? ''),
          ...(courseModule.materials ?? []).map((id) => input.materialById.get(id)?.tag ?? ''),
        ]),
      )
      .map((courseModule) => courseModule.day),
  }));
  const uncovered = coverage.filter((row) => !row.days.length);
  if (uncovered.length) {
    issues.push({
      level: 'warning',
      path: 'outline',
      message: `${uncovered.length} syllabus ${uncovered.length === 1 ? 'line is' : 'lines are'} covered by no day: ${uncovered
        .slice(0, 3)
        .map((row) => row.line)
        .join('; ')}${uncovered.length > 3 ? '…' : ''}`,
    });
  }
  const seenTopics = new Map<string, number>();
  modules.forEach((courseModule) =>
    (courseModule.topics ?? []).forEach((topic) => {
      const key = norm(topic);
      const first = seenTopics.get(key);
      if (first && first !== courseModule.day) {
        issues.push({
          level: 'warning',
          path: `D${courseModule.day}`,
          message: `"${topic}" is also a topic of day ${first}.`,
        });
      } else seenTopics.set(key, courseModule.day);
    }),
  );
  if (!(input.course.attachments ?? []).length) {
    issues.push({ level: 'warning', path: 'course', message: 'No cover image.' });
  }
  if (!(input.course.description ?? '').trim()) {
    issues.push({ level: 'warning', path: 'course', message: 'No description.' });
  }

  return {
    issues,
    coverage,
    pace,
    medianMins,
    pendingCount,
    canPublish: !issues.some((issue) => issue.level === 'error'),
  };
};

// ------------------------------------------------------------------------------------------------
// The coherence review a model does from a digest
// ------------------------------------------------------------------------------------------------

/** A compact account of the course — no lesson bodies — small enough to review in one reply. */
export const buildCourseReviewPrompt = (input: ICourseReviewInput): string => {
  const modules = [...input.modules].sort((a, b) => a.day - b.day);
  const digest = {
    courseId: input.course._id,
    title: input.course.name,
    description: input.course.description,
    outcomes: input.course.outcomes,
    prerequisites: input.course.prerequisites,
    outline: input.course.outline,
    days: modules.map((courseModule) => ({
      ref: `D${courseModule.day}`,
      week: courseModule.week,
      name: courseModule.name,
      topics: courseModule.topics,
      lessons: (courseModule.materials ?? []).map((id) => {
        const material = input.materialById.get(id);
        return material
          ? { name: material.name, level: material.level, durationMins: material.durationMins, tag: material.tag }
          : { missing: id };
      }),
      quizzes: (courseModule.testPapers ?? []).map((id) => {
        const paper = input.testPaperById.get(id);
        return paper
          ? { name: paper.name, questions: paper.totalQuestions, durationMins: paper.durationMins }
          : { missing: id };
      }),
      sessions: (courseModule.meets ?? []).map((id) => input.meetById.get(id)?.title ?? id),
      stillToGenerate: (courseModule.pending ?? []).filter(
        (work) => work.status === 'pending' || work.status === 'prompted',
      ).length,
    })),
  };
  return `# Role

You are an external examiner reviewing a course design before it is published to students. You are exacting about sequence, coverage and load, and you say precisely what to change.

# Task

Review the course below and return your findings as one JSON document in the format under "Output". Return the JSON only. Do not rewrite the course.

# The course

\`\`\`json
${JSON.stringify(digest, null, 2)}
\`\`\`

# What to check

1. **Sequence**: does each day build on the ones before it? Is anything taught before what it depends on?
2. **Coverage**: is every outline line taught, and taught once? Is anything in the outline missing from the days, or in the days but not the outline?
3. **Load**: are days of similar length? Which days are too heavy or too thin for a student at this level?
4. **Assessment**: do the quizzes fall where they should — after the ideas they test, before the next block — and do they test what was taught?
5. **Outcomes**: does the course actually deliver each stated outcome? Which outcome has no day behind it?
6. **Clarity**: are the day names and the description ones a student and a parent would understand?

# Output

\`\`\`ts
interface Output {
  format: "${AI_COURSE_REVIEW_FORMAT}";
  courseId: "${input.course._id}";
  summary: string;                       // one or two sentences on the course as a whole
  generatedBy: string;                   // your model name
  findings: Array<{
    severity: "error" | "warning" | "info";   // error = a student would be stuck or misled
    where: string;                            // a day ref such as "D3", a week such as "W2", or "course"
    issue: string;                            // one sentence: what is wrong
    suggestion: string;                       // one sentence: what to change
  }>;
}
\`\`\`

Order the findings by severity, errors first. Ten to twenty findings is usual; fewer if the course is sound.`;
};

export interface IParsedCourseReview {
  review: IAiCourseReview | null;
  issues: IAiIssue[];
}

export const parseCourseReview = (text: string, courseId: string): IParsedCourseReview => {
  const { value, issue } = parseJsonObject(text);
  if (!value) return { review: null, issues: issue ? [issue] : [] };
  const issues: IAiIssue[] = [];
  if (value.format !== AI_COURSE_REVIEW_FORMAT) {
    issues.push({ level: 'error', path: 'format', message: `"format" must be "${AI_COURSE_REVIEW_FORMAT}".` });
  }
  if (value.courseId !== courseId) {
    issues.push({ level: 'error', path: 'courseId', message: 'This review is for a different course.' });
  }
  if (!Array.isArray(value.findings)) {
    issues.push({ level: 'error', path: 'findings', message: '"findings" must be an array.' });
    return { review: null, issues };
  }
  const findings = (value.findings as IAiReviewFinding[]).filter(
    (finding) => finding && typeof finding.issue === 'string',
  );
  return { review: issues.length ? null : { ...(value as unknown as IAiCourseReview), findings }, issues };
};
