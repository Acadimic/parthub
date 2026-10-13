import { RichTextFormat } from '../enums/rich-text.enum';
import type { IRichText, IRichTextNode } from '../interfaces/rich-text.interface';
import { docToPlainText } from './rich-text-plain.util';

/**
 * The deepest heading that opens a new section. `##` alone leaves an AI lesson's "The ideas" as
 * one long page; its `###` per topic is the size a learner reads in one sitting.
 */
export const MAX_TOPIC_LEVEL = 3;

/** One readable slice of a lesson: a heading and everything under it until the next heading. */
export interface IRichTextSection {
  /** `section-<index>`; stable while the document keeps the same heading structure. */
  key: string;
  /** The heading's text; '' for the content before the first heading. */
  title: string;
  /** The nearest enclosing heading, for "The ideas · Ohm's law"; '' when there is none. */
  parentTitle: string;
  /** 0 for the content before the first heading, else the heading's level. */
  level: number;
  /** The section as a complete value, heading included, so `RichTextView` renders it unchanged. */
  content: IRichText;
}

interface IDraftSection {
  title: string;
  level: number;
  nodes: IRichTextNode[];
}

const headingLevel = (node: IRichTextNode): number | null =>
  node.type === 'heading' ? Number(node.attrs?.level ?? 1) : null;

const toRichText = (nodes: IRichTextNode[]): IRichText => {
  const doc = { type: 'doc', content: nodes };
  return { format: RichTextFormat.DOC_V1, doc, text: docToPlainText(doc) };
};

/** The nodes a section shows besides its own heading; what decides whether it is worth a page. */
const bodyOf = (draft: IDraftSection): IRichTextNode[] => (draft.level === 0 ? draft.nodes : draft.nodes.slice(1));

/**
 * Cuts a document at every heading of `maxLevel` or shallower, in document order.
 *
 * Text before the first heading is an untitled section, and a lesson opening with `# Title` and
 * an introduction starts on that title, as it reads in full. A heading with nothing of its own
 * under it (`## The ideas` when every topic is a `###`) makes no section — the learner would land
 * on a blank page — but it still names the sections under it through `parentTitle`. A document
 * with no headings is one section; one with no readable text is none.
 */
export const splitRichTextIntoSections = (value: IRichText | null, maxLevel: number): IRichTextSection[] => {
  if (!value) return [];

  const drafts: IDraftSection[] = [];
  let current: IDraftSection = { title: '', level: 0, nodes: [] };
  for (const node of value.doc.content ?? []) {
    const level = headingLevel(node);
    if (level !== null && level <= maxLevel) {
      drafts.push(current);
      current = { title: docToPlainText(node), level, nodes: [node] };
    } else {
      current.nodes.push(node);
    }
  }
  drafts.push(current);

  const sections: IRichTextSection[] = [];
  // The open heading at each level; a new heading closes every deeper one. A level-1 heading is
  // the document's own title rather than a part the learner is inside, so it never opens one.
  const openTitles: string[] = [];
  for (const draft of drafts) {
    const parentTitle = openTitles.slice(0, draft.level).filter(Boolean).pop() ?? '';
    if (draft.level > 1) {
      openTitles.length = draft.level;
      openTitles[draft.level] = draft.title;
    }
    if (!docToPlainText({ type: 'doc', content: bodyOf(draft) }).trim()) continue;
    const content = toRichText(draft.nodes);
    sections.push({ key: `section-${sections.length}`, title: draft.title, parentTitle, level: draft.level, content });
  }
  return sections;
};
