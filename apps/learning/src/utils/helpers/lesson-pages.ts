import { type AttachmentDto, type MaterialDto } from '@repo/shared/contracts';
import { MAX_TOPIC_LEVEL, isVideoAttachment, splitRichTextIntoSections } from '@repo/shared/utils';
import { type ILessonPage } from '@interfaces';
import { LessonViewMode, StorageKey } from '../../enums';

const toAttachmentPage = (attachment: AttachmentDto): ILessonPage => ({
  kind: 'attachment',
  key: attachment.key,
  title: attachment.fileName,
  attachment,
});

type ILessonSource = Pick<MaterialDto, 'content' | 'attachments'>;

// Store rows are immutable and replaced on every patch, so the row itself is the cache key: six
// components read the pages of the lesson on screen, and the body is split once for all of them.
const pagesByMaterial = new WeakMap<ILessonSource, ILessonPage[]>();

/**
 * A lesson as the reader pages it: the body cut at its headings, then its videos, then every
 * other attachment. Videos come first because a lesson's "watch this" belongs with its reading,
 * not after its downloads.
 */
export const getLessonPages = (material: ILessonSource): ILessonPage[] => {
  const cached = pagesByMaterial.get(material);
  if (cached) return cached;
  const attachments = material.attachments ?? [];
  const pages: ILessonPage[] = [
    ...splitRichTextIntoSections(material.content ?? null, MAX_TOPIC_LEVEL).map((section): ILessonPage => ({
      kind: 'section',
      ...section,
    })),
    ...attachments.filter(isVideoAttachment).map(toAttachmentPage),
    ...attachments.filter((attachment) => !isVideoAttachment(attachment)).map(toAttachmentPage),
  ];
  pagesByMaterial.set(material, pages);
  return pages;
};

/** The page title as the pager shows it: "The ideas · Ohm's law", or the lesson's own name. */
export const getLessonPageTitle = (page: ILessonPage, lessonName: string): string => {
  const title = page.title || lessonName;
  return page.kind === 'section' && page.parentTitle ? `${page.parentTitle} · ${title}` : title;
};

const isLessonViewMode = (value: string | null): value is LessonViewMode =>
  value === LessonViewMode.READER || value === LessonViewMode.FULL;

/** The reader is the default: the whole point of it is that a long lesson is not read in one go. */
export const readLessonViewMode = (): LessonViewMode => {
  const stored = localStorage.getItem(StorageKey.LESSON_VIEW_MODE);
  return isLessonViewMode(stored) ? stored : LessonViewMode.READER;
};

export const writeLessonViewMode = (mode: LessonViewMode) => localStorage.setItem(StorageKey.LESSON_VIEW_MODE, mode);

/** Page keys a learner has opened, by material, by user — one browser may serve two learners. */
type ViewedLessonPages = Record<string, Record<string, string[]>>;

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null;

/** A record that cannot be read — cleared by hand, truncated, not an object — counts as empty. */
const readAllViewedLessonPages = (): ViewedLessonPages => {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(StorageKey.VIEWED_LESSON_PAGES) || '{}');
    return isRecord(parsed) ? (parsed as ViewedLessonPages) : {};
  } catch {
    return {};
  }
};

export const readViewedLessonPages = (userId: string): Record<string, string[]> => {
  const pages = readAllViewedLessonPages()[userId];
  return isRecord(pages) ? pages : {};
};

/**
 * Merges rather than replaces: another tab on the same account may have recorded pages since this
 * one read the record, and a page once opened is never un-opened, so the union is always right.
 */
export const writeViewedLessonPages = (userId: string, pages: Record<string, string[]>) => {
  const all = readAllViewedLessonPages();
  const stored = readViewedLessonPages(userId);
  const merged = { ...stored };
  Object.entries(pages).forEach(([materialId, keys]) => {
    merged[materialId] = [...new Set([...(stored[materialId] ?? []), ...keys])];
  });
  all[userId] = merged;
  localStorage.setItem(StorageKey.VIEWED_LESSON_PAGES, JSON.stringify(all));
};
