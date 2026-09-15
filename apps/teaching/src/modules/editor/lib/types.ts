/**
 * The ProseMirror document shape, as much of it as the serializer and the read-only renderer need.
 *
 * Deliberately local to this module rather than in `src/interfaces`: the format is still being
 * validated here, and the canonical home is `@repo/shared` once the node set is settled — see
 * `.claude/plans/CONTENT_EDITOR_AND_EQUATIONS.md` §8.1, where it becomes `IRichText.doc`.
 */
export interface IDocMark {
  type: string;
  attrs?: Record<string, unknown>;
}

export interface IDocNode {
  type: string;
  attrs?: Record<string, unknown>;
  content?: IDocNode[];
  marks?: IDocMark[];
  text?: string;
}

/** One insertable item in the equation palette. */
export interface IPaletteItem {
  label: string;
  /** LaTeX to insert. `#?` marks a placeholder box the author tabs between. */
  latex: string;
  /** Rendered in the palette button. Falls back to `latex` with placeholders filled in. */
  preview?: string;
}

export interface IPaletteGroup {
  name: string;
  items: IPaletteItem[];
}
