import { AI_STUDY_MATERIAL_FORMAT, type AiResourceKind } from '../interfaces';
import { LevelType } from '../enums';
import { MARKDOWN_RULES } from './common';
import { GRAPH_RULES } from './graphs';
import { SCENE_RULES } from './scenes';
import { FIGURE_RULES } from './figures';
import { pronunciationRules } from './pronunciation';
import { ACTIVITY_RULES } from './activities';
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
- **## Key points** — every "Key points" bullet from every lesson, merged and de-duplicated, grouped by topic.
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

# What every lesson contains (as Markdown in "content"): learn, then play

A lesson alternates a few ideas, each explained, with practice that uses exactly those ideas, again and again until every idea of the lesson is covered, and closes with the key points of all of them. Nothing is answered in a list at the end: every question carries its answer inside its block.

1. **# Title** — then one or two lines on what the student will be able to do afterwards, and the ideas it assumes (with the M-ref where they were taught, when it is in this set).
2. **One "##" topic per idea**, each one screen: about 30–150 words of prose, or one block or picture with a few lines. A topic opens with a **::: concept** block that teaches the idea: a plain-language definition, the intuition or a real-life picture, then the formal statement, law or formula with every symbol named and its unit, two to four examples, and one common mistake as "**Watch out:** …". A concept's title is given only when the heading does not already name the idea.
3. **Practice straight after each concept**, using exactly that idea: a **::: check** or **::: reveal** for questions (rising difficulty across the lesson), **::: steps** for a worked example built one step at a time (two to four worked examples per lesson, at least one numerical and one conceptual where the subject allows, units at every step), and a **::: picture** or figure where a picture is clearer than words. Never more than two concepts in a row without practice between them.
4. **Applications** belong in the concept or in a question ("where this shows up"), not in a section of their own.
5. **## Key points** — near the end, one **::: concept title="Key points"** holding one bullet per idea of the lesson: the rule in a few words and one example. Every concept of the lesson appears there. This is what a student re-reads the night before.
6. **## Remember** — last, one **::: cards** block with every term introduced in the lesson as "- term :: one-sentence definition". The same terms go in "keyTerms".

There are no separate "Check yourself", "Answers", "Important notes", "Key terms" or "Summary" sections: the blocks above replace them.

Depth follows the level: easy lessons use everyday language and short steps; hard lessons use exam-style reasoning and combine ideas. Formulas in LaTeX, always. A lesson is as long as its ideas need, usually 900 to 2000 words; coverage comes before brevity, but prose that does not teach is cut.
${examPrepSection(includeExamPrep, setup.examStyle)}
${resourceRules}${continuation}
# Quality rules

1. Accurate for the ${setup.examStyle} syllabus at ${context.standard.name}; SI units, standard symbols and terminology. State constants where a value is used.
2. Say why, not just what. Every rule comes with its reason or its derivation at the appropriate level.
3. Original prose. Do not copy passages from any source; cite by linking in the resources instead.
4. "tag" is a 1–4 word snake_case topic such as "newtons_second_law". "durationMins" is how long a student needs to work through the lesson properly, typically 25 to 60.
5. "topics" lists the lesson's topics in order, three to eight short phrases.
6. No false "always" or "never": where a rule has exceptions, say "usually" and give the counter-example. Teach a form or law by the rule that really governs it, checked against the textbook rather than remembered.
7. Show what is clearer seen than read: a figure, a labelled picture, a 3D graph or scene, a table. A picture, its caption and any question that uses it state the same numbers, names and positions; a map is drawn from an authoritative boundary, never freehand.
8. A question has exactly the answers that are right: an option marked wrong must really be wrong (not another valid form, unit or method).
${instructionsSection(setup.instructions)}
# Formatting rules for "content"

Markdown, restricted to:${MARKDOWN_RULES}

# Interactive blocks
${ACTIVITY_RULES}

# Figures
${FIGURE_RULES}

# 3D graphs
${GRAPH_RULES}

# 3D scenes
${SCENE_RULES}${pronunciationRules(context.standard.locale)}

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
- Every lesson is learn, then play: each idea in a ::: concept followed by practice, never more than two concepts in a row, a closing "Key points" concept naming every idea, and a ::: cards block matching "keyTerms"; every "outline" line is taught by some lesson.
- Every ::: block is closed with ":::", every ::: check has at least one [x], and no option marked wrong is also correct.
- No topic of ${scope} is missing; no two lessons teach the same thing.
- Every resource address is real, public and one you have seen; every id comes from the workspace data.
- Every backslash inside a JSON string is doubled, newlines are \\n, and the JSON parses.`;
};
