/**
 * What Tailwind cannot say: the A4 page box, its running footer, the named cover page and the
 * watermark. Rendered as a `<style>` by `PrintShell`, because the footer text changes with the
 * document and an `@page` margin box takes its content only from CSS.
 */

/** The embedded print face first (`print-font.css`): the system font would print as Type 3 shapes. */
export const PRINT_FONT =
  "'Inter Print', Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif";

const MARGIN_TEXT = `font: 600 7.5pt ${PRINT_FONT}; color: #8a8fa0;`;

/** A hairline over the footer, set on every box in the row so it runs the full width. */
const FOOTER_RULE = 'border-top: 0.6pt solid #e3e5ee; margin-top: 6mm; vertical-align: top; padding-top: 3mm;';

/** Past this a title would run into the page number, so it is cut at a word and given an ellipsis. */
const MAX_FOOTER_CHARS = 90;

const shorten = (value: string): string => {
  if (value.length <= MAX_FOOTER_CHARS) return value;
  const cut = value.slice(0, MAX_FOOTER_CHARS);
  const space = cut.lastIndexOf(' ');
  return `${space > 0 ? cut.slice(0, space) : cut}…`;
};

/** A CSS string literal: quotes and backslashes escaped, newlines flattened. */
const cssString = (value: string): string => `"${value.replace(/[\\"]/g, '\\$&').replace(/\s+/g, ' ')}"`;

export interface IPageText {
  /** The document's own name, bottom left of every page after the cover; the page number sits opposite. */
  footer: string;
}

/** No running header: the top margin is only the page's edge, and the footer carries the name. */
export const buildPrintCss = ({ footer }: IPageText): string => `
@page {
  size: A4;
  margin: 16mm 16mm 20mm;
  /* Empty, but present: with no box at the top, Chrome prints its own date and title there. */
  @top-center { content: ''; }
  @bottom-left { content: ${cssString(shorten(footer))}; ${MARGIN_TEXT} ${FOOTER_RULE} }
  @bottom-center { content: ''; ${FOOTER_RULE} }
  @bottom-right { content: 'Page ' counter(page) ' of ' counter(pages); ${MARGIN_TEXT} ${FOOTER_RULE} }
}
@page cover {
  margin: 0;
  @bottom-left { content: none; }
  @bottom-center { content: none; }
  @bottom-right { content: none; }
}
.print-watermark { display: none; }
/* The app's dark root is still an ancestor, so a figure's \`dark:invert\` matches; outranks it. */
[data-theme='light'] .print-exact img { filter: none !important; }
@media print {
  html, body { background: #fff; }
  .print-cover { page: cover; }
  .print-exact, .print-exact * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .print-watermark {
    display: flex; position: fixed; inset: 0; z-index: 50; pointer-events: none;
    align-items: center; justify-content: center;
  }
  .print-watermark span {
    transform: rotate(-30deg); font: 800 80pt/1 ${PRINT_FONT}; letter-spacing: .1em;
    color: #3b4fd0; opacity: .035; white-space: nowrap;
  }
}
`;
