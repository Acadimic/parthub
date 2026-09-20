/**
 * A course cover drawn in the browser, so every generated course has one without an image model.
 *
 * Deterministic from the course id: the same course always gets the same palette and pattern, and
 * two courses side by side get different ones. Rendered on a canvas and returned as a PNG file for
 * the ordinary upload path.
 */

const WIDTH = 1200;
const HEIGHT = 675;

/** Pairs of gradient stops, chosen to sit well behind white type in light and dark theme alike. */
const PALETTES: [string, string][] = [
  ['#4f46e5', '#0ea5e9'],
  ['#0f766e', '#22c55e'],
  ['#b45309', '#f59e0b'],
  ['#be123c', '#f472b6'],
  ['#1d4ed8', '#7c3aed'],
  ['#065f46', '#0891b2'],
  ['#7c2d12', '#ea580c'],
  ['#312e81', '#db2777'],
];

const hashOf = (seed: string): number => {
  let hash = 0;
  for (let index = 0; index < seed.length; index += 1) hash = (hash * 31 + seed.charCodeAt(index)) >>> 0;
  return hash;
};

/** Greedy word wrap into at most `maxLines`, the last line ellipsised if the title is longer. */
const wrap = (context: CanvasRenderingContext2D, text: string, maxWidth: number, maxLines: number): string[] => {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = '';
  words.forEach((word) => {
    const candidate = line ? `${line} ${word}` : word;
    if (context.measureText(candidate).width <= maxWidth || !line) line = candidate;
    else {
      lines.push(line);
      line = word;
    }
  });
  if (line) lines.push(line);
  if (lines.length > maxLines) {
    const kept = lines.slice(0, maxLines);
    kept[maxLines - 1] = `${kept[maxLines - 1].replace(/[.,;:]?$/, '')}…`;
    return kept;
  }
  return lines;
};

export interface ICoverOptions {
  title: string;
  /** "Class 10 · Physics", under the title. */
  subtitle: string;
  /** The course id, or anything stable for the course. */
  seed: string;
}

/** Draws the cover and resolves to a PNG file named for the course. */
export const renderCourseCover = ({ title, subtitle, seed }: ICoverOptions): Promise<File> =>
  new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    canvas.width = WIDTH;
    canvas.height = HEIGHT;
    const context = canvas.getContext('2d');
    if (!context) {
      reject(new Error('Canvas is not available.'));
      return;
    }
    const hash = hashOf(seed);
    const [from, to] = PALETTES[hash % PALETTES.length];
    const gradient = context.createLinearGradient(0, 0, WIDTH, HEIGHT);
    gradient.addColorStop(0, from);
    gradient.addColorStop(1, to);
    context.fillStyle = gradient;
    context.fillRect(0, 0, WIDTH, HEIGHT);

    // A field of translucent rings, positioned from the hash so each course's cover differs.
    context.strokeStyle = 'rgba(255,255,255,0.14)';
    context.lineWidth = 3;
    for (let index = 0; index < 9; index += 1) {
      const step = (hash >> (index * 3)) & 0xff;
      const x = ((step * 37 + index * 131) % WIDTH) + 40;
      const y = ((step * 53 + index * 97) % HEIGHT) + 20;
      const radius = 60 + ((step * 7) % 140);
      context.beginPath();
      context.arc(x, y, radius, 0, Math.PI * 2);
      context.stroke();
    }

    // A dark scrim behind the type keeps it readable over the lighter half of the gradient.
    const scrim = context.createLinearGradient(0, HEIGHT * 0.35, 0, HEIGHT);
    scrim.addColorStop(0, 'rgba(0,0,0,0)');
    scrim.addColorStop(1, 'rgba(0,0,0,0.45)');
    context.fillStyle = scrim;
    context.fillRect(0, 0, WIDTH, HEIGHT);

    context.fillStyle = '#ffffff';
    context.textBaseline = 'alphabetic';
    context.font = '600 30px ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';
    context.globalAlpha = 0.85;
    context.fillText(subtitle.toUpperCase(), 72, 96);
    context.globalAlpha = 1;
    context.font = '700 66px ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';
    const lines = wrap(context, title, WIDTH - 144, 3);
    const lineHeight = 80;
    const top = HEIGHT - 96 - (lines.length - 1) * lineHeight;
    lines.forEach((line, index) => context.fillText(line, 72, top + index * lineHeight));

    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error('Could not render the cover.'));
        return;
      }
      resolve(new File([blob], 'cover.png', { type: 'image/png' }));
    }, 'image/png');
  });
