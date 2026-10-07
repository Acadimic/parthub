import { renderLatex } from '../content/MathRender';

/** Size the equation is typeset at in a saved image, in CSS pixels. */
const EQUATION_FONT_SIZE = 20;

/**
 * Typesets `latex` with KaTeX, exactly as the page shows it, and draws it onto a canvas for a saved
 * image. Null when it cannot: a canvas draws only plain text, so the equation goes through the
 * page's own HTML and fonts, which `html-to-image` copies into a picture. That library is loaded
 * here, on the first download, never on page load.
 */
export const renderEquationImage = async (
  latex: string,
  colour: string,
  pixelRatio: number,
): Promise<HTMLCanvasElement | null> => {
  const { html, error } = renderLatex(latex, true);
  if (error || !html) return null;
  const { toCanvas } = await import('html-to-image');
  const node = document.createElement('div');
  node.dir = 'ltr';
  // Measured out of sight; the copy that is drawn is put back in place through `style` below.
  node.style.cssText = `position:fixed;left:-10000px;top:0;display:inline-block;padding:0 4px;font-size:${EQUATION_FONT_SIZE}px`;
  node.style.color = colour;
  // KaTeX's own output for the LaTeX, rendered with `trust: false` (see `renderLatex`), the same
  // markup `MathRender` puts on the page: no authored HTML reaches it.
  node.innerHTML = html;
  document.body.appendChild(node);
  try {
    return await toCanvas(node, { pixelRatio, style: { position: 'static', left: '0', top: '0' } });
  } catch {
    return null;
  } finally {
    node.remove();
  }
};
