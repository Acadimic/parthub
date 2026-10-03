import { type ChapterDto, type QuestionDto, type StandardDto, type SubjectDto } from '../contracts';
import {
  AI_TEST_PAPER_FORMAT,
  type DefaultMarkingType,
  type IAiQuestion,
  type IAiSection,
  type IAiTestPaper,
  type MarkingType,
} from '../interfaces';
import { richTextFromMarkdown } from '../utils';
import { LevelType, QuestionType } from '../enums';
import { createObjectId } from '../utils/object-id.util';
import { checkMarkdownMath, type IAiIssue, MARKDOWN_RULES, parseJsonObject, repairIssue } from './common';
import { checkFigures, FIGURE_RULES } from './figures';
import { checkPronunciation, pronunciationRules } from './pronunciation';

/** How many of each type a section should get. */
export type IQuestionCounts = Record<QuestionType, number>;

/** The share of easy, medium and hard questions, in percent, summing to 100. */
export interface IDifficultyMix {
  [LevelType.EASY]: number;
  [LevelType.MEDIUM]: number;
  [LevelType.HARD]: number;
}

/** One section of the paper the model is asked to fill. */
export interface IAiSectionPlan {
  /** A stable key for the row in the form; becomes the `ref` in the prompt. */
  key: string;
  /** The existing section the questions go into, or absent for one the import will create. */
  sectionId?: string;
  name: string;
  counts: IQuestionCounts;
  chapterIds: string[];
  /** Free text: topics or sub-topics to concentrate on. */
  topics: string;
  defaultMarkings?: DefaultMarkingType;
}

export interface IAiBlueprint {
  testPaperId: string;
  paperName: string;
  sections: IAiSectionPlan[];
  difficulty: IDifficultyMix;
  /** "CBSE Class 12 board", "JEE Main", "NEET" … or anything the teacher types. */
  examStyle: string;
  language: string;
  includeSolutions: boolean;
  instructions: string;
  /** The course module this paper is planned for; the reply echoes it so the import can link it. */
  courseModule?: string;
}

/** What the prompt and the validator both need to know about the workspace. */
export interface IAiContext {
  standards: StandardDto[];
  subjects: SubjectDto[];
  chapters: ChapterDto[];
}

export const EMPTY_COUNTS: IQuestionCounts = {
  [QuestionType.SINGLE_CHOICE]: 0,
  [QuestionType.MULTIPLE_CHOICE]: 0,
  [QuestionType.BOOLEAN]: 0,
  [QuestionType.INTEGER]: 0,
  [QuestionType.FILL_IN_THE_BLANK]: 0,
  [QuestionType.SUBJECTIVE]: 0,
};

export const DEFAULT_DIFFICULTY: IDifficultyMix = {
  [LevelType.EASY]: 30,
  [LevelType.MEDIUM]: 50,
  [LevelType.HARD]: 20,
};

export const EXAM_STYLES = [
  'CBSE board examination',
  'ICSE board examination',
  'State board examination',
  'JEE Main',
  'JEE Advanced',
  'NEET',
  'Olympiad',
  'Classroom quiz',
];

export const LANGUAGES = ['English', 'Hindi', 'Hinglish (Hindi in Latin script)'];

export const totalCount = (counts: IQuestionCounts): number =>
  Object.values(counts).reduce((sum, count) => sum + count, 0);

const CHOICE_TYPES = new Set<QuestionType>([
  QuestionType.SINGLE_CHOICE,
  QuestionType.MULTIPLE_CHOICE,
  QuestionType.BOOLEAN,
]);

/** Reads as a teacher would say it, so the model mirrors the vocabulary in its output. */
export const TYPE_GUIDANCE: Record<QuestionType, string> = {
  [QuestionType.SINGLE_CHOICE]: 'exactly four options, exactly one correct',
  [QuestionType.MULTIPLE_CHOICE]: 'exactly four options, two or three correct',
  [QuestionType.BOOLEAN]: 'a statement; options are exactly "True" and "False", one correct',
  [QuestionType.INTEGER]: 'the answer is a single integer (no options); put it in "answer"',
  [QuestionType.FILL_IN_THE_BLANK]: 'one blank written as ____; the answer is at most three words, in "answer"',
  [QuestionType.SUBJECTIVE]: 'a written answer; put a model answer of 3–8 sentences in "answer"',
};

const percent = (count: number, share: number) => Math.round((count * share) / 100);

const describeCounts = (counts: IQuestionCounts): string =>
  Object.entries(counts)
    .filter(([, count]) => count > 0)
    .map(([type, count]) => `${count} × ${type} (${TYPE_GUIDANCE[type as QuestionType]})`)
    .join('\n    - ');

const nameOf = (rows: { _id: string; name: string }[], id: string) => rows.find((row) => row._id === id)?.name ?? id;

/**
 * The prompt a teacher pastes into a model.
 *
 * Everything the workspace knows goes in as data — ids, names, sections, marks — so the model can
 * echo ids back rather than guess names, and the importer never has to match by text. The rules
 * are the ones the validator enforces, stated up front, so a first answer is usually a clean one.
 */
export const buildTestPaperPrompt = (blueprint: IAiBlueprint, context: IAiContext): string => {
  const standards = context.standards.map((standard) => ({ id: standard._id, name: standard.name }));
  const subjects = context.subjects.map((subject) => ({ id: subject._id, name: subject.name }));
  const chapterIds = new Set(blueprint.sections.flatMap((section) => section.chapterIds));
  const chapters = context.chapters
    .filter((chapter) => !chapterIds.size || chapterIds.has(chapter._id))
    .map((chapter) => ({
      id: chapter._id,
      name: chapter.name,
      standard: nameOf(context.standards, chapter.standard),
      subject: nameOf(context.subjects, chapter.subject),
    }));
  const total = blueprint.sections.reduce((sum, section) => sum + totalCount(section.counts), 0);
  const sectionsText = blueprint.sections
    .map((section, index) => {
      const count = totalCount(section.counts);
      const marks = section.defaultMarkings
        ? Object.entries(section.counts)
            .filter(([, n]) => n > 0)
            .map(
              ([type, n]) =>
                `${type}: +${section.defaultMarkings?.[type as QuestionType]?.correct ?? 0}/${section.defaultMarkings?.[type as QuestionType]?.incorrect ?? 0} × ${n}`,
            )
            .join(', ')
        : "the paper's defaults";
      const sectionChapters = section.chapterIds.length
        ? section.chapterIds.map((id) => `${nameOf(context.chapters, id)} (id ${id})`).join('; ')
        : 'any chapter from the list below';
      return `### Section ${index + 1} — ref "S${index + 1}"${section.sectionId ? ` (sectionId "${section.sectionId}")` : ' (new section)'}
- name: "${section.name}"
- questions: ${count}
    - ${describeCounts(section.counts) || 'none'}
- difficulty: ${percent(count, blueprint.difficulty.easy)} easy, ${percent(count, blueprint.difficulty.medium)} medium, ${count - percent(count, blueprint.difficulty.easy) - percent(count, blueprint.difficulty.medium)} hard
- chapters to cover: ${sectionChapters}
- marks: ${marks}${section.topics.trim() ? `\n- focus: ${section.topics.trim()}` : ''}`;
    })
    .join('\n\n');

  return `# Role

You are a senior question-paper setter for ${standards.map((s) => s.name).join(', ')} ${subjects.map((s) => s.name).join(', ')}, writing in the style of the ${blueprint.examStyle}. You write original, unambiguous, syllabus-accurate questions with airtight answer keys, and you return them as one JSON document that a system imports directly.

# Task

Write the questions for the test paper "${blueprint.paperName}" (${total} questions in total) according to the blueprint below, then return them in the exact JSON format in the "Output" section. Return the JSON only.

# Workspace data (use these ids verbatim)

\`\`\`json
${JSON.stringify(
  {
    testPaperId: blueprint.testPaperId,
    standards,
    subjects,
    chapters,
    questionTypes: Object.values(QuestionType),
    levels: Object.values(LevelType),
  },
  null,
  2,
)}
\`\`\`

# Blueprint

Language: ${blueprint.language}. Solutions: ${blueprint.includeSolutions ? 'a worked solution for every question' : 'not required (leave "solution" out)'}.

${sectionsText}
${blueprint.instructions.trim() ? `\n### Additional instructions from the teacher\n${blueprint.instructions.trim()}\n` : ''}
# Quality rules

1. Every question is answerable from the stated chapters at this level, with exactly the right information and no dependence on a figure or a previous question.
2. One question, one idea. No two questions test the same idea in the same way. Do not reuse textbook questions verbatim.
3. Difficulty is real, not cosmetic: easy = direct recall or one-step application; medium = two or three linked steps or a standard derivation; hard = an unfamiliar situation, a combination of concepts, or a trap that a common misconception falls into.
4. Vary the cognitive demand across a section: recall, understanding, application, analysis. Numerical, conceptual and reasoning questions should all appear where the subject allows.
5. Choice questions: distractors are plausible and each corresponds to a specific mistake; never "all of the above" or "none of the above"; options are of similar length and form; the correct option is not systematically the longest or in the same position.
6. Numerical answers carry units and sensible significant figures; integer-type answers must be exact integers; state given constants in the question when a value is needed.
7. Solutions are step-by-step, show the working, name the concept used, and end with the answer; for choice questions, say in one line why the key distractor is wrong.
8. Notation: SI units, standard symbols, LaTeX for every expression, \\ce{} for chemical formulae and equations.
9. "tag" is a 1–4 word snake_case topic such as "newtons_second_law"; "skills" lists 1–3 skills such as "unit_conversion" or "graph_reading"; "estimatedMinutes" is how long a well-prepared student needs.
10. Use only the standard, subject and chapter ids from the workspace data. Every question names its chapter id when chapters are given.

# Formatting rules for "body", "options[].body", "answer", "solution" and "instructions"

Markdown, restricted to:${MARKDOWN_RULES}

# Figures
${FIGURE_RULES}${pronunciationRules(context.standards.find((standard) => standard.locale)?.locale)}

# Output

Return exactly one JSON object and nothing else — no prose, no code fence. It must match this TypeScript type:

\`\`\`ts
interface Output {
  format: "${AI_TEST_PAPER_FORMAT}";
  testPaperId: string;          // the id above
  title: string;                // the paper's name
  generatedBy: string;          // your model name${
    blueprint.courseModule
      ? `
  courseModule: "${blueprint.courseModule}";  // copy verbatim`
      : ''
  }
  sections: Array<{
    ref: string;                // "S1", "S2" … as in the blueprint
    sectionId?: string;         // copy from the blueprint when given; omit for a new section
    name: string;
    instructions?: string;      // Markdown shown at the top of the section
    questions: Array<{
      ref: string;              // "S1-Q1", "S1-Q2" …
      questionType: ${Object.values(QuestionType)
        .map((type) => `"${type}"`)
        .join(' | ')};
      body: string;             // Markdown
      options?: Array<{ body: string; isCorrect: boolean }>;   // choice and boolean types only
      answer?: string;          // integer, fillInTheBlank and subjective types only
      solution?: string;        // Markdown
      marks?: { correct: number; incorrect: number; unattempted: number }; // omit to use the section's defaults
      level: ${Object.values(LevelType)
        .map((level) => `"${level}"`)
        .join(' | ')};
      tag: string;
      standard: string;         // id
      subject: string;          // id
      chapter?: string;         // id
      estimatedMinutes: number;
      skills: string[];
    }>;
  }>;
  figures?: Array<{             // pictures placed in the Markdown as ![alt](figure:<ref> "caption")
    ref: string;                //   "F1", "F2" …
    alt: string;
    caption?: string;
    svg: string;                //   one complete <svg> element, as described under "Figures"
  }>;
}
\`\`\`

# Example of one question (shape only — do not reuse its content)

\`\`\`json
{
  "ref": "S1-Q1",
  "questionType": "singleChoice",
  "body": "A ball is thrown vertically upwards with speed $u$. Taking $g = 10\\\\ \\\\text{m s}^{-2}$, the time to reach the highest point is:",
  "options": [
    { "body": "$\\\\dfrac{u}{10}$ s", "isCorrect": true },
    { "body": "$\\\\dfrac{u}{5}$ s", "isCorrect": false },
    { "body": "$\\\\dfrac{2u}{10}$ s", "isCorrect": false },
    { "body": "$10u$ s", "isCorrect": false }
  ],
  "solution": "At the highest point $v = 0$. From $v = u - gt$, $t = \\\\dfrac{u}{g} = \\\\dfrac{u}{10}$ s. Option B doubles the time, which is the total time of flight, not the time to the top.",
  "level": "easy",
  "tag": "vertical_projectile",
  "standard": "${standards[0]?.id ?? '<standard id>'}",
  "subject": "${subjects[0]?.id ?? '<subject id>'}",
  "chapter": "${chapters[0]?.id ?? '<chapter id>'}",
  "estimatedMinutes": 1,
  "skills": ["kinematic_equations"]
}
\`\`\`

# Before you answer, check

- The counts per section and per type match the blueprint exactly, and the difficulty split is as asked.
- Every "ref" is unique; every id comes from the workspace data.
- Every singleChoice has exactly one correct option; every multipleChoice has two or three; every boolean has exactly "True" and "False".
- Every backslash inside a JSON string is doubled, and the JSON parses.
- No question depends on a figure, and none repeats another.`;
};

// ------------------------------------------------------------------------------------------------
// Validation
// ------------------------------------------------------------------------------------------------

export interface IParsedAiPaper {
  paper: IAiTestPaper | null;
  issues: IAiIssue[];
}

/** Parses the reply and checks its shape; workspace checks come in `validateAiPaper`. */
export const parseAiPaper = (text: string): IParsedAiPaper => {
  const { value: raw, issue, repairs } = parseJsonObject(text);
  if (!raw) return { paper: null, issues: issue ? [issue] : [] };
  const issues: IAiIssue[] = repairIssue(repairs);
  if (raw.format !== AI_TEST_PAPER_FORMAT) {
    issues.push({ level: 'error', path: 'format', message: `"format" must be "${AI_TEST_PAPER_FORMAT}".` });
  }
  if (typeof raw.testPaperId !== 'string') {
    issues.push({ level: 'error', path: 'testPaperId', message: '"testPaperId" is missing.' });
  }
  if (!Array.isArray(raw.sections) || !raw.sections.length) {
    issues.push({ level: 'error', path: 'sections', message: '"sections" must be a non-empty array.' });
    return { paper: null, issues };
  }
  return { paper: raw as unknown as IAiTestPaper, issues };
};

export interface IValidationTarget {
  testPaperId: string;
  sectionIds: Set<string>;
  standardIds: Set<string>;
  subjectIds: Set<string>;
  chapters: ChapterDto[];
  /** The module the paper was planned for; a reply for another module is refused. */
  courseModule?: string;
}

const checkChoice = (question: IAiQuestion, path: string, issues: IAiIssue[]) => {
  const options = question.options ?? [];
  const correct = options.filter((option) => option.isCorrect).length;
  if (options.length < 2) {
    issues.push({ level: 'error', path, message: 'A choice question needs at least two options.' });
  }
  if (options.some((option) => !option.body?.trim())) {
    issues.push({ level: 'error', path, message: 'An option is empty.' });
  }
  if (question.questionType === QuestionType.SINGLE_CHOICE && correct !== 1) {
    issues.push({
      level: 'error',
      path,
      message: `A single-choice question needs exactly one correct option (found ${correct}).`,
    });
  }
  if (question.questionType === QuestionType.MULTIPLE_CHOICE && correct < 2) {
    issues.push({
      level: 'error',
      path,
      message: `A multiple-choice question needs at least two correct options (found ${correct}).`,
    });
  }
  if (question.questionType === QuestionType.BOOLEAN) {
    if (options.length !== 2) {
      issues.push({ level: 'error', path, message: 'A true/false question has exactly two options.' });
    }
    if (correct !== 1) {
      issues.push({ level: 'error', path, message: 'A true/false question needs exactly one correct option.' });
    }
  }
  if (options.some((option) => /\b(all|none) of the above\b/i.test(option.body ?? ''))) {
    issues.push({
      level: 'warning',
      path,
      message: 'Uses "all/none of the above", which the quality rules ask to avoid.',
    });
  }
};

const checkTyped = (question: IAiQuestion, path: string, issues: IAiIssue[]) => {
  if (!question.answer?.trim()) {
    issues.push({ level: 'error', path, message: 'A typed-answer question needs "answer".' });
    return;
  }
  if (question.questionType === QuestionType.INTEGER && !/^-?\d+$/.test(question.answer.trim().replace(/\$/g, ''))) {
    issues.push({ level: 'warning', path, message: `"${question.answer}" is not a plain integer.` });
  }
  if (question.questionType === QuestionType.FILL_IN_THE_BLANK && !question.body.includes('____')) {
    issues.push({ level: 'warning', path, message: 'A fill-in-the-blank body should show the blank as ____.' });
  }
};

/** The ids a question names must be this paper's — the prompt lists them, so a miss means the model invented one. */
const checkIds = (question: IAiQuestion, path: string, target: IValidationTarget, issues: IAiIssue[]) => {
  if (question.standard && !target.standardIds.has(question.standard)) {
    issues.push({ level: 'error', path: `${path}.standard`, message: "The standard id is not one of this paper's." });
  }
  if (question.subject && !target.subjectIds.has(question.subject)) {
    issues.push({ level: 'error', path: `${path}.subject`, message: "The subject id is not one of this paper's." });
  }
  if (question.chapter && !target.chapters.some((chapter) => chapter._id === question.chapter)) {
    issues.push({ level: 'error', path: `${path}.chapter`, message: 'The chapter id is not in the workspace.' });
  }
};

const checkMarks = (question: IAiQuestion, path: string, issues: IAiIssue[]) => {
  if (!question.marks) return;
  const values = [question.marks.correct, question.marks.incorrect, question.marks.unattempted];
  if (values.some((value) => typeof value !== 'number' || Number.isNaN(value))) {
    issues.push({
      level: 'error',
      path: `${path}.marks`,
      message: '"marks" needs numeric correct, incorrect and unattempted.',
    });
  }
};

const checkQuestion = (question: IAiQuestion, path: string, target: IValidationTarget, issues: IAiIssue[]) => {
  if (!Object.values(QuestionType).includes(question.questionType)) {
    issues.push({ level: 'error', path, message: `Unknown questionType "${String(question.questionType)}".` });
    return;
  }
  if (!question.body?.trim()) issues.push({ level: 'error', path, message: 'The question body is empty.' });
  const markdown = [question.body, question.solution, question.answer, ...(question.options ?? []).map((o) => o.body)]
    .filter(Boolean)
    .join('\n');
  checkMarkdownMath(markdown, path, issues);
  checkPronunciation(markdown, path, issues);
  if (!Object.values(LevelType).includes(question.level)) {
    issues.push({
      level: 'error',
      path: `${path}.level`,
      message: `"level" must be one of ${Object.values(LevelType).join(', ')}.`,
    });
  }
  if (!question.tag?.trim()) {
    issues.push({ level: 'warning', path: `${path}.tag`, message: 'No tag; the question will import without one.' });
  }
  checkIds(question, path, target, issues);
  checkMarks(question, path, issues);
  if (CHOICE_TYPES.has(question.questionType)) checkChoice(question, `${path}.options`, issues);
  else checkTyped(question, `${path}.answer`, issues);
};

/** Everything the shape check could not know: ids, refs, per-type rules, duplicates. */
export const validateAiPaper = (paper: IAiTestPaper, target: IValidationTarget): IAiIssue[] => {
  const issues: IAiIssue[] = [];
  if (paper.testPaperId !== target.testPaperId) {
    issues.push({
      level: 'error',
      path: 'testPaperId',
      message: 'This file was generated for a different test paper.',
    });
  }
  if (target.courseModule && paper.courseModule !== target.courseModule) {
    issues.push({
      level: 'error',
      path: 'courseModule',
      message: 'This reply was generated for a different course day.',
    });
  }
  const refs = new Set<string>();
  const bodies = new Set<string>();
  paper.sections.forEach((section, sectionIndex) => {
    const sectionPath = section.ref || `sections[${sectionIndex}]`;
    if (!section.name?.trim()) issues.push({ level: 'error', path: sectionPath, message: 'The section has no name.' });
    if (section.sectionId && !target.sectionIds.has(section.sectionId)) {
      issues.push({
        level: 'error',
        path: `${sectionPath}.sectionId`,
        message: 'The sectionId is not a section of this paper.',
      });
    }
    if (!Array.isArray(section.questions) || !section.questions.length) {
      issues.push({ level: 'error', path: sectionPath, message: 'The section has no questions.' });
      return;
    }
    section.questions.forEach((question, questionIndex) => {
      const path = question.ref || `${sectionPath}.questions[${questionIndex}]`;
      if (refs.has(path)) issues.push({ level: 'warning', path, message: 'Duplicate ref.' });
      refs.add(path);
      const key = (question.body ?? '').replace(/\s+/g, ' ').trim().toLowerCase();
      if (key && bodies.has(key)) issues.push({ level: 'warning', path, message: 'Same wording as another question.' });
      bodies.add(key);
      checkQuestion(question, path, target, issues);
    });
  });
  const markdown = paper.sections.flatMap((section) => [
    section.instructions ?? '',
    ...(section.questions ?? []).flatMap((question) => [
      question.body ?? '',
      question.solution ?? '',
      question.answer ?? '',
      ...(question.options ?? []).map((option) => option.body ?? ''),
    ]),
  ]);
  checkFigures(paper.figures, markdown, issues);
  return issues;
};

// ------------------------------------------------------------------------------------------------
// Import
// ------------------------------------------------------------------------------------------------

/** The rows an import will write, resolved against the paper's defaults. */
export interface IImportedQuestion {
  section: IAiSection;
  question: IAiQuestion;
  dto: Omit<QuestionDto, '_id' | 'order' | 'section'>;
}

interface IImportDefaults {
  standard: string;
  subject: string;
  markingsFor: (section: IAiSection, type: QuestionType) => MarkingType | undefined;
}

const toOptions = (question: IAiQuestion) =>
  CHOICE_TYPES.has(question.questionType)
    ? (question.options ?? []).map((option) => ({
        _id: createObjectId(),
        body: richTextFromMarkdown(option.body),
        isCorrect: Boolean(option.isCorrect),
      }))
    : // Typed answers live in a single correct option, which is how the editor stores them.
      [{ _id: createObjectId(), body: richTextFromMarkdown(question.answer ?? ''), isCorrect: true }];

const toSolution = (markdown?: string) => (markdown?.trim() ? { body: richTextFromMarkdown(markdown) } : undefined);

const toMarkings = (section: IAiSection, question: IAiQuestion, defaults: IImportDefaults) =>
  question.marks ? { ...question.marks, partiallyCorrect: 0 } : defaults.markingsFor(section, question.questionType);

/** One question as the editor stores it: Markdown turned into documents, defaults filled in. */
const toDto = (section: IAiSection, question: IAiQuestion, defaults: IImportDefaults): IImportedQuestion['dto'] => ({
  body: richTextFromMarkdown(question.body),
  options: toOptions(question),
  solution: toSolution(question.solution),
  questionType: question.questionType,
  markings: toMarkings(section, question, defaults),
  standard: question.standard ?? defaults.standard,
  subject: question.subject ?? defaults.subject,
  chapter: question.chapter,
  level: question.level,
  tag: question.tag?.trim() || undefined,
  year: new Date().getFullYear(),
});

/** The question rows as the editor stores them, in file order. */
export const toImportedQuestions = (paper: IAiTestPaper, defaults: IImportDefaults): IImportedQuestion[] =>
  paper.sections.flatMap((section) =>
    section.questions.map((question) => ({ section, question, dto: toDto(section, question, defaults) })),
  );
