/**
 * Storage format of an `IRichText` value.
 *
 * Readers branch on it, so it is bumped only when a stored document needs migrating — not when
 * the editor gains a node type, which the ProseMirror schema absorbs on its own.
 */
export enum RichTextFormat {
  DOC_V1 = 'doc/v1',
}
