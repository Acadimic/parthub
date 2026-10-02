/**
 * A picture an AI reply draws for its content: SVG source, placed in the Markdown as
 * `![alt](figure:<ref> "caption")`. The importer uploads it and swaps the ref for its address.
 */
export interface IAiFigure {
  ref: string;
  alt: string;
  caption?: string;
  svg: string;
}
