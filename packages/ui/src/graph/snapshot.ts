/** One axis label as it sits on screen, in CSS pixels from the canvas's top-left corner. */
export interface ILabelSnapshot {
  text: string;
  kind: 'title' | 'tick';
  x: number;
  y: number;
}

/** The theme colours a saved image is drawn in, read off the page so it matches what is on screen. */
export interface IGraphImageColours {
  background: string;
  foreground: string;
  muted: string;
}

/** What goes under the graph: the typeset equation when there is one, and a caption line. */
export interface IGraphImageFooter {
  equation: HTMLCanvasElement | null;
  caption: string;
}

/** Height of the caption line under the graph, in CSS pixels. */
const CAPTION_LINE = 44;
const PADDING = 16;
/** Space above and below the typeset equation, in CSS pixels. */
const EQUATION_GAP = 10;

/**
 * Draws the rendered graph, its axis labels, the typeset equation when there is one, and a caption
 * into one PNG.
 *
 * Call it in the same task as the render that filled `source`: WebGL clears its drawing buffer once
 * a frame is shown, so a copy taken later is blank. The copy happens before this returns; only the
 * PNG encoding is asynchronous.
 */
export const composeGraphImage = (
  source: HTMLCanvasElement,
  labels: ILabelSnapshot[],
  { equation, caption }: IGraphImageFooter,
  colours: IGraphImageColours,
): Promise<Blob | null> => {
  // The canvas is drawn at the device's pixel ratio; the labels are in CSS pixels.
  const scale = source.width / (source.clientWidth || source.width);
  const maxEquationWidth = source.width - 2 * PADDING * scale;
  // A long equation is shrunk to the image's width, never cut.
  const equationScale = equation ? Math.min(1, maxEquationWidth / equation.width) : 0;
  const equationHeight = equation ? Math.round(equation.height * equationScale) : 0;
  const equationBand = equation ? equationHeight + Math.round(EQUATION_GAP * scale) : 0;
  // Under an equation the caption is a short detail line, so it needs less room.
  const captionLine = Math.round((equation ? CAPTION_LINE - 12 : CAPTION_LINE) * scale);
  const band = equationBand + captionLine;
  const canvas = document.createElement('canvas');
  canvas.width = source.width;
  canvas.height = source.height + band;
  const context = canvas.getContext('2d');
  if (!context) return Promise.resolve(null);

  // The 3D canvas is transparent, so it needs the page's background behind it.
  context.fillStyle = colours.background;
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.drawImage(source, 0, 0);

  context.textAlign = 'center';
  context.textBaseline = 'middle';
  // On screen a label past the edge is clipped; here it would land in the caption band instead.
  const visible = labels.filter(
    (label) => label.x >= 0 && label.y >= 0 && label.x * scale <= source.width && label.y * scale <= source.height,
  );
  visible.forEach((label) => {
    const isTitle = label.kind === 'title';
    context.font = isTitle
      ? `italic 600 ${14 * scale}px Georgia, 'Times New Roman', serif`
      : `${11 * scale}px ui-monospace, 'SF Mono', Menlo, Consolas, monospace`;
    context.fillStyle = isTitle ? colours.foreground : colours.muted;
    context.fillText(label.text, label.x * scale, label.y * scale);
  });

  context.globalAlpha = 0.35;
  context.fillStyle = colours.muted;
  context.fillRect(0, source.height, canvas.width, Math.max(1, Math.round(scale)));
  context.globalAlpha = 1;
  if (equation) {
    const top = source.height + Math.round(EQUATION_GAP * scale);
    context.drawImage(equation, PADDING * scale, top, equation.width * equationScale, equationHeight);
  }
  context.textAlign = 'left';
  context.font = `${(equation ? 12 : 13) * scale}px ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif`;
  // Under a typeset equation the caption is the detail line, so it steps back to the muted colour.
  context.fillStyle = equation ? colours.muted : colours.foreground;
  const captionY = source.height + equationBand + Math.round(captionLine / 2);
  // `maxWidth` narrows a long caption to fit rather than letting it run off the edge.
  context.fillText(caption, PADDING * scale, captionY, maxEquationWidth);

  return new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
};

/** Hands a file to the browser's download, as if the reader had clicked a link to it. */
export const saveBlob = (blob: Blob, fileName: string): void => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  // Revoked after the click has been handled; revoking at once can cancel the download.
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
};
