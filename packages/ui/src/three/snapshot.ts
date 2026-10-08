/** One axis label as it sits on screen, in CSS pixels from the canvas's top-left corner. */
export interface ILabelSnapshot {
  text: string;
  /** An axis title, an axis tick, or a note such as a scene object's label. */
  kind: 'title' | 'tick' | 'note';
  x: number;
  y: number;
}

/** The theme colours a saved image is drawn in, read off the page so it matches what is on screen. */
export interface IImageColours {
  background: string;
  foreground: string;
  muted: string;
}

/** What goes under the view: a graph's typeset equation when there is one, and a caption line. */
export interface IImageFooter {
  equation: HTMLCanvasElement | null;
  caption: string;
  /** The Acadimic mark for the bottom-right corner, or null to leave it out. */
  mark: HTMLImageElement | null;
}

/** How one frame is drawn: what goes under the view, in which colours, at which size. */
export interface IFrameOptions {
  footer: IImageFooter;
  colours: IImageColours;
  /** Output pixels per CSS pixel of the on-screen view: the device pixel ratio for a PNG, less for a GIF. */
  scale: number;
  /** Multiplier for text sizes, kept at a readable size when `scale` shrinks the view. */
  textScale: number;
}

/** Height of the caption line under the view, in CSS pixels. */
const CAPTION_LINE = 44;
const PADDING = 16;
/** Space above and below the typeset equation, in CSS pixels. */
const EQUATION_GAP = 10;
/** Side of the Acadimic mark in the footer's bottom-right corner, in CSS pixels. */
const MARK_SIZE = 26;

/**
 * Draws the rendered graph or scene, its labels, a graph's typeset equation when there is one, and a caption
 * onto a new canvas — one PNG, or one frame of a GIF.
 *
 * Call it in the same task as the render that filled `source`: WebGL clears its drawing buffer once
 * a frame is shown, so a copy taken later is blank.
 */
export const drawFrame = (
  source: HTMLCanvasElement,
  labels: ILabelSnapshot[],
  { footer, colours, scale, textScale }: IFrameOptions,
): HTMLCanvasElement | null => {
  const { equation, caption, mark } = footer;
  const viewWidth = Math.round((source.clientWidth || source.width) * scale);
  const viewHeight = Math.round((source.clientHeight || source.height) * scale);
  const markSize = mark ? Math.round(MARK_SIZE * textScale) : 0;
  // The equation and caption stop short of the mark, so nothing runs underneath it.
  const markRoom = mark ? markSize + PADDING * textScale : 0;
  const maxEquationWidth = viewWidth - 2 * PADDING * textScale - markRoom;
  // A long equation is shrunk to the image's width, never cut.
  const equationScale = equation ? Math.min(1, maxEquationWidth / equation.width) : 0;
  const equationHeight = equation ? Math.round(equation.height * equationScale) : 0;
  const equationBand = equation ? equationHeight + Math.round(EQUATION_GAP * textScale) : 0;
  // Under an equation the caption is a short detail line, so it needs less room.
  const captionLine = Math.round((equation ? CAPTION_LINE - 12 : CAPTION_LINE) * textScale);
  const canvas = document.createElement('canvas');
  canvas.width = viewWidth;
  canvas.height = viewHeight + equationBand + captionLine;
  const context = canvas.getContext('2d');
  if (!context) return null;

  // The 3D canvas is transparent, so it needs the page's background behind it.
  context.fillStyle = colours.background;
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.drawImage(source, 0, 0, viewWidth, viewHeight);

  context.textAlign = 'center';
  context.textBaseline = 'middle';
  // On screen a label past the edge is clipped; here it would land in the caption band instead.
  const visible = labels.filter(
    (label) => label.x >= 0 && label.y >= 0 && label.x * scale <= viewWidth && label.y * scale <= viewHeight,
  );
  visible.forEach((label) => {
    const fonts = {
      title: `italic 600 ${14 * textScale}px Georgia, 'Times New Roman', serif`,
      tick: `${11 * textScale}px ui-monospace, 'SF Mono', Menlo, Consolas, monospace`,
      note: `500 ${12 * textScale}px ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif`,
    };
    context.font = fonts[label.kind];
    context.fillStyle = label.kind === 'tick' ? colours.muted : colours.foreground;
    context.fillText(label.text, label.x * scale, label.y * scale);
  });

  context.globalAlpha = 0.35;
  context.fillStyle = colours.muted;
  context.fillRect(0, viewHeight, canvas.width, Math.max(1, Math.round(textScale)));
  context.globalAlpha = 1;
  if (equation) {
    const top = viewHeight + Math.round(EQUATION_GAP * textScale);
    context.drawImage(equation, PADDING * textScale, top, equation.width * equationScale, equationHeight);
  }
  context.textAlign = 'left';
  context.font = `${(equation ? 12 : 13) * textScale}px ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif`;
  // Under a typeset equation the caption is the detail line, so it steps back to the muted colour.
  context.fillStyle = equation ? colours.muted : colours.foreground;
  const captionY = viewHeight + equationBand + Math.round(captionLine / 2);
  // `maxWidth` narrows a long caption to fit rather than letting it run off the edge.
  context.fillText(caption, PADDING * textScale, captionY, maxEquationWidth);
  if (mark) {
    const band = equationBand + captionLine;
    const left = viewWidth - PADDING * textScale - markSize;
    context.drawImage(mark, left, viewHeight + Math.round((band - markSize) / 2), markSize, markSize);
  }
  return canvas;
};

/** The view as a PNG at the device's pixel ratio. Same timing rule as `drawFrame`. */
export const composeImage = (
  source: HTMLCanvasElement,
  labels: ILabelSnapshot[],
  footer: IImageFooter,
  colours: IImageColours,
): Promise<Blob | null> => {
  // The canvas is drawn at the device's pixel ratio; the labels are in CSS pixels.
  const scale = source.width / (source.clientWidth || source.width);
  const canvas = drawFrame(source, labels, { footer, colours, scale, textScale: scale });
  return canvas ? new Promise((resolve) => canvas.toBlob(resolve, 'image/png')) : Promise.resolve(null);
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
