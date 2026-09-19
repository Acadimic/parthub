import { type AttachmentDto, type ChapterDto, type MaterialDto, type ILinkCheck } from '@repo/shared/contracts';
import {
  AI_STUDY_MATERIAL_FORMAT,
  type AiResourceKind,
  type IAiMaterial,
  type IAiResource,
  type IAiStudyMaterial,
} from '@repo/shared/interfaces';
import { richTextFromMarkdown } from '@repo/shared/utils';
import { DocumentType, FileExtension, LevelType, LinkType } from '@enums';
import { getObjectId } from '@utils/helpers';
import { checkMarkdownMath, type IAiIssue, MARKDOWN_RULES, parseJsonObject, repairIssue } from './common';
import { EXAM_STYLES, LANGUAGES } from './test-paper-generator';

export { EXAM_STYLES, LANGUAGES };

/** What the teacher decides; everything else the prompt settles. */
export interface IAiMaterialSetup {
  /** Empty means the whole subject. */
  chapterIds: string[];
  lessonCount: number;
  examStyle: string;
  language: string;
  includeVideos: boolean;
  includeArticles: boolean;
  includePdfs: boolean;
  includeExamPrep: boolean;
  instructions: string;
}

export interface IAiMaterialContext {
  standard: { _id: string; name: string };
  subject: { _id: string; name: string };
  chapters: ChapterDto[];
}

export const MATERIAL_DEFAULTS = {
  lessonCount: 5,
  minLessons: 2,
  maxLessons: 20,
  /** A whole subject needs more rungs on the ladder than a chapter. */
  wholeSubjectLessons: 10,
  /** Above this many lessons the model is told it may answer in parts. */
  partThreshold: 8,
} as const;

export const DEFAULT_MATERIAL_SETUP: IAiMaterialSetup = {
  chapterIds: [],
  lessonCount: MATERIAL_DEFAULTS.lessonCount,
  examStyle: EXAM_STYLES[0],
  language: LANGUAGES[0],
  includeVideos: true,
  includeArticles: true,
  includePdfs: true,
  includeExamPrep: true,
  instructions: '',
};

/** Roughly two-fifths easy, two-fifths medium, the rest hard — a ladder, never a cliff. */
export const levelLadder = (count: number): LevelType[] => {
  const easy = Math.max(1, Math.round(count * 0.4));
  const medium = Math.max(count > 2 ? 1 : 0, Math.round(count * 0.4));
  const hard = Math.max(0, count - easy - medium);
  return [
    ...Array<LevelType>(easy).fill(LevelType.EASY),
    ...Array<LevelType>(medium).fill(LevelType.MEDIUM),
    ...Array<LevelType>(hard).fill(LevelType.HARD),
  ].slice(0, count);
};

const LEVEL_MEANING: Record<LevelType, string> = {
  [LevelType.EASY]: 'first meeting with the ideas: intuition, everyday examples, definitions, one-step reasoning',
  [LevelType.MEDIUM]: 'the standard treatment: derivations, multi-step worked examples, connections between ideas',
  [LevelType.HARD]: 'mastery: unfamiliar situations, combined concepts, misconception traps, exam-style reasoning',
};

const resourceKinds = (setup: IAiMaterialSetup): AiResourceKind[] =>
  [setup.includeVideos && 'video', setup.includeArticles && 'article', setup.includePdfs && 'pdf'].filter(
    (kind): kind is AiResourceKind => !!kind,
  );

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
  const ladder = levelLadder(setup.lessonCount);
  const kinds = resourceKinds(setup);
  const lessonsText = ladder
    .map(
      (level, index) =>
        `- M${index + 1}: level "${level}" — ${LEVEL_MEANING[level]}${index === 0 ? '. Start from what a student already knows.' : ''}${index === ladder.length - 1 ? ' Finish the ladder: a student who has read all lessons should be exam-ready.' : ''}`,
    )
    .join('\n');
  const isWholeSubject = !setup.chapterIds.length;
  const resourceRules = kinds.length
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
  const continuation =
    setup.lessonCount > MATERIAL_DEFAULTS.partThreshold
      ? `
# If the reply would be too long

Return as many complete lessons as fit, in ladder order, and set "part" to { "index": 1, "total": N } with your best estimate of N. When asked to "continue", return the next lessons in the same JSON shape — same "format", "standard", "subject", "title" and "outline", "part" advanced by one, refs continuing where you stopped. Never cut a lesson in half, and never repeat one.
`
      : '';

  return `# Role

You are a senior curriculum author and subject expert in ${context.subject.name} for ${context.standard.name}, writing for students preparing for the ${setup.examStyle}. You explain like the best teacher a student ever had — concrete before abstract, one idea at a time, always saying why — and you return your work as one JSON document that a system imports directly.

# Task

Write a graded set of ${setup.lessonCount} study lessons on ${scope}, from easy to hard, ${setup.includeExamPrep ? 'closed by one exam-preparation sheet, ' : ''}in ${setup.language}. Return them in the exact JSON format in the "Output" section, and return the JSON only.

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
${setup.includeExamPrep ? `- M${setup.lessonCount + 1}: kind "examPrep", level "hard" — the exam-preparation sheet described below.` : ''}

Together the lessons must cover every key term and topic of ${scope} with no gaps and no repetition: each lesson builds on the previous one and names what it assumes. Order the topics as the official syllabus does. First write the "outline": one line per topic of ${scope}, in teaching order; then map every outline line to at least one lesson. When chapters are given, set each lesson's "chapter" to the id of the chapter it mainly covers.

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
${
  setup.includeExamPrep
    ? `
# The exam-preparation sheet (the last item, kind "examPrep")

Name it "Exam preparation: <scope>". Its "content" has, in order:
- **## Key terms A–Z** — every key term from every lesson, alphabetised, one-line definitions.
- **## Important concepts** — the ten to twenty ideas an examiner tests most, each in three to five lines with the lesson (M-ref) that teaches it.
- **## Important notes** — every "Important notes" point from every lesson, merged and de-duplicated, grouped by topic.
- **## Formula sheet** — a pipe table: formula (LaTeX), what each symbol means, when to use it.
- **## Typical questions and how to approach them** — the recurring question patterns for the ${setup.examStyle} and a method for each.
- **## Traps and misconceptions** — the mistakes that cost marks.
- **## Last-day revision checklist** — a tick list of twelve to twenty items.
Its "keyTerms" is the complete A–Z list. Its "topics" lists every topic in the set. Its resources are the two or three best overall revision resources.
`
    : ''
}
${resourceRules}${continuation}
# Quality rules

1. Accurate for the ${setup.examStyle} syllabus at ${context.standard.name}; SI units, standard symbols and terminology. State constants where a value is used.
2. Say why, not just what. Every rule comes with its reason or its derivation at the appropriate level.
3. Original prose. Do not copy passages from any source; cite by linking in the resources instead.
4. "tag" is a 1–4 word snake_case topic such as "newtons_second_law". "durationMins" is how long a student needs to work through the lesson properly, typically 25 to 60.
5. "topics" lists the lesson's topics in order, three to eight short phrases.
${setup.instructions.trim() ? `\n### Additional instructions from the teacher\n${setup.instructions.trim()}\n` : ''}
# Formatting rules for "content"

Markdown, restricted to:${MARKDOWN_RULES}

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
  part?: { index: number; total: number };   // only when the reply is split, see above
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
}
\`\`\`

# Example of one resource and one key term (shape only — do not reuse the content)

\`\`\`json
{ "kind": "video", "title": "Newton's first law", "url": "https://www.youtube.com/watch?v=XXXXXXXXXXX", "source": "Khan Academy", "note": "Watch before 'The ideas' for the intuition behind inertia." }
{ "term": "inertia", "definition": "The tendency of a body to keep its state of rest or uniform motion unless a net external force acts on it." }
\`\`\`

# Before you answer, check

- Exactly ${setup.lessonCount} items of kind "lesson" in the level order given${setup.includeExamPrep ? ', then one of kind "examPrep"' : ''}; every "ref" unique.
- Every lesson has all ten sections in order, and its "Key terms" section matches "keyTerms"; every "outline" line is taught by some lesson.
- No topic of ${scope} is missing; no two lessons teach the same thing.
- Every resource address is real, public and one you have seen; every id comes from the workspace data.
- Every backslash inside a JSON string is doubled, newlines are \\n, and the JSON parses.`;
};

// ------------------------------------------------------------------------------------------------
// Validation
// ------------------------------------------------------------------------------------------------

export interface IParsedAiMaterials {
  file: IAiStudyMaterial | null;
  issues: IAiIssue[];
}

/** Parses the reply and checks its shape; workspace checks come in `validateAiMaterials`. */
export const parseAiMaterials = (text: string): IParsedAiMaterials => {
  const { value: raw, issue, repairs } = parseJsonObject(text);
  if (!raw) return { file: null, issues: issue ? [issue] : [] };
  const issues: IAiIssue[] = repairIssue(repairs);
  if (raw.format !== AI_STUDY_MATERIAL_FORMAT) {
    issues.push({ level: 'error', path: 'format', message: `"format" must be "${AI_STUDY_MATERIAL_FORMAT}".` });
  }
  if (!Array.isArray(raw.materials) || !raw.materials.length) {
    issues.push({ level: 'error', path: 'materials', message: '"materials" must be a non-empty array.' });
    return { file: null, issues };
  }
  return { file: raw as unknown as IAiStudyMaterial, issues };
};

export interface IMaterialValidationTarget {
  standardId: string;
  subjectId: string;
  chapterIds: Set<string>;
  expectsExamPrep: boolean;
}

const YOUTUBE_PATTERN = /^(https?:\/\/)(www\.|m\.)?(youtube\.com\/(watch\?v=|shorts\/|embed\/)|youtu\.be\/)[\w-]{11}/;
const RESOURCE_KINDS: AiResourceKind[] = ['video', 'article', 'pdf'];
const LEVEL_RANK: Record<LevelType, number> = { [LevelType.EASY]: 0, [LevelType.MEDIUM]: 1, [LevelType.HARD]: 2 };

const isHttpUrl = (value: string): boolean => {
  try {
    return ['http:', 'https:'].includes(new URL(value).protocol);
  } catch {
    return false;
  }
};

const checkResources = (material: IAiMaterial, path: string, issues: IAiIssue[]) => {
  (material.resources ?? []).forEach((resource, index) => {
    const at = `${path}.resources[${index}]`;
    if (!RESOURCE_KINDS.includes(resource.kind)) {
      issues.push({ level: 'error', path: at, message: `Unknown resource kind "${String(resource.kind)}".` });
    }
    if (!resource.title?.trim()) issues.push({ level: 'warning', path: at, message: 'The resource has no title.' });
    if (!resource.url || !isHttpUrl(resource.url)) {
      issues.push({ level: 'error', path: at, message: 'The resource address is not an http(s) URL.' });
      return;
    }
    if (resource.kind === 'video' && !YOUTUBE_PATTERN.test(resource.url)) {
      issues.push({
        level: 'warning',
        path: at,
        message: 'Not a YouTube watch address; it will import as a plain video link.',
      });
    }
    if (/youtube\.com\/(results|playlist|channel|@|c\/|user\/)/.test(resource.url)) {
      issues.push({ level: 'error', path: at, message: 'A search, playlist or channel page, not a video.' });
    }
  });
};

const checkContent = (material: IAiMaterial, path: string, issues: IAiIssue[]) => {
  const content = material.content ?? '';
  if (!content.trim()) {
    issues.push({ level: 'error', path: `${path}.content`, message: 'The content is empty.' });
    return;
  }
  const words = content.split(/\s+/).length;
  if (material.kind === 'lesson' && words < 400) {
    issues.push({
      level: 'warning',
      path: `${path}.content`,
      message: `Only about ${words} words; a lesson was asked to be 900 or more.`,
    });
  }
  if (!/^##\s/m.test(content)) {
    issues.push({
      level: 'warning',
      path: `${path}.content`,
      message: 'No "##" sections; the lesson structure was not followed.',
    });
  }
  if (material.kind === 'lesson' && !/^##\s+key terms/im.test(content)) {
    issues.push({ level: 'warning', path: `${path}.content`, message: 'No "Key terms" section.' });
  }
  if (material.kind === 'lesson' && !/^##\s+important notes/im.test(content)) {
    issues.push({ level: 'warning', path: `${path}.content`, message: 'No "Important notes" section.' });
  }
  if (/<[a-z][^>]*>/i.test(content)) {
    issues.push({ level: 'warning', path: `${path}.content`, message: 'Contains HTML tags, which the editor drops.' });
  }
  checkMarkdownMath(content, `${path}.content`, issues);
};

const checkMaterial = (material: IAiMaterial, path: string, target: IMaterialValidationTarget, issues: IAiIssue[]) => {
  if (!['lesson', 'examPrep'].includes(material.kind)) {
    issues.push({ level: 'error', path, message: `Unknown kind "${String(material.kind)}".` });
  }
  if (!material.name?.trim()) issues.push({ level: 'error', path, message: 'The lesson has no name.' });
  if (!Object.values(LevelType).includes(material.level)) {
    issues.push({
      level: 'error',
      path: `${path}.level`,
      message: `"level" must be one of ${Object.values(LevelType).join(', ')}.`,
    });
  }
  if (!material.tag?.trim()) {
    issues.push({ level: 'warning', path: `${path}.tag`, message: 'No tag; it will import without one.' });
  }
  if (typeof material.durationMins !== 'number' || material.durationMins <= 0) {
    issues.push({ level: 'warning', path: `${path}.durationMins`, message: 'No duration; 30 minutes will be used.' });
  }
  if (material.chapter && !target.chapterIds.has(material.chapter)) {
    issues.push({ level: 'error', path: `${path}.chapter`, message: "The chapter id is not one of this subject's." });
  }
  if (material.kind === 'lesson' && !(material.keyTerms ?? []).length) {
    issues.push({ level: 'warning', path: `${path}.keyTerms`, message: 'No key terms listed.' });
  }
  checkContent(material, path, issues);
  checkResources(material, path, issues);
};

/** Everything the shape check could not know: ids, the ladder, per-lesson rules, resources. */
export const validateAiMaterials = (file: IAiStudyMaterial, target: IMaterialValidationTarget): IAiIssue[] => {
  const issues: IAiIssue[] = [];
  if (file.standard !== target.standardId) {
    issues.push({ level: 'error', path: 'standard', message: 'This file was generated for a different standard.' });
  }
  if (file.subject !== target.subjectId) {
    issues.push({ level: 'error', path: 'subject', message: 'This file was generated for a different subject.' });
  }
  const refs = new Set<string>();
  let previousRank = -1;
  file.materials.forEach((material, index) => {
    const path = material.ref || `materials[${index}]`;
    if (refs.has(path)) issues.push({ level: 'warning', path, message: 'Duplicate ref.' });
    refs.add(path);
    checkMaterial(material, path, target, issues);
    const rank = LEVEL_RANK[material.level] ?? 0;
    if (material.kind === 'lesson' && rank < previousRank) {
      issues.push({
        level: 'warning',
        path: `${path}.level`,
        message: 'Easier than the lesson before it; the set should climb from easy to hard.',
      });
    }
    if (material.kind === 'lesson') previousRank = rank;
  });
  const examPreps = file.materials.filter((material) => material.kind === 'examPrep');
  if (target.expectsExamPrep && !examPreps.length) {
    issues.push({
      level: 'warning',
      path: 'materials',
      message: 'No exam-preparation sheet, though one was asked for.',
    });
  }
  if (examPreps.length > 1) {
    issues.push({ level: 'warning', path: 'materials', message: 'More than one exam-preparation sheet.' });
  }
  if (examPreps.length === 1 && file.materials[file.materials.length - 1].kind !== 'examPrep') {
    issues.push({
      level: 'warning',
      path: 'materials',
      message: 'The exam-preparation sheet is not last; it will import in file order.',
    });
  }
  return issues;
};

// ------------------------------------------------------------------------------------------------
// Import
// ------------------------------------------------------------------------------------------------

export interface IImportedMaterial {
  material: IAiMaterial;
  dto: MaterialDto;
  /** Resources kept as attachments and written into the content's references. */
  resources: IAiResource[];
  /** Resources the link check found unreachable; not imported. */
  dropped: IAiResource[];
}

interface IImportDefaults {
  standard: string;
  subject: string;
  /** The `order` the first imported lesson takes; the rest follow. */
  startOrder: number;
  /** By address; a resource with no entry is kept, one marked not ok is dropped. */
  linkChecks: Map<string, ILinkCheck>;
}

const DEFAULT_DURATION_MINS = 30;

/** All the addresses a file cites, once each, for the link check. */
export const resourceUrls = (file: IAiStudyMaterial): string[] => [
  ...new Set(file.materials.flatMap((material) => (material.resources ?? []).map((resource) => resource.url))),
];

const KIND_HEADING: Record<AiResourceKind, string> = { video: 'Videos', article: 'Reading', pdf: 'PDFs to download' };

/** A "References" section for the end of the content, so the links survive in the editable text too. */
const referencesMarkdown = (resources: IAiResource[]): string => {
  if (!resources.length) return '';
  const groups = RESOURCE_KINDS.map((kind) => ({
    kind,
    items: resources.filter((resource) => resource.kind === kind),
  })).filter((group) => group.items.length);
  return `\n\n## References and further learning\n\n${groups
    .map(
      (group) =>
        `### ${KIND_HEADING[group.kind]}\n\n${group.items
          .map((resource) => {
            const source = resource.source?.trim() ? ` (${resource.source.trim()})` : '';
            const note = resource.note?.trim() ? ` — ${resource.note.trim()}` : '';
            return `- [${resource.title?.trim() || resource.url}](${resource.url})${source}${note}`;
          })
          .join('\n')}`,
    )
    .join('\n\n')}`;
};

const linkTypeOf = (resource: IAiResource, check?: ILinkCheck): LinkType => {
  if (resource.kind === 'video') return YOUTUBE_PATTERN.test(resource.url) ? LinkType.YOUTUBE : LinkType.VIDEO;
  if (check?.contentType?.includes('pdf') || /\.pdf($|[?#])/i.test(resource.url)) return LinkType.EXTERNAL;
  return LinkType.EXTERNAL;
};

/** A cited resource as a link attachment: videos embed in the learning app, PDFs get the PDF icon. */
export const resourceToAttachment = (resource: IAiResource, check?: ILinkCheck): AttachmentDto => {
  const isPdf = resource.kind === 'pdf' || !!check?.contentType?.includes('pdf');
  return {
    key: getObjectId(),
    fileName: resource.title?.trim() || resource.url,
    url: resource.url,
    documentType: DocumentType.LINK,
    fileType: check?.contentType ?? DocumentType.LINK,
    fileExtension: isPdf ? FileExtension.PDF : FileExtension.OTHER,
    linkType: linkTypeOf(resource, check),
    reference: resource.source?.trim() || undefined,
    tag: resource.kind,
    isUploaded: false,
  };
};

const toDto = (
  material: IAiMaterial,
  index: number,
  resources: IAiResource[],
  defaults: IImportDefaults,
): MaterialDto => ({
  _id: getObjectId(),
  name: material.name.trim(),
  slug: '',
  standard: defaults.standard,
  subject: defaults.subject,
  chapter: material.chapter || undefined,
  order: defaults.startOrder + index,
  durationMins: material.durationMins > 0 ? Math.round(material.durationMins) : DEFAULT_DURATION_MINS,
  level: material.level,
  tag: material.tag?.trim() || (material.kind === 'examPrep' ? 'exam_preparation' : ''),
  type: material.kind === 'examPrep' ? 'Exam prep' : undefined,
  content: richTextFromMarkdown(`${material.content.trim()}${referencesMarkdown(resources)}`),
  attachments: resources.map((resource) => resourceToAttachment(resource, defaults.linkChecks.get(resource.url))),
});

/** The rows an import writes, in file order, with unreachable resources left out. */
export const toImportedMaterials = (file: IAiStudyMaterial, defaults: IImportDefaults): IImportedMaterial[] =>
  file.materials.map((material, index) => {
    const all = (material.resources ?? []).filter((resource) => resource.url && isHttpUrl(resource.url));
    const dropped = all.filter((resource) => defaults.linkChecks.get(resource.url)?.ok === false);
    const resources = all.filter((resource) => !dropped.includes(resource));
    return { material, dto: toDto(material, index, resources, defaults), resources, dropped };
  });

// ------------------------------------------------------------------------------------------------
// Whole standard: one prompt per subject, several replies merged
// ------------------------------------------------------------------------------------------------

/** One subject's prompt in a whole-standard pack. */
export interface IAiPromptPack {
  standardId: string;
  subjectId: string;
  standardName: string;
  subjectName: string;
  /** "Class 10 · Physics", for the list and the downloaded file's name. */
  title: string;
  prompt: string;
}

/** A whole-subject prompt for each standard-and-subject pair, in the order given. */
export const buildSubjectPromptPack = (
  setup: Omit<IAiMaterialSetup, 'chapterIds'>,
  contexts: IAiMaterialContext[],
): IAiPromptPack[] =>
  contexts.map((context) => ({
    standardId: context.standard._id,
    subjectId: context.subject._id,
    standardName: context.standard.name,
    subjectName: context.subject.name,
    title: `${context.standard.name} · ${context.subject.name}`,
    prompt: buildStudyMaterialPrompt({ ...setup, chapterIds: [] }, context),
  }));

export const pairKey = (standardId: string, subjectId: string) => `${standardId}:${subjectId}`;

/**
 * Replies grouped by standard and subject, parts merged.
 *
 * A model asked for a whole subject may answer in parts, and a teacher may paste each part as it
 * arrives; every part carries the same ids, so they fold into one file per subject. A later part
 * with a ref already seen replaces the earlier lesson, which is what "regenerate M3" should do.
 */
export const mergeAiMaterialFiles = (files: IAiStudyMaterial[]): IAiStudyMaterial[] => {
  const byPair = new Map<string, IAiStudyMaterial>();
  files.forEach((file) => {
    const key = pairKey(file.standard, file.subject);
    const existing = byPair.get(key);
    if (!existing) {
      byPair.set(key, { ...file, materials: [...file.materials] });
      return;
    }
    const materials = [...existing.materials];
    file.materials.forEach((material) => {
      const index = materials.findIndex((row) => row.ref && row.ref === material.ref);
      if (index >= 0) materials[index] = material;
      else materials.push(material);
    });
    byPair.set(key, {
      ...existing,
      outline: existing.outline?.length ? existing.outline : file.outline,
      title: existing.title ?? file.title,
      materials,
    });
  });
  return [...byPair.values()];
};
