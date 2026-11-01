/**
 * Diagrams for programming lessons, drawn from data like svg.mjs: names pointing at values, index
 * strips, decision and loop flowcharts, a call stack, key → value maps, a class and its objects, a
 * tree, nested scopes and the order asynchronous JavaScript runs in. Each returns one SVG string on a
 * white ground (figures invert in dark mode). Code inside a figure is set in a monospace font.
 *
 * Use from a day file: import { memory, indexStrip, ifChain, … } from '<repo>/tools/course-agent/codefig.mjs';
 */

const FONT = 'Arial, sans-serif';
const MONO = 'Menlo, Consolas, monospace';
const INK = '#1f2937';
const MUTED = '#6b7280';
const LINE = '#94a3b8';
const BLUE = '#2563eb';
const BLUE_FILL = '#dbeafe';
const GREEN = '#16a34a';
const GREEN_FILL = '#dcfce7';
const ORANGE = '#ea580c';
const ORANGE_FILL = '#ffedd5';
const PURPLE = '#7c3aed';
const PURPLE_FILL = '#ede9fe';
const RED = '#dc2626';
const GREY_FILL = '#f1f5f9';

const esc = (value) =>
  String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const r2 = (value) => Math.round(value * 100) / 100;
/** Width of monospace text: each character is about 0.6 of the font size. */
const monoWidth = (value, size) => String(value).length * size * 0.6;

const wrap = (width, height, body) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${r2(width)} ${r2(height)}" width="${r2(width)}" height="${r2(height)}" font-family="${FONT}">` +
  `<rect x="0" y="0" width="${r2(width)}" height="${r2(height)}" fill="#ffffff"/>${body}</svg>`;

const text = (x, y, value, { size = 14, anchor = 'middle', fill = INK, weight = 'normal', mono = false, italic = false } = {}) =>
  `<text x="${r2(x)}" y="${r2(y)}" font-size="${size}" text-anchor="${anchor}" fill="${fill}" font-weight="${weight}"${
    mono ? ` font-family="${MONO}"` : ''
  }${italic ? ' font-style="italic"' : ''}>${esc(value)}</text>`;

const rect = (x, y, w, h, { fill = '#ffffff', stroke = INK, width = 2, rx = 8, dash = '' } = {}) =>
  `<rect x="${r2(x)}" y="${r2(y)}" width="${r2(w)}" height="${r2(h)}" rx="${rx}" fill="${fill}" stroke="${stroke}" stroke-width="${width}"${
    dash ? ` stroke-dasharray="${dash}"` : ''
  }/>`;

/** A straight arrow from (x1, y1) to (x2, y2) with a filled head. */
const arrow = (x1, y1, x2, y2, { stroke = INK, width = 2, dash = '' } = {}) => {
  const angle = Math.atan2(y2 - y1, x2 - x1);
  const head = 10;
  const bx = x2 - head * Math.cos(angle);
  const by = y2 - head * Math.sin(angle);
  const left = [bx + 5 * Math.sin(angle), by - 5 * Math.cos(angle)];
  const right = [bx - 5 * Math.sin(angle), by + 5 * Math.cos(angle)];
  return (
    `<line x1="${r2(x1)}" y1="${r2(y1)}" x2="${r2(bx)}" y2="${r2(by)}" stroke="${stroke}" stroke-width="${width}"${dash ? ` stroke-dasharray="${dash}"` : ''}/>` +
    `<path d="M ${r2(x2)} ${r2(y2)} L ${r2(left[0])} ${r2(left[1])} L ${r2(right[0])} ${r2(right[1])} Z" fill="${stroke}"/>`
  );
};

/** A path through points ending in an arrow head, for bends (loop-backs, elbows). */
const pathArrow = (points, { stroke = INK, width = 2 } = {}) => {
  const d = points.map(([x, y], i) => `${i ? 'L' : 'M'} ${r2(x)} ${r2(y)}`).join(' ');
  const [x1, y1] = points[points.length - 2];
  const [x2, y2] = points[points.length - 1];
  return `<path d="${d}" fill="none" stroke="${stroke}" stroke-width="${width}"/>` + arrow(x1, y1, x2, y2, { stroke, width });
};

const titleOf = (title, width) => (title ? text(width / 2, 28, title, { size: 16, weight: 'bold' }) : '');

/**
 * Names pointing at values: `names` are [name, valueKey] pairs, `values` maps each key to its shown
 * text. Two names on one key show aliasing; `stale` values (no name points at them) are drawn dashed
 * as "forgotten". `kinds` may tag a value key 'list' | 'str' | 'num' for its colour.
 */
export const memory = ({ names, values, stale = {}, kinds = {}, title = '', width = 640 }) => {
  const size = 15;
  const top = title ? 56 : 24;
  // A stale value carries a "forgotten" label under its box, so rows need room for it.
  const rowH = Object.keys(stale).length ? 70 : 58;
  const keys = [...new Set(names.map(([, key]) => key)), ...Object.keys(stale)];
  const rows = Math.max(names.length, keys.length);
  const height = top + rows * rowH + 34;
  const nameW = Math.max(70, ...names.map(([n]) => monoWidth(n, size) + 28));
  const valueW = Math.max(110, ...Object.values({ ...values, ...stale }).map((v) => monoWidth(v, size) + 32));
  const nameX = 40;
  const valueX = width - 40 - valueW;
  const colour = (key) =>
    ({ list: [PURPLE, PURPLE_FILL], str: [GREEN, GREEN_FILL], num: [ORANGE, ORANGE_FILL] })[kinds[key]] ?? [BLUE, BLUE_FILL];
  let body = titleOf(title, width);
  body += text(nameX + nameW / 2, top - 6, 'names', { size: 12, fill: MUTED });
  body += text(valueX + valueW / 2, top - 6, 'values', { size: 12, fill: MUTED });
  const nameY = (i) => top + 8 + i * rowH;
  const keyY = (key) => {
    const index = keys.indexOf(key);
    const offset = (rows - keys.length) * rowH * 0.5;
    return top + 8 + offset + index * rowH;
  };
  names.forEach(([name, key], i) => {
    const y = nameY(i);
    body += rect(nameX, y, nameW, 40, { fill: GREY_FILL, stroke: INK, rx: 20 });
    body += text(nameX + nameW / 2, y + 26, name, { size, mono: true, weight: 'bold' });
    body += arrow(nameX + nameW + 4, y + 20, valueX - 6, keyY(key) + 20, { stroke: INK });
  });
  keys.forEach((key) => {
    const y = keyY(key);
    const isStale = key in stale;
    const [stroke, fill] = isStale ? [LINE, '#ffffff'] : colour(key);
    body += rect(valueX, y, valueW, 40, { fill, stroke, dash: isStale ? '6 5' : '' });
    body += text(valueX + valueW / 2, y + 26, isStale ? stale[key] : values[key], { size, mono: true, fill: isStale ? MUTED : INK });
    if (isStale) body += text(valueX + valueW / 2, y + 55, 'forgotten', { size: 12, fill: MUTED, italic: true });
  });
  return wrap(width, height, body);
};

/**
 * A row of boxes with their indexes: positive above, negative below (`negative`), and an optional
 * slice bracket under `slice` = [start, stop] (stop excluded) with its label.
 */
export const indexStrip = ({ items, negative = true, slice = null, sliceLabel = '', title = '', quote = '', width = 640 }) => {
  const n = items.length;
  // Wide enough for the longest item ("green", "Meera"), but the whole strip still fits the page.
  const longest = Math.max(...items.map((item) => monoWidth(`${quote}${item}${quote}`, 20)));
  const cell = Math.min(Math.max(64, longest + 18), (width - 80) / n);
  const left = (width - cell * n) / 2;
  const top = (title ? 60 : 30) + 22;
  const height = top + cell + (negative ? 40 : 14) + (slice ? 56 : 0) + 16;
  let body = titleOf(title, width);
  items.forEach((item, i) => {
    const x = left + i * cell;
    const inSlice = slice && i >= slice[0] && i < slice[1];
    body += rect(x, top, cell, cell, { fill: inSlice ? BLUE_FILL : '#ffffff', stroke: inSlice ? BLUE : INK, rx: 0 });
    const label = `${quote}${item}${quote}`;
    const fontSize = monoWidth(label, 20) + 10 > cell ? Math.max(12, Math.floor(((cell - 10) / label.length) / 0.6)) : 20;
    body += text(x + cell / 2, top + cell / 2 + 7, label, { size: fontSize, mono: true, weight: 'bold' });
    body += text(x + cell / 2, top - 8, String(i), { size: 14, fill: BLUE, weight: 'bold' });
    if (negative) body += text(x + cell / 2, top + cell + 22, String(i - n), { size: 14, fill: ORANGE, weight: 'bold' });
  });
  if (slice) {
    const y = top + cell + (negative ? 34 : 12);
    const x1 = left + slice[0] * cell + 4;
    const x2 = left + slice[1] * cell - 4;
    body += `<path d="M ${r2(x1)} ${r2(y)} L ${r2(x1)} ${r2(y + 10)} L ${r2(x2)} ${r2(y + 10)} L ${r2(x2)} ${r2(y)}" fill="none" stroke="${BLUE}" stroke-width="2"/>`;
    body += text((x1 + x2) / 2, y + 32, sliceLabel, { size: 15, mono: true, fill: BLUE, weight: 'bold' });
  }
  return wrap(width, height, body);
};

const diamond = (cx, cy, w, h, label) =>
  `<path d="M ${r2(cx)} ${r2(cy - h / 2)} L ${r2(cx + w / 2)} ${r2(cy)} L ${r2(cx)} ${r2(cy + h / 2)} L ${r2(cx - w / 2)} ${r2(cy)} Z" fill="${ORANGE_FILL}" stroke="${ORANGE}" stroke-width="2"/>` +
  text(cx, cy + 5, label, { size: 14, mono: true, weight: 'bold' });

/**
 * An if / elif / else chain as a flowchart: each check is a diamond with "yes" to its action on the
 * right and "no" down to the next check; `otherwise` is the else action, `after` the line that runs
 * next whichever branch ran.
 */
export const ifChain = ({ checks, otherwise = '', after = '', title = '', width = 640 }) => {
  const top = title ? 56 : 24;
  const stepH = 96;
  const dW = Math.max(190, ...checks.map(([c]) => monoWidth(c, 14) + 70));
  const cx = 40 + dW / 2;
  const actionX = cx + dW / 2 + 60;
  const actionW = width - actionX - 30;
  const rows = checks.length + (otherwise ? 1 : 0);
  const height = top + rows * stepH + (after ? 90 : 20);
  let body = titleOf(title, width);
  const afterY = top + rows * stepH + 30;
  checks.forEach(([check, action], i) => {
    const cy = top + 36 + i * stepH;
    body += diamond(cx, cy, dW, 64, check);
    body += arrow(cx + dW / 2, cy, actionX - 4, cy, { stroke: GREEN });
    body += text(cx + dW / 2 + 28, cy - 8, 'yes', { size: 12, fill: GREEN, weight: 'bold' });
    body += rect(actionX, cy - 22, actionW, 44, { fill: BLUE_FILL, stroke: BLUE });
    body += text(actionX + actionW / 2, cy + 6, action, { size: 14, mono: true });
    if (after) body += pathArrow([[actionX + actionW / 2, cy + 22], [actionX + actionW / 2, cy + 34], [width - 16, cy + 34], [width - 16, afterY + 20], [cx + 130, afterY + 20]], { stroke: LINE, width: 1.5 });
    if (i < rows - 1) {
      body += arrow(cx, cy + 32, cx, cy + stepH - 34, { stroke: RED });
      body += text(cx + 18, cy + 52, 'no', { size: 12, fill: RED, weight: 'bold' });
    }
  });
  if (otherwise) {
    const cy = top + 36 + checks.length * stepH;
    body += rect(cx - dW / 2 + 20, cy - 22, dW - 40, 44, { fill: BLUE_FILL, stroke: BLUE });
    body += text(cx, cy + 6, otherwise, { size: 14, mono: true });
    body += text(cx - dW / 2 + 10, cy - 30, 'else', { size: 12, fill: MUTED, weight: 'bold', anchor: 'start' });
  }
  if (after) {
    body += rect(cx - 130, afterY, 260, 40, { fill: GREY_FILL, stroke: INK });
    body += text(cx, afterY + 25, after, { size: 14, mono: true });
    const lastY = top + 36 + (rows - 1) * stepH + (otherwise ? 22 : 32);
    body += arrow(cx, lastY, cx, afterY - 4, { stroke: otherwise ? LINE : RED, width: otherwise ? 1.5 : 2 });
    if (!otherwise) body += text(cx + 18, lastY + 20, 'no', { size: 12, fill: RED, weight: 'bold' });
  }
  return wrap(width, height, body);
};

/**
 * A loop as a flowchart: the condition diamond, the body boxes below on "yes", an arrow back up to the
 * condition, and "no" out to `after`. `label` names the loop ("while", "for each item").
 */
export const loop = ({ condition, body: steps, after = '', label = '', title = '', width = 640 }) => {
  const top = (title ? 56 : 24) + (label ? 18 : 0);
  const dW = Math.max(200, monoWidth(condition, 14) + 80);
  const cx = width / 2 - 60;
  const boxW = Math.max(200, ...steps.map((s) => monoWidth(s, 14) + 40));
  const height = top + 80 + steps.length * 60 + 60;
  let out = titleOf(title, width);
  if (label) out += text(cx, top - 8, label, { size: 12, fill: MUTED, weight: 'bold' });
  const cy = top + 36;
  out += diamond(cx, cy, dW, 64, condition);
  steps.forEach((step, i) => {
    const y = top + 92 + i * 60;
    out += rect(cx - boxW / 2, y, boxW, 40, { fill: BLUE_FILL, stroke: BLUE });
    out += text(cx, y + 25, step, { size: 14, mono: true });
    out += arrow(cx, i === 0 ? cy + 32 : y - 20, cx, y - 4, { stroke: i === 0 ? GREEN : INK });
  });
  out += text(cx + 14, cy + 52, 'yes', { size: 12, fill: GREEN, weight: 'bold', anchor: 'start' });
  const lastY = top + 92 + (steps.length - 1) * 60 + 40;
  const backX = cx - Math.max(dW, boxW) / 2 - 30;
  out += pathArrow([[cx, lastY], [cx, lastY + 18], [backX, lastY + 18], [backX, cy], [cx - dW / 2 - 4, cy]], { stroke: BLUE });
  out += text(backX - 6, (cy + lastY) / 2, 'repeat', { size: 12, fill: BLUE, weight: 'bold', anchor: 'end' });
  if (after) {
    const ax = cx + dW / 2 + 40;
    out += arrow(cx + dW / 2, cy, ax + 6, cy, { stroke: RED });
    out += text(cx + dW / 2 + 22, cy - 8, 'no', { size: 12, fill: RED, weight: 'bold' });
    const w = Math.max(120, monoWidth(after, 14) + 30);
    out += rect(ax + 8, cy - 20, Math.min(w, width - ax - 16), 40, { fill: GREY_FILL, stroke: INK });
    out += text(ax + 8 + Math.min(w, width - ax - 16) / 2, cy + 5, after, { size: 14, mono: true });
  }
  return wrap(width, height, out);
};

/**
 * A call stack, the first call at the bottom and the running call on top, with each frame's note
 * (its arguments or local values) and an optional `returns` list read back down the stack.
 */
export const callStack = ({ frames, notes = [], returns = [], title = '', width = 640 }) => {
  const top = title ? 56 : 24;
  const frameH = 48;
  const height = top + frames.length * (frameH + 8) + 46;
  const boxW = Math.min(360, width - 220);
  const x = 40;
  let body = titleOf(title, width);
  frames.forEach((frame, i) => {
    const y = top + (frames.length - 1 - i) * (frameH + 8);
    const isTop = i === frames.length - 1;
    body += rect(x, y, boxW, frameH, { fill: isTop ? GREEN_FILL : BLUE_FILL, stroke: isTop ? GREEN : BLUE });
    body += text(x + 16, y + 30, frame, { size: 15, mono: true, weight: 'bold', anchor: 'start' });
    if (notes[i]) body += text(x + boxW - 14, y + 30, notes[i], { size: 13, mono: true, fill: MUTED, anchor: 'end' });
    if (returns[i] !== undefined && i > 0) {
      body += arrow(x + boxW + 20, y + 14, x + boxW + 20, y + frameH + 22, { stroke: ORANGE });
      body += text(x + boxW + 30, y + frameH + 8, `returns ${returns[i]}`, { size: 13, mono: true, fill: ORANGE, anchor: 'start' });
    }
  });
  const baseY = top + frames.length * (frameH + 8);
  body += text(x + boxW / 2, baseY + 18, 'first call at the bottom, running call on top', { size: 12, fill: MUTED });
  return wrap(width, height, body);
};

/** A dictionary or map as keys pointing at their values. */
export const keyValue = ({ pairs, title = '', keyLabel = 'keys', valueLabel = 'values', width = 640 }) => {
  const top = (title ? 56 : 24) + 18;
  const rowH = 52;
  const keyW = Math.max(110, ...pairs.map(([k]) => monoWidth(k, 15) + 30));
  const valW = Math.max(110, ...pairs.map(([, v]) => monoWidth(v, 15) + 30));
  const keyX = (width - keyW - valW - 120) / 2;
  const valX = keyX + keyW + 120;
  const height = top + pairs.length * rowH + 20;
  let body = titleOf(title, width);
  body += text(keyX + keyW / 2, top - 10, keyLabel, { size: 12, fill: MUTED });
  body += text(valX + valW / 2, top - 10, valueLabel, { size: 12, fill: MUTED });
  pairs.forEach(([key, value], i) => {
    const y = top + i * rowH;
    body += rect(keyX, y, keyW, 40, { fill: ORANGE_FILL, stroke: ORANGE });
    body += text(keyX + keyW / 2, y + 26, key, { size: 15, mono: true, weight: 'bold' });
    body += arrow(keyX + keyW + 6, y + 20, valX - 6, y + 20);
    body += rect(valX, y, valW, 40, { fill: BLUE_FILL, stroke: BLUE });
    body += text(valX + valW / 2, y + 26, value, { size: 15, mono: true });
  });
  return wrap(width, height, body);
};

/**
 * A class as a blueprint and the objects made from it: `fields` and `methods` in the class box,
 * each object with its own field values, joined by "instance of" arrows.
 */
export const classObjects = ({ name, fields = [], methods = [], objects = [], title = '', width = 640 }) => {
  const top = title ? 56 : 24;
  const classW = Math.max(180, ...[...fields, ...methods, name].map((s) => monoWidth(s, 14) + 36));
  const classH = 46 + (fields.length + methods.length) * 22 + (methods.length ? 14 : 0);
  const objW = Math.max(190, ...objects.flatMap((o) => Object.entries(o.values).map(([k, v]) => monoWidth(`${k} = ${v}`, 14) + 30)));
  const objH = (o) => 40 + Object.keys(o.values).length * 22;
  const objectsH = objects.reduce((h, o) => h + objH(o) + 16, 0);
  const height = top + Math.max(classH, objectsH) + 24;
  const objX = width - 30 - objW;
  let body = titleOf(title, width);
  const cy = top + Math.max(0, (objectsH - classH) / 2);
  body += rect(30, cy, classW, classH, { fill: PURPLE_FILL, stroke: PURPLE });
  body += text(30 + classW / 2, cy + 28, `class ${name}`, { size: 15, mono: true, weight: 'bold' });
  body += `<line x1="30" y1="${r2(cy + 40)}" x2="${r2(30 + classW)}" y2="${r2(cy + 40)}" stroke="${PURPLE}" stroke-width="1.5"/>`;
  fields.forEach((f, i) => (body += text(46, cy + 62 + i * 22, f, { size: 14, mono: true, anchor: 'start' })));
  methods.forEach((m, i) => (body += text(46, cy + 76 + (fields.length + i) * 22, m, { size: 14, mono: true, anchor: 'start', fill: PURPLE })));
  let y = top;
  objects.forEach((o) => {
    const h = objH(o);
    body += rect(objX, y, objW, h, { fill: BLUE_FILL, stroke: BLUE });
    body += text(objX + 14, y + 26, o.name, { size: 15, mono: true, weight: 'bold', anchor: 'start' });
    Object.entries(o.values).forEach(([k, v], i) => (body += text(objX + 14, y + 50 + i * 22, `${k} = ${v}`, { size: 14, mono: true, anchor: 'start' })));
    body += arrow(objX - 4, y + h / 2, 30 + classW + 6, cy + classH / 2, { stroke: LINE, width: 1.5, dash: '6 4' });
    y += h + 16;
  });
  body += text((30 + classW + objX) / 2, top + Math.max(classH, objectsH) + 14, 'objects made from the class', { size: 12, fill: MUTED });
  return wrap(width, height, body);
};

/**
 * A tree drawn top-down: `root` is { label, children? }. For an inheritance tree (child classes
 * below their parent) or the DOM (elements inside elements). `note` labels the links.
 */
export const tree = ({ root, note = '', title = '', width = 640 }) => {
  const levels = [];
  const walk = (node, depth) => {
    (levels[depth] ??= []).push(node);
    (node.children ?? []).forEach((child) => walk(child, depth + 1));
  };
  walk(root, 0);
  const top = title ? 56 : 24;
  const levelH = 86;
  const height = top + levels.length * levelH;
  const pos = new Map();
  levels.forEach((nodes, depth) => {
    const w = Math.max(...nodes.map((n) => monoWidth(n.label, 14) + 28), 90);
    const gap = (width - nodes.length * w) / (nodes.length + 1);
    nodes.forEach((node, i) => pos.set(node, { x: gap + i * (w + gap), y: top + depth * levelH, w }));
  });
  let body = titleOf(title, width);
  pos.forEach(({ x, y, w }, node) => {
    (node.children ?? []).forEach((child) => {
      const c = pos.get(child);
      body += `<line x1="${r2(x + w / 2)}" y1="${r2(y + 40)}" x2="${r2(c.x + c.w / 2)}" y2="${r2(c.y)}" stroke="${LINE}" stroke-width="2"/>`;
    });
  });
  pos.forEach(({ x, y, w }, node) => {
    const isRoot = node === root;
    body += rect(x, y, w, 40, { fill: isRoot ? PURPLE_FILL : BLUE_FILL, stroke: isRoot ? PURPLE : BLUE });
    body += text(x + w / 2, y + 26, node.label, { size: 14, mono: true, weight: 'bold' });
  });
  if (note) body += text(width - 16, height - 10, note, { size: 12, fill: MUTED, anchor: 'end' });
  return wrap(width, height, body);
};

/** Nested scopes as boxes inside boxes, each with its label and the names it holds. */
export const scopes = ({ boxes, title = '', width = 640 }) => {
  const top = title ? 56 : 24;
  const inset = 26;
  const lineH = 22;
  const heights = boxes.map((b) => 40 + b.names.length * lineH);
  const height = top + heights.reduce((a, b) => a + b, 0) + boxes.length * 14 + 20;
  const colours = [[INK, GREY_FILL], [BLUE, BLUE_FILL], [GREEN, GREEN_FILL], [ORANGE, ORANGE_FILL]];
  let body = titleOf(title, width);
  let y = top;
  const outer = [];
  boxes.forEach((b, i) => outer.push({ x: 20 + i * inset, y: top + heights.slice(0, i).reduce((a, h) => a + h, 0) + i * 14 }));
  boxes.forEach((b, i) => {
    const { x } = outer[i];
    y = outer[i].y;
    const bottom = height - 20 - i * 10;
    const [stroke, fill] = colours[i % colours.length];
    body += rect(x, y, width - 2 * x, bottom - y, { fill, stroke, rx: 10 });
    body += text(x + 14, y + 24, b.label, { size: 13, weight: 'bold', fill: stroke, anchor: 'start' });
    b.names.forEach((n, j) => (body += text(x + 30, y + 46 + j * lineH, n, { size: 14, mono: true, anchor: 'start' })));
  });
  return wrap(width, height, body);
};

/**
 * The order asynchronous JavaScript runs in: `lanes` are column titles ("Call stack", "Promise
 * queue", "Timer queue"), `steps` are { lane, label } in the order they run (numbered), and `output`
 * is what the console shows, in order (`outputLabel` names it: "console" for JavaScript, "output" for Python).
 */
export const asyncOrder = ({ lanes, steps, output = [], outputLabel = 'console', title = '', width = 640 }) => {
  const top = (title ? 56 : 24) + 26;
  const laneW = (width - 40) / lanes.length;
  const rowH = 44;
  const rows = Math.max(...lanes.map((_, li) => steps.filter((s) => s.lane === li).length), 1);
  const outY = top + rows * rowH + 20;
  const height = outY + (output.length ? 58 : 10);
  let body = titleOf(title, width);
  const fills = [[BLUE, BLUE_FILL], [PURPLE, PURPLE_FILL], [ORANGE, ORANGE_FILL], [GREEN, GREEN_FILL]];
  lanes.forEach((lane, li) => {
    const x = 20 + li * laneW;
    body += text(x + laneW / 2, top - 10, lane, { size: 13, weight: 'bold', fill: fills[li % 4][0] });
    body += `<line x1="${r2(x + laneW)}" y1="${r2(top - 24)}" x2="${r2(x + laneW)}" y2="${r2(outY - 8)}" stroke="#e5e7eb" stroke-width="1.5"/>`;
  });
  const used = lanes.map(() => 0);
  steps.forEach((step, n) => {
    const x = 20 + step.lane * laneW + 8;
    const y = top + used[step.lane]++ * rowH;
    const [stroke, fill] = fills[step.lane % 4];
    body += rect(x, y, laneW - 16, 34, { fill, stroke, rx: 6 });
    body += `<circle cx="${r2(x + 16)}" cy="${r2(y + 17)}" r="11" fill="${stroke}"/>`;
    body += text(x + 16, y + 22, String(n + 1), { size: 12, weight: 'bold', fill: '#ffffff' });
    body += text(x + 34, y + 22, step.label, { size: 13, mono: true, anchor: 'start' });
  });
  if (output.length) {
    body += rect(20, outY, width - 40, 44, { fill: '#0f172a', stroke: '#0f172a', rx: 6 });
    body += text(34, outY + 27, `${outputLabel}: ${output.join('  →  ')}`, { size: 14, mono: true, fill: '#e2e8f0', anchor: 'start' });
  }
  return wrap(width, height, body);
};
