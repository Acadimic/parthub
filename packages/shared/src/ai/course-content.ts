import {
  type ChapterDto,
  type CourseDto,
  type CourseModuleDto,
  type MaterialDto,
  type StandardDto,
  type SubjectDto,
} from '../contracts';
import {
  AI_STUDY_MATERIAL_FORMAT,
  AI_TEST_PAPER_FORMAT,
  type IAiLessonSpec,
  type IAiPendingWork,
  type IAiTestSpec,
} from '../interfaces';
import { createObjectId } from '../utils/object-id.util';
import { DEFAULT_MARKINGS as APP_DEFAULT_MARKINGS } from './defaults';
import { type IAiIssue, hasErrors, parseJsonObject } from './common';
import {
  buildStudyMaterialPrompt,
  type IImportedMaterial,
  parseAiMaterials,
  toImportedMaterials,
  validateAiMaterials,
} from './study-material-generator';
import { DEFAULT_MATERIAL_SETUP, type IAiPlannedLesson } from './study-material-setup';
import {
  buildTestPaperPrompt,
  DEFAULT_DIFFICULTY,
  EXAM_STYLES,
  type IAiBlueprint,
  type IImportedQuestion,
  LANGUAGES,
  parseAiPaper,
  toImportedQuestions,
  validateAiPaper,
} from './test-paper-generator';
import { defaultCounts } from './test-paper-plan';

/** The workspace, as the prompts and the reply checks need it. */
export interface ICourseContentContext {
  course: CourseDto;
  modules: CourseModuleDto[];
  standards: StandardDto[];
  /** Every subject of the course's standards, or the course's chosen ones. */
  subjects: SubjectDto[];
  chapters: ChapterDto[];
  /** Saved lessons, for the `order` new ones take. */
  materials: MaterialDto[];
}

/** One module's planned lessons as a single study-material prompt. */
export interface ILessonPack {
  moduleId: string;
  title: string;
  prompt: string;
  standardId: string;
  subjectId: string;
  /** Planned ref → pending key, so an imported lesson settles the right item. */
  pendingKeyByRef: Record<string, string>;
  lessonCount: number;
}

/** One planned quiz as a test-paper prompt. Each quiz is its own paper, so one prompt each. */
export interface IQuizPack {
  moduleId: string;
  pendingKey: string;
  testPaperId: string;
  title: string;
  prompt: string;
  spec: IAiTestSpec;
  standardIds: string[];
  subjectIds: string[];
}

export interface ICoursePrompts {
  lessons: ILessonPack[];
  quizzes: IQuizPack[];
}

const isOpen = (work: IAiPendingWork) => work.status === 'pending' || work.status === 'prompted';

/**
 * The subject a module's lessons belong to: the chapter's when a planned lesson names one, else
 * the course's first subject, else the first subject of the standard. A material needs one.
 */
const subjectFor = (specs: IAiLessonSpec[], context: ICourseContentContext): string => {
  const chaptered = specs.map((spec) => spec.chapter).find(Boolean);
  const chapter = chaptered ? context.chapters.find((row) => row._id === chaptered) : undefined;
  return chapter?.subject ?? context.course.subjects?.[0] ?? context.subjects[0]?._id ?? '';
};

const lessonPackFor = (courseModule: CourseModuleDto, context: ICourseContentContext): ILessonPack | null => {
  const works = (courseModule.pending ?? []).filter((work) => work.kind === 'lesson' && isOpen(work));
  if (!works.length) return null;
  const specs = works.map((work) => work.spec as IAiLessonSpec);
  const standardId = context.course.standards?.[0] ?? context.standards[0]?._id ?? '';
  const subjectId = subjectFor(specs, context);
  const standard = context.standards.find((row) => row._id === standardId);
  const subject = context.subjects.find((row) => row._id === subjectId);
  if (!standard || !subject) return null;
  const planned: IAiPlannedLesson[] = works.map((work, index) => {
    const spec = work.spec as IAiLessonSpec;
    return {
      ref: `L${index + 1}`,
      name: spec.name,
      level: spec.level,
      topics: spec.topics ?? [],
      durationMins: spec.durationMins,
      chapter: spec.chapter,
    };
  });
  const chapterIds = [...new Set(planned.map((lesson) => lesson.chapter).filter((id): id is string => !!id))];
  const prompt = buildStudyMaterialPrompt(
    {
      ...DEFAULT_MATERIAL_SETUP,
      chapterIds,
      lessonCount: planned.length,
      includeExamPrep: false,
      lessons: planned,
      courseModule: { id: courseModule._id, name: courseModule.name, description: courseModule.description },
    },
    {
      standard,
      subject,
      chapters: context.chapters.filter((row) => row.standard === standardId && row.subject === subjectId),
    },
  );
  return {
    moduleId: courseModule._id,
    title: `Day ${courseModule.day} · ${courseModule.name}`,
    prompt,
    standardId,
    subjectId,
    pendingKeyByRef: Object.fromEntries(planned.map((lesson, index) => [lesson.ref, works[index].key])),
    lessonCount: planned.length,
  };
};

const quizPacksFor = (
  courseModule: CourseModuleDto,
  context: ICourseContentContext,
  testPaperIdFor: (pendingKey: string) => string,
): IQuizPack[] =>
  (courseModule.pending ?? [])
    .filter((work) => work.kind === 'test' && isOpen(work))
    .map((work) => {
      const spec = work.spec as IAiTestSpec;
      const testPaperId = testPaperIdFor(work.key);
      const standardIds = context.course.standards ?? [];
      const subjectIds = context.course.subjects?.length
        ? context.course.subjects
        : context.subjects.map((row) => row._id);
      const blueprint: IAiBlueprint = {
        testPaperId,
        paperName: spec.name,
        sections: [
          {
            key: 'S1',
            name: spec.name,
            counts: defaultCounts(spec.questionCount),
            chapterIds: spec.chapters ?? [],
            topics: (spec.topics ?? []).join(', '),
            defaultMarkings: APP_DEFAULT_MARKINGS,
          },
        ],
        difficulty: DEFAULT_DIFFICULTY,
        examStyle: EXAM_STYLES[0],
        language: LANGUAGES[0],
        includeSolutions: true,
        instructions: `This quiz closes the course day "${courseModule.name}"${courseModule.topics?.length ? ` (${courseModule.topics.join(', ')})` : ''}. It should take about ${spec.durationMins} minutes.`,
        courseModule: courseModule._id,
      };
      const prompt = buildTestPaperPrompt(blueprint, {
        standards: context.standards.filter((row) => standardIds.includes(row._id)),
        subjects: context.subjects.filter((row) => subjectIds.includes(row._id)),
        chapters: context.chapters.filter((row) => !spec.chapters?.length || spec.chapters.includes(row._id)),
      });
      return {
        moduleId: courseModule._id,
        pendingKey: work.key,
        testPaperId,
        title: `Day ${courseModule.day} · ${spec.name}`,
        prompt,
        spec,
        standardIds,
        subjectIds,
      };
    });

/**
 * Every prompt the course still needs: one per module for its lessons, one per quiz.
 *
 * `testPaperIdFor` must return the same id for the same pending key across calls: the id goes into
 * the prompt, the reply echoes it, and the import matches on it — so a prompt copied before an
 * unrelated import must still match after it.
 */
export const buildCoursePrompts = (
  context: ICourseContentContext,
  testPaperIdFor: (pendingKey: string) => string = () => createObjectId(),
): ICoursePrompts => {
  const ordered = [...context.modules].sort((a, b) => a.day - b.day);
  return {
    lessons: ordered
      .map((courseModule) => lessonPackFor(courseModule, context))
      .filter((pack): pack is ILessonPack => !!pack),
    quizzes: ordered.flatMap((courseModule) => quizPacksFor(courseModule, context, testPaperIdFor)),
  };
};

// ------------------------------------------------------------------------------------------------
// Replies
// ------------------------------------------------------------------------------------------------

export interface ILessonReply {
  kind: 'lessons';
  pack: ILessonPack;
  imported: IImportedMaterial[];
  issues: IAiIssue[];
}

export interface IQuizReply {
  kind: 'quiz';
  pack: IQuizPack;
  imported: IImportedQuestion[];
  issues: IAiIssue[];
}

export interface IUnknownReply {
  kind: 'unknown';
  issues: IAiIssue[];
}

export type IContentReply = ILessonReply | IQuizReply | IUnknownReply;

const nextOrder = (materials: MaterialDto[], standardId: string, subjectId: string): number =>
  materials
    .filter((material) => material.standard === standardId && material.subject === subjectId && !material.isNew)
    .reduce((max, material) => Math.max(max, material.order ?? 0), 0) + 1;

const readLessonReply = (text: string, prompts: ICoursePrompts, context: ICourseContentContext): IContentReply => {
  const parsed = parseAiMaterials(text);
  if (!parsed.file) return { kind: 'unknown', issues: parsed.issues };
  const pack = prompts.lessons.find((item) => item.moduleId === parsed.file?.courseModule);
  if (!pack) {
    return {
      kind: 'unknown',
      issues: [
        ...parsed.issues,
        {
          level: 'error',
          path: 'courseModule',
          message: 'This reply names no course day of this course that still needs lessons.',
        },
      ],
    };
  }
  const issues = [
    ...parsed.issues,
    ...validateAiMaterials(parsed.file, {
      standardId: pack.standardId,
      subjectId: pack.subjectId,
      chapterIds: new Set(context.chapters.map((chapter) => chapter._id)),
      expectsExamPrep: false,
      courseModule: pack.moduleId,
      expectedRefs: Object.keys(pack.pendingKeyByRef),
    }),
  ];
  const imported = hasErrors(issues)
    ? []
    : toImportedMaterials(parsed.file, {
        standard: pack.standardId,
        subject: pack.subjectId,
        startOrder: nextOrder(context.materials, pack.standardId, pack.subjectId),
        linkChecks: new Map(),
      });
  return { kind: 'lessons', pack, imported, issues };
};

const readQuizReply = (text: string, prompts: ICoursePrompts, context: ICourseContentContext): IContentReply => {
  const parsed = parseAiPaper(text);
  if (!parsed.paper) return { kind: 'unknown', issues: parsed.issues };
  const pack = prompts.quizzes.find((item) => item.testPaperId === parsed.paper?.testPaperId);
  if (!pack) {
    return {
      kind: 'unknown',
      issues: [
        ...parsed.issues,
        { level: 'error', path: 'testPaperId', message: 'This reply is not for a quiz this course still needs.' },
      ],
    };
  }
  const issues = [
    ...parsed.issues,
    ...validateAiPaper(parsed.paper, {
      testPaperId: pack.testPaperId,
      sectionIds: new Set<string>(),
      standardIds: new Set(pack.standardIds),
      subjectIds: new Set(pack.subjectIds),
      chapters: context.chapters,
      courseModule: pack.moduleId,
    }),
  ];
  const imported = hasErrors(issues)
    ? []
    : toImportedQuestions(parsed.paper, {
        standard: pack.standardIds[0] ?? '',
        subject: pack.subjectIds[0] ?? '',
        markingsFor: (_section, type) => APP_DEFAULT_MARKINGS[type],
      });
  return { kind: 'quiz', pack, imported, issues };
};

/** Reads one reply, whichever generator it came from, and matches it to the prompt it answers. */
export const readContentReply = (
  text: string,
  prompts: ICoursePrompts,
  context: ICourseContentContext,
): IContentReply => {
  const { value, issue } = parseJsonObject(text);
  if (!value) return { kind: 'unknown', issues: issue ? [issue] : [] };
  if (value.format === AI_STUDY_MATERIAL_FORMAT) return readLessonReply(text, prompts, context);
  if (value.format === AI_TEST_PAPER_FORMAT) return readQuizReply(text, prompts, context);
  return {
    kind: 'unknown',
    issues: [
      { level: 'error', path: 'format', message: `Not a lessons or test paper reply ("${String(value.format)}").` },
    ],
  };
};
