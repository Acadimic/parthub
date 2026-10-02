import { type AttachmentDto, type MaterialDto, type ILinkCheck } from '../contracts';
import {
  AI_STUDY_MATERIAL_FORMAT,
  type AiResourceKind,
  type IAiMaterial,
  type IAiResource,
  type IAiStudyMaterial,
} from '../interfaces';
import { richTextFromMarkdown } from '../utils';
import { DocumentType, FileExtension, LevelType, LinkType } from '../enums';
import { createObjectId } from '../utils/object-id.util';
import { checkMarkdownMath, type IAiIssue, parseJsonObject, repairIssue } from './common';
import { checkFigures } from './figures';
import { buildStudyMaterialPrompt } from './study-material-prompt';
import { type IAiMaterialContext, type IAiMaterialSetup } from './study-material-setup';

export { buildStudyMaterialPrompt };

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
  /** The module the lessons were planned for; a reply for another module is refused. */
  courseModule?: string;
  /** The refs a course plan asked for; a reply that misses or invents one is flagged. */
  expectedRefs?: string[];
}

const YOUTUBE_PATTERN = /^(https?:\/\/)(www\.|m\.)?(youtube\.com\/(watch\?v=|shorts\/|embed\/)|youtu\.be\/)[\w-]{11}/;
const RESOURCE_KINDS: AiResourceKind[] = ['video', 'article', 'pdf'];
const LEVEL_RANK: Record<LevelType, number> = { [LevelType.EASY]: 0, [LevelType.MEDIUM]: 1, [LevelType.HARD]: 2 };

// A regex rather than `new URL()`: this package compiles without the DOM lib, and all that matters
// here is the scheme and that there is something after it.
const isHttpUrl = (value: string): boolean => /^https?:\/\/[^\s/]+\S*$/i.test(value.trim());

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
  if (/<(?!br\s*\/?>)[a-z][^>]*>/i.test(content)) {
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
  if (target.courseModule && file.courseModule !== target.courseModule) {
    issues.push({
      level: 'error',
      path: 'courseModule',
      message: 'This reply was generated for a different course day.',
    });
  }
  if (target.expectedRefs?.length) {
    const got = new Set(file.materials.map((material) => material.ref));
    target.expectedRefs
      .filter((ref) => !got.has(ref))
      .forEach((ref) =>
        issues.push({ level: 'warning', path: ref, message: 'A planned lesson is missing from the reply.' }),
      );
    file.materials
      .filter((material) => !target.expectedRefs?.includes(material.ref))
      .forEach((material) =>
        issues.push({
          level: 'warning',
          path: material.ref,
          message: 'Not one of the planned lessons; it will import all the same.',
        }),
      );
  }
  checkFigures(
    file.figures,
    file.materials.map((material) => material.content ?? ''),
    issues,
  );
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
    key: createObjectId(),
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
  _id: createObjectId(),
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
      // A later part's figure replaces an earlier one with the same ref, as its lessons do.
      figures: [
        ...(existing.figures ?? []).filter((figure) => !(file.figures ?? []).some((next) => next.ref === figure.ref)),
        ...(file.figures ?? []),
      ],
    });
  });
  return [...byPair.values()];
};
