import { AI_STUDY_MATERIAL_FORMAT, type AiResourceKind } from '../interfaces';
import { LevelType } from '../enums';
import { MARKDOWN_RULES } from './common';
import { GRAPH_RULES } from './graphs';
import { FIGURE_RULES } from './figures';
import { pronunciationRules } from './pronunciation';
import {
  type IAiMaterialContext,
  type IAiMaterialSetup,
  levelLadder,
  MATERIAL_DEFAULTS,
  resourceKinds,
} from './study-material-setup';

const LEVEL_MEANING: Record<LevelType, string> = {
  [LevelType.EASY]: 'first meeting with the ideas: intuition, everyday examples, definitions, one-step reasoning',
  [LevelType.MEDIUM]: 'the standard treatment: derivations, multi-step worked examples, connections between ideas',
  [LevelType.HARD]: 'mastery: unfamiliar situations, combined concepts, misconception traps, exam-style reasoning',
};

const researchSection = (
  setup: IAiMaterialSetup,
  context: IAiMaterialContext,
  kinds: AiResourceKind[],
  isWholeSubject: boolean,
): string =>
  kinds.length
    ? `# Research (do this before writing)

Search the web before you write, in this order:
1. The official syllabus for ${context.subject.name} in ${context.standard.name} under the ${setup.examStyle} — the board's or council's own document where one exists — so the set of topics is the real one, in the official order${isWholeSubject ? ', and nothing on the syllabus is left out' : ''}.
2. The prescribed textbook (NCERT or the board's equivalent) and one or two university-level open texts (OpenStax, LibreTexts, MIT OpenCourseWare) to check every definition, law, formula and value.
3. Reliable teaching sites and channels for the explanations and resources below.
Use what you find to make the lessons accurate and current. Attach to every lesson the resources a student should actually open:
${kinds.includes('video') ? '- 2 to 3 videos, YouTube preferred (a full watch address such as https://www.youtube.com/watch?v=… — never a channel, playlist or search page).\n' : ''}${kinds.includes('article') ? "- 2 to 3 articles or interactive pages: NCERT, Khan Academy, OpenStax, LibreTexts, BYJU'S, Physics Classroom, university open courseware, encyclopaedias.\n" : ''}${kinds.includes('pdf') ? '- 1 to 2 PDFs: textbook chapters, lecture notes, worksheets or past papers whose address ends in .pdf or is served as a PDF.\n' : ''}
Rules for every resource:
1. Only addresses that exist today and that you have actually seen. Never construct, guess or "typical" a URL. If unsure, leave it out — a missing link is fine, an invented one is not.
2. Free to open, no login or paywall. Prefer stable, authoritative publishers.
3. "kind" is exactly one of ${kinds.map((kind) => `"${kind}"`).join(', ')}. "source" names the publisher. "note" says in one line what it adds and where in the lesson it belongs.
4. The system checks every address and drops the unreachable ones, so a lesson should still stand without its resources.
`
    : '# Research\n\nSearch the web before writing: the official syllabus first, then the prescribed textbook and an open university text, so the lessons are accurate, complete and current. Do not include resource links.\n';

const continuationSection = (lessonCount: number): string =>
  lessonCount > MATERIAL_DEFAULTS.partThreshold
    ? `
# If the reply would be too long

Return as many complete lessons as fit, in ladder order, and set "part" to { "index": 1, "total": N } with your best estimate of N. When asked to "continue", return the next lessons in the same JSON shape — same "format", "standard", "subject", "title" and "outline", "part" advanced by one, refs continuing where you stopped. Never cut a lesson in half, and never repeat one.
`
    : '';

const moduleClause = (setup: IAiMaterialSetup): string => {
  if (!setup.courseModule) return '';
  const detail = setup.courseModule.description ? ` (${setup.courseModule.description})` : '';
  return ` for the course day "${setup.courseModule.name}"${detail}`;
};

const taskClause = (isPlanned: boolean, lessonCount: number, moduleText: string, scope: string): string =>
  isPlanned
    ? `exactly the ${lessonCount} study ${lessonCount === 1 ? 'lesson' : 'lessons'} listed under "The ladder"${moduleText}, on ${scope}`
    : `a graded set of ${lessonCount} study lessons on ${scope}, from easy to hard`;

const coverageClause = (isPlanned: boolean, scope: string): string =>
  isPlanned
    ? 'Together the lessons cover exactly the topics listed for them, in that order, with no repetition between them: each builds on the one before and names what it assumes. Write the "outline" as those topics in teaching order.'
    : `Together the lessons must cover every key term and topic of ${scope} with no gaps and no repetition: each lesson builds on the previous one and names what it assumes. Order the topics as the official syllabus does. First write the "outline": one line per topic of ${scope}, in teaching order; then map every outline line to at least one lesson.`;

const instructionsSection = (instructions: string): string =>
  instructions.trim() ? `\n### Additional instructions from the teacher\n${instructions.trim()}\n` : '';

const courseModuleField = (setup: IAiMaterialSetup): string =>
  setup.courseModule ? `\n  courseModule: "${setup.courseModule.id}";  // copy verbatim` : '';

const countChecklist = (
  isPlanned: boolean,
  lessonCount: number,
  includeExamPrep: boolean,
  setup: IAiMaterialSetup,
): string => {
  const order = isPlanned ? 'with the refs and names listed' : 'in the level order given';
  const exam = includeExamPrep ? ', then one of kind "examPrep"' : '';
  const moduleNote = setup.courseModule ? ` "courseModule" is "${setup.courseModule.id}".` : '';
  return `Exactly ${lessonCount} items of kind "lesson" ${order}${exam}; every "ref" unique.${moduleNote}`;
};

const examPrepSection = (includeExamPrep: boolean, examStyle: string): string => {
  if (!includeExamPrep) return '';
  return `
# The exam-preparation sheet (the last item, kind "examPrep")

Name it "Exam preparation: <scope>". Its "content" has, in order:
- **## Key terms A–Z** — every key term from every lesson, alphabetised, one-line definitions.
- **## Important concepts** — the ten to twenty ideas an examiner tests most, each in three to five lines with the lesson (M-ref) that teaches it.
- **## Important notes** — every "Important notes" point from every lesson, merged and de-duplicated, grouped by topic.
- **## Formula sheet** — a pipe table: formula (LaTeX), what each symbol means, when to use it.
- **## Typical questions and how to approach them** — the recurring question patterns for the ${examStyle} and a method for each.
- **## Traps and misconceptions** — the mistakes that cost marks.
- **## Last-day revision checklist** — a tick list of twelve to twenty items.
Its "keyTerms" is the complete A–Z list. Its "topics" lists every topic in the set. Its resources are the two or three best overall revision resources.
`;
};

/**
 * The prompt a teacher pastes into a model.
 *
 * The ids go in as data so the model echoes them back; the ladder of levels and the shape of each
 * lesson are spelled out so the set reads as one course rather than five unrelated essays; and the
 * research rules ask for real, checked addresses because the importer will look every one up.
 */
export const buildStudyMaterialPrompt = (setup: IAiMaterialSetup, context: IAiMaterialContext): string => {
  const chapters = context.chapters
    .filter((chapter) => !setup.chapterIds.length || setup.chapterIds.includes(chapter._id))
    .map((chapter) => ({ id: chapter._id, name: chapter.name }));
  const scope = setup.chapterIds.length
    ? `the ${chapters.length === 1 ? 'chapter' : 'chapters'} ${chapters.map((chapter) => `"${chapter.name}"`).join(', ')}`
    : `the whole ${context.subject.name} syllabus for ${context.standard.name}`;
  const planned = setup.lessons ?? [];
  const isPlanned = planned.length > 0;
  const lessonCount = isPlanned ? planned.length : setup.lessonCount;
  const includeExamPrep = isPlanned ? false : setup.includeExamPrep;
  const ladder = levelLadder(lessonCount);
  const kinds = resourceKinds(setup);
  const lessonsText = isPlanned
    ? planned
        .map(
          (lesson) =>
            `- ${lesson.ref}: "${lesson.name}" — level "${lesson.level}" (${LEVEL_MEANING[lesson.level]}); topics: ${lesson.topics.join(', ')}; about ${lesson.durationMins} minutes${lesson.chapter ? `; chapter id ${lesson.chapter}` : ''}. Use exactly this ref and name.`,
        )
        .join('\n')
    : ladder
        .map(
          (level, index) =>
            `- M${index + 1}: level "${level}" — ${LEVEL_MEANING[level]}${index === 0 ? '. Start from what a student already knows.' : ''}${index === ladder.length - 1 ? ' Finish the ladder: a student who has read all lessons should be exam-ready.' : ''}`,
        )
        .join('\n');
  const moduleText = moduleClause(setup);
  const isWholeSubject = !setup.chapterIds.length;
  const resourceRules = researchSection(setup, context, kinds, isWholeSubject);
  const continuation = continuationSection(lessonCount);

  return `# Role

You are a senior curriculum author and subject expert in ${context.subject.name} for ${context.standard.name}, writing for students preparing for the ${setup.examStyle}. You explain like the best teacher a student ever had — concrete before abstract, one idea at a time, always saying why — and you return your work as one JSON document that a system imports directly.

# Task

Write ${taskClause(isPlanned, lessonCount, moduleText, scope)}, ${includeExamPrep ? 'closed by one exam-preparation sheet, ' : ''}in ${setup.language}. Return them in the exact JSON format in the "Output" section, and return the JSON only.

# Workspace data (use these ids verbatim)

\`\`\`json
${JSON.stringify(
  {
    standard: { id: context.standard._id, name: context.standard.name },
    subject: { id: context.subject._id, name: context.subject.name },
    chapters,
    levels: Object.values(LevelType),
  },
  null,
  2,
)}
\`\`\`

# The ladder

${lessonsText}
${includeExamPrep ? `- M${lessonCount + 1}: kind "examPrep", level "hard" — the exam-preparation sheet described below.` : ''}

${coverageClause(isPlanned, scope)} When chapters are given, set each lesson's "chapter" to the id of the chapter it mainly covers.

# What every lesson contains, in this order (as Markdown in "content")

1. **# Title** — then one short paragraph on what the lesson is for and what the student will be able to do afterwards.
2. **## Before you start** — the two to four ideas assumed, each in one line, with the lesson (M-ref) where it was taught when it is in this set.
3. **## The ideas** — the core teaching. Sub-headings (###) per topic. Each topic: a plain-language definition, the intuition or a real-life picture, then the formal statement, law or formula with every symbol named and its unit. Build up gradually; never introduce two new ideas in one sentence.
4. **## Worked examples** — two to four, fully worked, each labelled with the idea it exercises; at least one numerical and one conceptual where the subject allows. Show units at every step.
5. **## Where this shows up** — real-life applications and connections to other chapters.
6. **## Common mistakes** — the misconceptions students really have, each with why it is wrong and the correct thinking.
7. **## Check yourself** — four to six short questions of rising difficulty with answers in a separate "**Answers**" list.
8. **## Important notes** — the must-remember facts, exam tips, sign conventions, units, special cases and "examiners look for" points for this lesson, as a blockquote list. This is what a student re-reads the night before.
9. **## Key terms** — every term introduced in this lesson, as "**term** — one-sentence definition". The same list goes in "keyTerms".
10. **## Summary** — five to eight bullet points a student could revise from.

Depth follows the level: easy lessons use everyday language and short steps; hard lessons use exam-style reasoning and combine ideas. Formulas in LaTeX, always. Aim for 900 to 1600 words per lesson.
${examPrepSection(includeExamPrep, setup.examStyle)}
${resourceRules}${continuation}
# Quality rules

1. Accurate for the ${setup.examStyle} syllabus at ${context.standard.name}; SI units, standard symbols and terminology. State constants where a value is used.
2. Say why, not just what. Every rule comes with its reason or its derivation at the appropriate level.
3. Original prose. Do not copy passages from any source; cite by linking in the resources instead.
4. "tag" is a 1–4 word snake_case topic such as "newtons_second_law". "durationMins" is how long a student needs to work through the lesson properly, typically 25 to 60.
5. "topics" lists the lesson's topics in order, three to eight short phrases.
${instructionsSection(setup.instructions)}
# Formatting rules for "content"

Markdown, restricted to:${MARKDOWN_RULES}

# Figures
${FIGURE_RULES}

# 3D graphs
${GRAPH_RULES}${pronunciationRules(context.standard.locale)}

# Output

Return exactly one JSON object and nothing else — no prose, no code fence. It must match this TypeScript type:

\`\`\`ts
interface Output {
  format: "${AI_STUDY_MATERIAL_FORMAT}";
  standard: string;             // the id above
  subject: string;              // the id above
  title: string;                // the set's name, e.g. "Laws of Motion — graded lessons"
  generatedBy: string;          // your model name
  outline: string[];            // one line per topic of the scope, in teaching order
  part?: { index: number; total: number };   // only when the reply is split, see above${courseModuleField(setup)}
  materials: Array<{
    ref: string;                // "M1", "M2" … in ladder order
    kind: "lesson" | "examPrep";
    name: string;               // the lesson title
    level: ${Object.values(LevelType)
      .map((level) => `"${level}"`)
      .join(' | ')};
    tag: string;
    durationMins: number;
    chapter?: string;           // id from the workspace data, when chapters are given
    topics: string[];
    content: string;            // Markdown, as described above
    keyTerms: Array<{ term: string; definition: string }>;
    resources: Array<{
      kind: ${kinds.length ? kinds.map((kind) => `"${kind}"`).join(' | ') : '"video" | "article" | "pdf"'};
      title: string;
      url: string;
      source: string;
      note: string;
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

# Example of one resource and one key term (shape only — do not reuse the content)

\`\`\`json
{ "kind": "video", "title": "Newton's first law", "url": "https://www.youtube.com/watch?v=XXXXXXXXXXX", "source": "Khan Academy", "note": "Watch before 'The ideas' for the intuition behind inertia." }
{ "term": "inertia", "definition": "The tendency of a body to keep its state of rest or uniform motion unless a net external force acts on it." }
\`\`\`

# Before you answer, check

- ${countChecklist(isPlanned, lessonCount, includeExamPrep, setup)}
- Every lesson has all ten sections in order, and its "Key terms" section matches "keyTerms"; every "outline" line is taught by some lesson.
- No topic of ${scope} is missing; no two lessons teach the same thing.
- Every resource address is real, public and one you have seen; every id comes from the workspace data.
- Every backslash inside a JSON string is doubled, newlines are \\n, and the JSON parses.`;
};
