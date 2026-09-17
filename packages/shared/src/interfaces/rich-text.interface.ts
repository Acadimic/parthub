import { type RichTextFormat } from '../enums/rich-text.enum';

/**
 * A ProseMirror attribute value.
 *
 * Every attribute the editor declares is a primitive — `latex` on the two equation nodes, `level`
 * on a heading, `start` on an ordered list. Keeping the type primitive is therefore accurate today
 * and is what lets the document be typed at all; a node needing structured attributes should nest
 * a child node instead, which is how ProseMirror expects composition to work.
 */
export type RichTextAttrValue = string | number | boolean | null;

/** A mark applied to a run of text — bold, italic, code, link. */
export interface IRichTextMark {
  type: string;
  attrs?: Record<string, RichTextAttrValue>;
}

/**
 * One node of a ProseMirror document.
 *
 * `type` stays a plain `string` on purpose. The set of node names belongs to the editor's schema,
 * and restating it here as a union would be a second declaration of the same thing, drifting the
 * moment a node is added. The *envelope* — which fields a node has, and how they nest — is stable
 * across every ProseMirror schema, so it is typed exactly, and the structural check against the
 * real schema happens once on the server via `Schema.nodeFromJSON()`.
 */
export interface IRichTextNode {
  type: string;
  attrs?: Record<string, RichTextAttrValue>;
  content?: IRichTextNode[];
  marks?: IRichTextMark[];
  /** Present only on text nodes, which in turn never have `content`. */
  text?: string;
}

/** The document root. Always `type: 'doc'`. */
export interface IRichTextDoc extends IRichTextNode {
  content: IRichTextNode[];
}

/** Authored content: the canonical document, plus the projection everything else reads. */
export interface IRichText {
  format: RichTextFormat;
  /** ProseMirror/Tiptap document JSON. Canonical. */
  doc: IRichTextDoc;
  /**
   * Plain-text projection of `doc`, equations reduced to their LaTeX. Denormalised on every write.
   * This is what search, sort, list previews and CSV export read — never walk `doc` for those.
   */
  text: string;
}
