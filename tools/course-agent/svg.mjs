/**
 * Figures drawn from data, for the pictures a course reply carries in its `figures` list. A chart's
 * bars, a pie's sectors and a triangle's sides come from the numbers, so the picture always matches
 * the text. Every function returns one complete SVG string on a white ground that passes the
 * importer's checks (`svgProblem` in @repo/shared/ai).
 *
 * Use from a reply builder: import { bar, pie, elevation, clock, figure } from '<repo>/tools/course-agent/svg.mjs';
 */

const FONT = 'Arial, sans-serif';
export const PALETTE = ['#2563eb', '#f97316', '#16a34a', '#9333ea', '#dc2626', '#0891b2', '#ca8a04', '#db2777'];
const INK = '#1f2937';
const MUTED = '#6b7280';
const GRID = '#e5e7eb';

const esc = (text) => String(text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const fmt = (value) => {
  if (typeof value !== 'number') return String(value);
  return Number.isInteger(value) ? value.toLocaleString('en-IN') : value.toLocaleString('en-IN', { maximumFractionDigits: 2 });
};
const r2 = (value) => Math.round(value * 100) / 100;

const wrap = (width, height, body) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" font-family="${FONT}">` +
  `<rect x="0" y="0" width="${width}" height="${height}" fill="#ffffff"/>${body}</svg>`;

export const text = (x, y, value, { size = 13, anchor = 'middle', fill = INK, weight = 'normal', rotate = 0 } = {}) =>
  `<text x="${r2(x)}" y="${r2(y)}" font-size="${size}" text-anchor="${anchor}" fill="${fill}" font-weight="${weight}"${
    rotate ? ` transform="rotate(${rotate} ${r2(x)} ${r2(y)})"` : ''
  }>${esc(value)}</text>`;

const lineEl = (x1, y1, x2, y2, { stroke = INK, width = 1.5, dash = '' } = {}) =>
  `<line x1="${r2(x1)}" y1="${r2(y1)}" x2="${r2(x2)}" y2="${r2(y2)}" stroke="${stroke}" stroke-width="${width}"${dash ? ` stroke-dasharray="${dash}"` : ''}/>`;

/** A "nice" axis maximum and step for values up to `max`. */
export const niceScale = (max, ticks = 5) => {
  const raw = max / ticks;
  const magnitude = 10 ** Math.floor(Math.log10(raw || 1));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * magnitude).find((s) => s >= raw) ?? 10 * magnitude;
  return { max: Math.ceil(max / step) * step, step };
};

const legend = (series, x, y) =>
  series
    .map((name, index) => {
      const lx = x + index * 0;
      const ly = y + index * 20;
      return `<rect x="${lx}" y="${ly - 10}" width="12" height="12" fill="${PALETTE[index % PALETTE.length]}"/>` + text(lx + 18, ly, name, { anchor: 'start', size: 12 });
    })
    .join('');

const axes = ({ left, top, plotW, plotH, scale, yLabel, unitSuffix = '' }) => {
  let body = '';
  for (let v = 0; v <= scale.max + 1e-9; v += scale.step) {
    const y = top + plotH - (v / scale.max) * plotH;
    body += lineEl(left, y, left + plotW, y, { stroke: GRID, width: 1 });
    body += text(left - 8, y + 4, `${fmt(r2(v))}${unitSuffix}`, { anchor: 'end', size: 12, fill: MUTED });
  }
  body += lineEl(left, top, left, top + plotH) + lineEl(left, top + plotH, left + plotW, top + plotH);
  if (yLabel) body += text(16, top + plotH / 2, yLabel, { rotate: -90, size: 12, fill: MUTED });
  return body;
};

/**
 * Bar chart. `data` is [[label, value], ...]. Options: title, yLabel, xLabel, valueLabels (true),
 * max (axis top), unitSuffix ('%'), horizontal is not supported (use a table).
 */
export const bar = (data, { title = '', yLabel = '', xLabel = '', max, unitSuffix = '', width = 640, height = 360, color = PALETTE[0] } = {}) => {
  const left = 70;
  const top = title ? 44 : 20;
  const bottom = xLabel ? 62 : 44;
  const plotW = width - left - 20;
  const plotH = height - top - bottom;
  const scale = niceScale(max ?? Math.max(...data.map(([, v]) => v)));
  const slot = plotW / data.length;
  const barW = Math.min(64, slot * 0.6);
  let body = title ? text(width / 2, 26, title, { size: 15, weight: 'bold' }) : '';
  body += axes({ left, top, plotW, plotH, scale, yLabel, unitSuffix });
  data.forEach(([label, value], index) => {
    const h = (value / scale.max) * plotH;
    const x = left + slot * index + (slot - barW) / 2;
    const y = top + plotH - h;
    body += `<rect x="${r2(x)}" y="${r2(y)}" width="${r2(barW)}" height="${r2(h)}" fill="${color}"/>`;
    body += text(x + barW / 2, y - 6, `${fmt(value)}${unitSuffix}`, { size: 12, weight: 'bold' });
    body += text(x + barW / 2, top + plotH + 18, label, { size: 12 });
  });
  if (xLabel) body += text(left + plotW / 2, height - 14, xLabel, { size: 12, fill: MUTED });
  return wrap(width, height, body);
};

/** Grouped bars. `categories` = ['2021', ...]; `series` = [[name, [v1, v2, ...]], ...]. */
export const groupedBar = (categories, series, { title = '', yLabel = '', xLabel = '', max, unitSuffix = '', width = 680, height = 380 } = {}) => {
  const left = 70;
  const top = title ? 44 : 20;
  const legendW = 140;
  const bottom = xLabel ? 62 : 44;
  const plotW = width - left - legendW - 10;
  const plotH = height - top - bottom;
  const scale = niceScale(max ?? Math.max(...series.flatMap(([, values]) => values)));
  const slot = plotW / categories.length;
  const groupW = slot * 0.8;
  const barW = groupW / series.length;
  let body = title ? text((width - legendW) / 2 + 20, 26, title, { size: 15, weight: 'bold' }) : '';
  body += axes({ left, top, plotW, plotH, scale, yLabel, unitSuffix });
  categories.forEach((category, ci) => {
    const gx = left + slot * ci + (slot - groupW) / 2;
    series.forEach(([, values], si) => {
      const value = values[ci];
      const h = (value / scale.max) * plotH;
      const x = gx + si * barW;
      const y = top + plotH - h;
      body += `<rect x="${r2(x)}" y="${r2(y)}" width="${r2(barW - 2)}" height="${r2(h)}" fill="${PALETTE[si % PALETTE.length]}"/>`;
      body += text(x + (barW - 2) / 2, y - 5, fmt(value), { size: series.length > 3 ? 10 : 11 });
    });
    body += text(gx + groupW / 2, top + plotH + 18, category, { size: 12 });
  });
  body += legend(series.map(([name]) => name), width - legendW + 6, top + 12);
  if (xLabel) body += text(left + plotW / 2, height - 14, xLabel, { size: 12, fill: MUTED });
  return wrap(width, height, body);
};

/** Stacked bars: same inputs as groupedBar; segment values are labelled inside, totals on top. */
export const stackedBar = (categories, series, { title = '', yLabel = '', xLabel = '', max, width = 680, height = 400 } = {}) => {
  const left = 70;
  const top = title ? 44 : 20;
  const legendW = 140;
  const bottom = xLabel ? 62 : 44;
  const plotW = width - left - legendW - 10;
  const plotH = height - top - bottom;
  const totals = categories.map((_, ci) => series.reduce((sum, [, values]) => sum + values[ci], 0));
  const scale = niceScale(max ?? Math.max(...totals));
  const slot = plotW / categories.length;
  const barW = Math.min(70, slot * 0.6);
  let body = title ? text((width - legendW) / 2 + 20, 26, title, { size: 15, weight: 'bold' }) : '';
  body += axes({ left, top, plotW, plotH, scale, yLabel });
  categories.forEach((category, ci) => {
    const x = left + slot * ci + (slot - barW) / 2;
    let base = top + plotH;
    series.forEach(([, values], si) => {
      const h = (values[ci] / scale.max) * plotH;
      base -= h;
      body += `<rect x="${r2(x)}" y="${r2(base)}" width="${r2(barW)}" height="${r2(h)}" fill="${PALETTE[si % PALETTE.length]}" stroke="#ffffff" stroke-width="1"/>`;
      if (h >= 16) body += text(x + barW / 2, base + h / 2 + 4, fmt(values[ci]), { size: 11, fill: '#ffffff', weight: 'bold' });
    });
    body += text(x + barW / 2, base - 6, fmt(totals[ci]), { size: 12, weight: 'bold' });
    body += text(x + barW / 2, top + plotH + 18, category, { size: 12 });
  });
  body += legend(series.map(([name]) => name), width - legendW + 6, top + 12);
  if (xLabel) body += text(left + plotW / 2, height - 14, xLabel, { size: 12, fill: MUTED });
  return wrap(width, height, body);
};

/**
 * Pie chart. `data` = [[label, value], ...]; sectors are drawn in proportion to value and labelled
 * with `labelOf(label, value, percent, degrees)` (default "label: value%"). Pass `inDegrees: true`
 * when the values are degrees summing to 360, `total` to show a centre note.
 */
export const pie = (data, { title = '', labelOf, width = 640, height = 380, note = '' } = {}) => {
  const sum = data.reduce((total, [, value]) => total + value, 0);
  const cx = 200;
  const cy = (title ? 40 : 10) + 160;
  const radius = 140;
  let angle = -Math.PI / 2;
  let body = title ? text(width / 2, 26, title, { size: 15, weight: 'bold' }) : '';
  data.forEach(([label, value], index) => {
    const sweep = (value / sum) * Math.PI * 2;
    const x1 = cx + radius * Math.cos(angle);
    const y1 = cy + radius * Math.sin(angle);
    const x2 = cx + radius * Math.cos(angle + sweep);
    const y2 = cy + radius * Math.sin(angle + sweep);
    const large = sweep > Math.PI ? 1 : 0;
    const color = PALETTE[index % PALETTE.length];
    body +=
      data.length === 1
        ? `<circle cx="${cx}" cy="${cy}" r="${radius}" fill="${color}"/>`
        : `<path d="M ${cx} ${cy} L ${r2(x1)} ${r2(y1)} A ${radius} ${radius} 0 ${large} 1 ${r2(x2)} ${r2(y2)} Z" fill="${color}" stroke="#ffffff" stroke-width="2"/>`;
    const percent = (value / sum) * 100;
    const degrees = (value / sum) * 360;
    if (percent >= 6) {
      const mid = angle + sweep / 2;
      body += text(cx + radius * 0.62 * Math.cos(mid), cy + radius * 0.62 * Math.sin(mid) + 4, `${fmt(r2(percent))}%`, { size: 12, fill: '#ffffff', weight: 'bold' });
    }
    const ly = (title ? 56 : 26) + index * 24;
    const caption = labelOf ? labelOf(label, value, r2(percent), r2(degrees)) : `${label}: ${fmt(r2(percent))}%`;
    body += `<rect x="370" y="${ly - 11}" width="14" height="14" fill="${color}"/>` + text(392, ly, caption, { anchor: 'start', size: 13 });
    angle += sweep;
  });
  if (note) body += text(370, height - 18, note, { anchor: 'start', size: 12, fill: MUTED });
  return wrap(width, height, body);
};

/** Line chart. `categories` = x labels; `series` = [[name, [values]], ...]. Points are labelled. */
export const line = (categories, series, { title = '', yLabel = '', xLabel = '', max, min = 0, unitSuffix = '', width = 680, height = 380 } = {}) => {
  const left = 70;
  const top = title ? 44 : 20;
  const legendW = series.length > 1 ? 140 : 20;
  const bottom = xLabel ? 62 : 44;
  const plotW = width - left - legendW - 10;
  const plotH = height - top - bottom;
  const scale = niceScale((max ?? Math.max(...series.flatMap(([, v]) => v))) - min);
  const span = scale.max;
  let body = title ? text((width - legendW) / 2 + 20, 26, title, { size: 15, weight: 'bold' }) : '';
  for (let v = 0; v <= span + 1e-9; v += scale.step) {
    const y = top + plotH - (v / span) * plotH;
    body += lineEl(left, y, left + plotW, y, { stroke: GRID, width: 1 });
    body += text(left - 8, y + 4, `${fmt(r2(v + min))}${unitSuffix}`, { anchor: 'end', size: 12, fill: MUTED });
  }
  body += lineEl(left, top, left, top + plotH) + lineEl(left, top + plotH, left + plotW, top + plotH);
  if (yLabel) body += text(16, top + plotH / 2, yLabel, { rotate: -90, size: 12, fill: MUTED });
  const step = plotW / Math.max(1, categories.length - 1);
  const px = (i) => left + (categories.length === 1 ? plotW / 2 : step * i);
  const py = (v) => top + plotH - ((v - min) / span) * plotH;
  categories.forEach((category, i) => (body += text(px(i), top + plotH + 18, category, { size: 12 })));
  series.forEach(([, values], si) => {
    const color = PALETTE[si % PALETTE.length];
    body += `<polyline points="${values.map((v, i) => `${r2(px(i))},${r2(py(v))}`).join(' ')}" fill="none" stroke="${color}" stroke-width="2.5"/>`;
    values.forEach((v, i) => {
      body += `<circle cx="${r2(px(i))}" cy="${r2(py(v))}" r="4" fill="${color}"/>`;
      body += text(px(i), py(v) - 9 - (si % 2) * 0, `${fmt(v)}${unitSuffix}`, { size: 11, fill: color, weight: 'bold' });
    });
  });
  if (series.length > 1) body += legend(series.map(([name]) => name), width - legendW + 6, top + 12);
  if (xLabel) body += text(left + plotW / 2, height - 14, xLabel, { size: 12, fill: MUTED });
  return wrap(width, height, body);
};

/** A data table drawn as a picture, for a caselet summary or a lesson; prefer Markdown tables in text. */
export const tableFigure = (header, rows, { title = '', width = 640 } = {}) => {
  const rowH = 30;
  const top = title ? 44 : 14;
  const height = top + rowH * (rows.length + 1) + 14;
  const colW = (width - 40) / header.length;
  let body = title ? text(width / 2, 26, title, { size: 15, weight: 'bold' }) : '';
  [header, ...rows].forEach((row, ri) => {
    const y = top + ri * rowH;
    body += `<rect x="20" y="${y}" width="${width - 40}" height="${rowH}" fill="${ri === 0 ? '#f3f4f6' : '#ffffff'}" stroke="${GRID}"/>`;
    row.forEach((cell, ci) => (body += text(20 + colW * ci + colW / 2, y + 20, fmt(cell), { size: 13, weight: ri === 0 ? 'bold' : 'normal' })));
  });
  return wrap(width, height, body);
};

// ---------------------------------------------------------------- geometry

const polygon = (points, { fill = '#dbeafe', stroke = PALETTE[0], width = 2 } = {}) =>
  `<polygon points="${points.map(([x, y]) => `${r2(x)},${r2(y)}`).join(' ')}" fill="${fill}" stroke="${stroke}" stroke-width="${width}"/>`;

const angleArc = (vx, vy, a1, a2, radius, label) => {
  // a1, a2 in radians (screen coordinates, y down); draws the arc from a1 to a2.
  const x1 = vx + radius * Math.cos(a1);
  const y1 = vy + radius * Math.sin(a1);
  const x2 = vx + radius * Math.cos(a2);
  const y2 = vy + radius * Math.sin(a2);
  const sweep = a2 > a1 ? 1 : 0;
  const mid = (a1 + a2) / 2;
  return (
    `<path d="M ${r2(x1)} ${r2(y1)} A ${radius} ${radius} 0 0 ${sweep} ${r2(x2)} ${r2(y2)}" fill="none" stroke="${PALETTE[4]}" stroke-width="1.5"/>` +
    (label ? text(vx + (radius + 16) * Math.cos(mid), vy + (radius + 16) * Math.sin(mid) + 4, label, { size: 13, fill: PALETTE[4], weight: 'bold' }) : '')
  );
};

const rightMark = (x, y, dx, dy, size = 12) =>
  `<path d="M ${r2(x + dx * size)} ${r2(y)} L ${r2(x + dx * size)} ${r2(y + dy * size)} L ${r2(x)} ${r2(y + dy * size)}" fill="none" stroke="${INK}" stroke-width="1.2"/>`;

/**
 * A vertical object (tower, pole, building) of height label `heightLabel`, observed from a point
 * on the ground at distance label `baseLabel`, with angle of elevation `angle` degrees (drawn to
 * scale). Options: observerLabel, topLabel, footLabel, second: { distanceRatio, angle, label } for
 * a second observation point further away on the same side.
 */
export const elevation = ({ angle, heightLabel = 'h', baseLabel = 'd', topLabel = 'A', footLabel = 'B', observerLabel = 'C', second, width = 640, height = 360 }) => {
  const ground = height - 50;
  const footX = width - 120;
  const rad = (angle * Math.PI) / 180;
  const far = second ? Math.tan(rad) / Math.tan((second.angle * Math.PI) / 180) : 1;
  const maxRun = width - 200;
  const run = maxRun / far;
  const towerH = Math.min(ground - 40, run * Math.tan(rad));
  const scaledRun = towerH / Math.tan(rad);
  const ox = footX - scaledRun;
  const topY = ground - towerH;
  let body = lineEl(30, ground, width - 30, ground, { stroke: MUTED });
  body += `<rect x="${footX - 8}" y="${r2(topY)}" width="16" height="${r2(towerH)}" fill="#e5e7eb" stroke="${INK}" stroke-width="1.5"/>`;
  body += lineEl(ox, ground, footX, topY, { stroke: PALETTE[0], dash: '6 4' });
  body += angleArc(ox, ground, -rad, 0, 40, `${angle}°`);
  body += rightMark(footX - 8, ground, -1, -1);
  body += text(footX + 24, (ground + topY) / 2, heightLabel, { anchor: 'start', size: 14, weight: 'bold' });
  body += text(footX + 4, topY - 8, topLabel, { size: 13 }) + text(footX + 8, ground + 20, footLabel, { size: 13 });
  body += text(ox, ground + 20, observerLabel, { size: 13 });
  body += text((ox + footX) / 2, ground + 38, baseLabel, { size: 14, weight: 'bold' });
  if (second) {
    const rad2 = (second.angle * Math.PI) / 180;
    const ox2 = footX - towerH / Math.tan(rad2);
    body += lineEl(ox2, ground, footX, topY, { stroke: PALETTE[1], dash: '6 4' });
    body += angleArc(ox2, ground, -rad2, 0, 52, `${second.angle}°`);
    body += text(ox2, ground + 20, second.label ?? 'D', { size: 13 });
    if (second.gapLabel) body += text((ox2 + ox) / 2, ground - 8, second.gapLabel, { size: 13, weight: 'bold', fill: PALETTE[1] });
  }
  return wrap(width, height, body);
};

/**
 * Angle of depression: an observer at the top of a tower/cliff of height `heightLabel` looks down
 * at an object on the ground at angle `angle`. The horizontal line from the eye is drawn.
 */
export const depression = ({ angle, heightLabel = 'h', baseLabel = 'd', topLabel = 'A', footLabel = 'B', objectLabel = 'C', width = 640, height = 360 }) => {
  const ground = height - 50;
  const footX = 120;
  const rad = (angle * Math.PI) / 180;
  const maxRun = width - 220;
  const towerH = Math.min(ground - 50, maxRun * Math.tan(rad));
  const run = towerH / Math.tan(rad);
  const topY = ground - towerH;
  const objX = footX + run;
  let body = lineEl(30, ground, width - 30, ground, { stroke: MUTED });
  body += `<rect x="${footX - 8}" y="${r2(topY)}" width="16" height="${r2(towerH)}" fill="#e5e7eb" stroke="${INK}" stroke-width="1.5"/>`;
  body += lineEl(footX, topY, objX + 40, topY, { stroke: MUTED, dash: '3 4' });
  body += lineEl(footX, topY, objX, ground, { stroke: PALETTE[0], dash: '6 4' });
  body += angleArc(footX, topY, 0, rad, 46, `${angle}°`);
  body += `<circle cx="${r2(objX)}" cy="${ground}" r="5" fill="${PALETTE[1]}"/>`;
  body += text(footX - 22, (ground + topY) / 2, heightLabel, { anchor: 'end', size: 14, weight: 'bold' });
  body += text(footX, topY - 10, topLabel, { size: 13 }) + text(footX, ground + 20, footLabel, { size: 13 });
  body += text(objX, ground + 20, objectLabel, { size: 13 });
  body += text((footX + objX) / 2, ground + 38, baseLabel, { size: 14, weight: 'bold' });
  return wrap(width, height, body);
};

/** A right triangle with legs drawn in ratio a:b (base a, height b), labels on each side and angle. */
export const rightTriangle = ({ base, height: rise, baseLabel, heightLabel, hypLabel = '', angleLabel = '', width = 520, canvasHeight: height = 340 }) => {
  const scale = Math.min((width - 160) / base, (height - 90) / rise);
  const ax = 80;
  const ay = height - 50;
  const bx = ax + base * scale;
  const cy = ay - rise * scale;
  let body = polygon([[ax, ay], [bx, ay], [bx, cy]]);
  body += rightMark(bx, ay, -1, -1);
  body += text((ax + bx) / 2, ay + 24, baseLabel ?? fmt(base), { size: 14, weight: 'bold' });
  body += text(bx + 14, (ay + cy) / 2, heightLabel ?? fmt(rise), { anchor: 'start', size: 14, weight: 'bold' });
  if (hypLabel) body += text((ax + bx) / 2 - 18, (ay + cy) / 2 - 8, hypLabel, { anchor: 'end', size: 14, weight: 'bold' });
  if (angleLabel) body += angleArc(ax, ay, -Math.atan2(ay - cy, bx - ax), 0, 36, angleLabel);
  return wrap(width, height, body);
};

/** A triangle with sides a (base), b, c drawn to scale; labels optional. */
export const triangleSides = ({ a, b, c, labels = [String(a), String(b), String(c)], width = 520, height = 340 }) => {
  // Base AB = a on the ground; C from the law of cosines: |AC| = b, |BC| = c.
  const x = (a * a + b * b - c * c) / (2 * a);
  const y = Math.sqrt(Math.max(0, b * b - x * x));
  const scale = Math.min((width - 120) / Math.max(a, x, a - x), (height - 90) / (y || 1));
  const ox = 60;
  const oy = height - 50;
  const A = [ox, oy];
  const B = [ox + a * scale, oy];
  const C = [ox + x * scale, oy - y * scale];
  let body = polygon([A, B, C]);
  body += text((A[0] + B[0]) / 2, oy + 24, labels[0], { size: 14, weight: 'bold' });
  body += text((A[0] + C[0]) / 2 - 14, (A[1] + C[1]) / 2, labels[1], { anchor: 'end', size: 14, weight: 'bold' });
  body += text((B[0] + C[0]) / 2 + 14, (B[1] + C[1]) / 2, labels[2], { anchor: 'start', size: 14, weight: 'bold' });
  return wrap(width, height, body);
};

/** A rectangle w × h (to scale) with optional uniform path of width p outside (`outer`) or inside. */
export const rectangle = ({ w, h, wLabel, hLabel, path, pathLabel = '', inside = false, width = 560, height = 360 }) => {
  const outerW = path && !inside ? w + 2 * path : w;
  const outerH = path && !inside ? h + 2 * path : h;
  const scale = Math.min((width - 140) / outerW, (height - 100) / outerH);
  const ox = (width - outerW * scale) / 2;
  const oy = (height - outerH * scale) / 2;
  let body = '';
  if (path) {
    body += `<rect x="${r2(ox)}" y="${r2(oy)}" width="${r2(outerW * scale)}" height="${r2(outerH * scale)}" fill="#fde68a" stroke="${PALETTE[6]}" stroke-width="2"/>`;
    const ix = inside ? ox + path * scale : ox + path * scale;
    const iy = inside ? oy + path * scale : oy + path * scale;
    const iw = (inside ? w - 2 * path : w) * scale;
    const ih = (inside ? h - 2 * path : h) * scale;
    body += `<rect x="${r2(ix)}" y="${r2(iy)}" width="${r2(iw)}" height="${r2(ih)}" fill="#bbf7d0" stroke="${PALETTE[2]}" stroke-width="2"/>`;
    if (pathLabel) body += text(ox + outerW * scale + 8, oy + (path * scale) / 2 + 5, pathLabel, { anchor: 'start', size: 13, weight: 'bold', fill: PALETTE[6] });
    const lw = inside ? outerW : w;
    const lx = inside ? ox : ix;
    const ly = inside ? oy : iy;
    const lh = inside ? outerH : h;
    body += text(lx + (lw * scale) / 2, ly + lh * scale + 22, wLabel ?? fmt(w), { size: 14, weight: 'bold' });
    body += text(lx - 10, ly + (lh * scale) / 2, hLabel ?? fmt(h), { anchor: 'end', size: 14, weight: 'bold' });
  } else {
    body += `<rect x="${r2(ox)}" y="${r2(oy)}" width="${r2(w * scale)}" height="${r2(h * scale)}" fill="#dbeafe" stroke="${PALETTE[0]}" stroke-width="2"/>`;
    body += text(ox + (w * scale) / 2, oy + h * scale + 22, wLabel ?? fmt(w), { size: 14, weight: 'bold' });
    body += text(ox - 10, oy + (h * scale) / 2, hLabel ?? fmt(h), { anchor: 'end', size: 14, weight: 'bold' });
  }
  return wrap(width, height, body);
};

/** A circle of radius label `rLabel`, optional sector of `sector` degrees and optional inner radius (ring). */
export const circle = ({ rLabel = 'r', sector, sectorLabel = '', inner, innerLabel = '', width = 420, height = 340 }) => {
  const cx = width / 2;
  const cy = height / 2;
  const R = Math.min(width, height) / 2 - 40;
  let body = `<circle cx="${cx}" cy="${cy}" r="${R}" fill="#dbeafe" stroke="${PALETTE[0]}" stroke-width="2"/>`;
  if (inner) body += `<circle cx="${cx}" cy="${cy}" r="${r2(R * inner)}" fill="#ffffff" stroke="${PALETTE[0]}" stroke-width="2"/>`;
  if (sector) {
    const a = (sector * Math.PI) / 180;
    const x2 = cx + R * Math.cos(-a);
    const y2 = cy + R * Math.sin(-a);
    body += `<path d="M ${cx} ${cy} L ${cx + R} ${cy} A ${R} ${R} 0 ${sector > 180 ? 1 : 0} 0 ${r2(x2)} ${r2(y2)} Z" fill="#fed7aa" stroke="${PALETTE[1]}" stroke-width="2"/>`;
    body += angleArc(cx, cy, 0, -a, 26, sectorLabel || `${sector}°`);
  }
  body += `<circle cx="${cx}" cy="${cy}" r="3" fill="${INK}"/>`;
  body += lineEl(cx, cy, cx + R * Math.cos(Math.PI / 5), cy + R * Math.sin(Math.PI / 5), { stroke: INK });
  body += text(cx + (R / 2) * Math.cos(Math.PI / 5) + 6, cy + (R / 2) * Math.sin(Math.PI / 5) - 6, rLabel, { anchor: 'start', size: 14, weight: 'bold' });
  if (inner && innerLabel) {
    body += lineEl(cx, cy, cx - R * inner, cy, { stroke: INK });
    body += text(cx - (R * inner) / 2, cy - 8, innerLabel, { size: 14, weight: 'bold' });
  }
  return wrap(width, height, body);
};

/** Simple oblique sketches of solids with labelled dimensions. kind: cuboid | cube | cylinder | cone | sphere | hemisphere | frustum. */
export const solid = ({ kind, labels = {}, width = 460, height = 360 }) => {
  const cx = width / 2;
  let body = '';
  const label = (x, y, value, anchor = 'middle') => (value ? text(x, y, value, { anchor, size: 14, weight: 'bold' }) : '');
  const fill = '#dbeafe';
  const stroke = PALETTE[0];
  if (kind === 'cuboid' || kind === 'cube') {
    const w = kind === 'cube' ? 170 : 220;
    const h = kind === 'cube' ? 170 : 140;
    const d = kind === 'cube' ? 80 : 70;
    const x = cx - (w + d) / 2;
    const y = height - 60 - h;
    body += polygon([[x, y], [x + w, y], [x + w, y + h], [x, y + h]], { fill, stroke });
    body += polygon([[x, y], [x + d, y - d * 0.6], [x + w + d, y - d * 0.6], [x + w, y]], { fill: '#bfdbfe', stroke });
    body += polygon([[x + w, y], [x + w + d, y - d * 0.6], [x + w + d, y + h - d * 0.6], [x + w, y + h]], { fill: '#93c5fd', stroke });
    body += label(x + w / 2, y + h + 24, labels.l ?? labels.a);
    body += label(x - 10, y + h / 2, labels.h ?? (kind === 'cube' ? '' : ''), 'end');
    body += label(x + w + d / 2 + 14, y + h - d * 0.3 + 10, labels.b, 'start');
  } else if (kind === 'cylinder' || kind === 'cone' || kind === 'frustum') {
    const R = 100;
    const rTop = kind === 'cone' ? 0 : kind === 'frustum' ? 55 : R;
    const top = 70;
    const bottom = height - 70;
    body += `<ellipse cx="${cx}" cy="${bottom}" rx="${R}" ry="24" fill="${fill}" stroke="${stroke}" stroke-width="2"/>`;
    body += polygon([[cx - R, bottom], [cx - rTop, top], [cx + rTop, top], [cx + R, bottom]], { fill, stroke });
    body += `<path d="M ${cx - R} ${bottom} A ${R} 24 0 0 0 ${cx + R} ${bottom}" fill="${fill}" stroke="${stroke}" stroke-width="2"/>`;
    if (rTop) body += `<ellipse cx="${cx}" cy="${top}" rx="${rTop}" ry="${r2(rTop * 0.24)}" fill="#bfdbfe" stroke="${stroke}" stroke-width="2"/>`;
    body += lineEl(cx, top, cx, bottom, { stroke: MUTED, dash: '5 4' }) + lineEl(cx, bottom, cx + R, bottom, { stroke: INK });
    body += label(cx + R / 2, bottom + 40, labels.r);
    body += label(cx + 8, (top + bottom) / 2, labels.h, 'start');
    if (labels.l) body += label((cx + rTop + cx + R) / 2 + 24, (top + bottom) / 2, labels.l, 'start');
    if (kind === 'frustum' && labels.rTop) body += label(cx + rTop / 2, top - 16, labels.rTop);
  } else if (kind === 'sphere' || kind === 'hemisphere') {
    const R = 120;
    const cy = kind === 'sphere' ? height / 2 : height - 90;
    if (kind === 'sphere') body += `<circle cx="${cx}" cy="${cy}" r="${R}" fill="${fill}" stroke="${stroke}" stroke-width="2"/>`;
    else body += `<path d="M ${cx - R} ${cy} A ${R} ${R} 0 0 1 ${cx + R} ${cy} Z" fill="${fill}" stroke="${stroke}" stroke-width="2"/>`;
    body += `<ellipse cx="${cx}" cy="${cy}" rx="${R}" ry="26" fill="none" stroke="${stroke}" stroke-width="1.5" stroke-dasharray="5 4"/>`;
    body += lineEl(cx, cy, cx + R, cy, { stroke: INK }) + `<circle cx="${cx}" cy="${cy}" r="3" fill="${INK}"/>`;
    body += label(cx + R / 2, cy - 10, labels.r);
  }
  if (labels.title) body += text(cx, 26, labels.title, { size: 15, weight: 'bold' });
  return wrap(width, height, body);
};

// ---------------------------------------------------------------- clocks, tracks, sets

/** An analogue clock showing h:m (hands at exact angles), with an optional arc for the angle between hands. */
export const clock = ({ h, m, showAngle = true, label = '', size = 300 }) => {
  const c = size / 2;
  const R = size / 2 - 24;
  const minuteAngle = m * 6;
  const hourAngle = ((h % 12) * 30 + m * 0.5) % 360;
  const pt = (deg, len) => [c + len * Math.sin((deg * Math.PI) / 180), c - len * Math.cos((deg * Math.PI) / 180)];
  let body = `<circle cx="${c}" cy="${c}" r="${R}" fill="#ffffff" stroke="${INK}" stroke-width="3"/>`;
  for (let i = 0; i < 60; i += 1) {
    const [x1, y1] = pt(i * 6, R - (i % 5 === 0 ? 12 : 5));
    const [x2, y2] = pt(i * 6, R);
    body += lineEl(x1, y1, x2, y2, { stroke: i % 5 === 0 ? INK : MUTED, width: i % 5 === 0 ? 2 : 1 });
  }
  for (let n = 1; n <= 12; n += 1) {
    const [x, y] = pt(n * 30, R - 28);
    body += text(x, y + 5, n, { size: 15, weight: 'bold' });
  }
  if (showAngle) {
    let a1 = hourAngle;
    let a2 = minuteAngle;
    let diff = (a2 - a1 + 360) % 360;
    if (diff > 180) {
      [a1, a2] = [a2, a1];
      diff = 360 - diff;
    }
    if (diff > 0.5) {
      const rr = R * 0.32;
      const [sx, sy] = pt(a1, rr);
      const [ex, ey] = pt(a1 + diff, rr);
      body += `<path d="M ${c} ${c} L ${r2(sx)} ${r2(sy)} A ${rr} ${rr} 0 0 1 ${r2(ex)} ${r2(ey)} Z" fill="#fde68a" opacity="0.8"/>`;
    }
  }
  const [hx, hy] = pt(hourAngle, R * 0.5);
  const [mx, my] = pt(minuteAngle, R * 0.78);
  body += lineEl(c, c, hx, hy, { stroke: INK, width: 6 }) + lineEl(c, c, mx, my, { stroke: PALETTE[0], width: 4 });
  body += `<circle cx="${c}" cy="${c}" r="6" fill="${INK}"/>`;
  const height = label ? size + 30 : size;
  if (label) body += text(c, size + 18, label, { size: 14, weight: 'bold' });
  return wrap(size, height, body);
};

/**
 * A straight track with labelled points and moving objects. `points` = [[label, position]], with
 * positions in any unit spanning `length`; `movers` = [{ label, at, direction: 1 | -1, speedLabel, color, long }].
 * `long` draws a train (a bar of that length in track units); `brackets` = [[from, to, label]] marks spans.
 */
export const track = ({ length, points = [], movers = [], brackets = [], title = '', width = 680, height = 220 }) => {
  const left = 40;
  const right = width - 40;
  const y = height / 2 + (title ? 16 : 0);
  const sx = (p) => left + ((right - left) * p) / length;
  let body = title ? text(width / 2, 26, title, { size: 15, weight: 'bold' }) : '';
  body += lineEl(left, y, right, y, { stroke: INK, width: 3 });
  points.forEach(([label, p]) => {
    body += lineEl(sx(p), y - 8, sx(p), y + 8, { stroke: INK, width: 2 });
    body += text(sx(p), y + 28, label, { size: 13, weight: 'bold' });
  });
  movers.forEach(({ label, at, direction = 1, speedLabel = '', color = PALETTE[0], long = 0 }, index) => {
    const yy = y - 26 - index * 30;
    const x0 = sx(at);
    if (long) body += `<rect x="${r2(Math.min(x0, sx(at - direction * long)))}" y="${yy - 9}" width="${r2(Math.abs(sx(at) - sx(at - direction * long)))}" height="18" rx="4" fill="${color}"/>`;
    else body += `<circle cx="${r2(x0)}" cy="${yy}" r="8" fill="${color}"/>`;
    const tip = x0 + direction * 46;
    body += lineEl(x0 + direction * 10, yy, tip, yy, { stroke: color, width: 2.5 });
    body += `<path d="M ${r2(tip)} ${yy} L ${r2(tip - direction * 9)} ${yy - 6} L ${r2(tip - direction * 9)} ${yy + 6} Z" fill="${color}"/>`;
    body += text(tip + direction * 8, yy + 5, `${label}${speedLabel ? ` · ${speedLabel}` : ''}`, { anchor: direction > 0 ? 'start' : 'end', size: 13, fill: color, weight: 'bold' });
  });
  brackets.forEach(([from, to, label], index) => {
    const by = y + 48 + index * 26;
    body += lineEl(sx(from), by, sx(to), by, { stroke: MUTED }) + lineEl(sx(from), by - 5, sx(from), by + 5, { stroke: MUTED }) + lineEl(sx(to), by - 5, sx(to), by + 5, { stroke: MUTED });
    body += text((sx(from) + sx(to)) / 2, by - 6, label, { size: 12, fill: MUTED, weight: 'bold' });
  });
  return wrap(width, height + brackets.length * 26, body);
};

/** Two- or three-set Venn diagram; `regions` maps region keys to labels: 'A', 'B', 'AB' (and 'C', 'AC', 'BC', 'ABC'); `outside` label. */
export const venn = ({ sets, regions = {}, outside = '', title = '', width = 520, height = 380 }) => {
  const three = sets.length === 3;
  const cy = three ? 175 : 190;
  const centres = three
    ? [[200, 150], [320, 150], [260, 250]]
    : [[205, cy], [315, cy]];
  const R = three ? 105 : 120;
  let body = title ? text(width / 2, 26, title, { size: 15, weight: 'bold' }) : '';
  body += `<rect x="20" y="${title ? 40 : 14}" width="${width - 40}" height="${height - (title ? 54 : 28)}" fill="none" stroke="${MUTED}" stroke-width="1.5"/>`;
  centres.forEach(([x, y], i) => {
    body += `<circle cx="${x}" cy="${y}" r="${R}" fill="${PALETTE[i]}" fill-opacity="0.18" stroke="${PALETTE[i]}" stroke-width="2"/>`;
  });
  const names = three ? [[120, 60], [400, 60], [260, 372]] : [[110, 70], [410, 70]];
  sets.forEach((name, i) => (body += text(names[i][0], names[i][1], name, { size: 14, weight: 'bold', fill: PALETTE[i] })));
  const spots = three
    ? { A: [160, 130], B: [360, 130], C: [260, 300], AB: [260, 115], AC: [205, 225], BC: [315, 225], ABC: [260, 185] }
    : { A: [150, cy + 5], B: [370, cy + 5], AB: [260, cy + 5] };
  Object.entries(regions).forEach(([key, value]) => {
    if (spots[key]) body += text(spots[key][0], spots[key][1], value, { size: 14, weight: 'bold' });
  });
  if (outside) body += text(width - 40, height - 24, outside, { anchor: 'end', size: 13, weight: 'bold', fill: MUTED });
  return wrap(width, height, body);
};

/** A flow of labelled boxes joined by arrows, left to right, with optional labels on the arrows. */
export const flow = (steps, { arrows = [], title = '', width = 680, height = 160 } = {}) => {
  const top = title ? 50 : 30;
  const boxW = Math.min(150, (width - 40 - (steps.length - 1) * 50) / steps.length);
  const gap = (width - 40 - boxW * steps.length) / Math.max(1, steps.length - 1);
  let body = title ? text(width / 2, 26, title, { size: 15, weight: 'bold' }) : '';
  steps.forEach((step, i) => {
    const x = 20 + i * (boxW + gap);
    const lines = String(step).split('\n');
    body += `<rect x="${r2(x)}" y="${top}" width="${r2(boxW)}" height="70" rx="8" fill="#dbeafe" stroke="${PALETTE[0]}" stroke-width="2"/>`;
    lines.forEach((l, li) => (body += text(x + boxW / 2, top + 36 - (lines.length - 1) * 9 + li * 18, l, { size: 13, weight: li === 0 ? 'bold' : 'normal' })));
    if (i < steps.length - 1) {
      const ax = x + boxW + 4;
      const bx = x + boxW + gap - 4;
      body += lineEl(ax, top + 35, bx - 8, top + 35, { stroke: INK, width: 2 });
      body += `<path d="M ${r2(bx)} ${top + 35} L ${r2(bx - 10)} ${top + 29} L ${r2(bx - 10)} ${top + 41} Z" fill="${INK}"/>`;
      if (arrows[i]) body += text((ax + bx) / 2, top + 26, arrows[i], { size: 12, fill: PALETTE[4], weight: 'bold' });
    }
  });
  return wrap(width, height, body);
};

/** The alligation cross: two prices, the mean in the middle, the differences as the ratio. */
export const alligation = ({ cheap, dear, mean, cheapLabel = 'Cheaper', dearLabel = 'Dearer', unit = '', width = 520, height = 300 }) => {
  const box = (x, y, top, value) =>
    `<rect x="${x - 70}" y="${y - 28}" width="140" height="56" rx="8" fill="#dbeafe" stroke="${PALETTE[0]}" stroke-width="2"/>` +
    text(x, y - 6, top, { size: 12, fill: MUTED }) +
    text(x, y + 14, `${fmt(value)}${unit}`, { size: 15, weight: 'bold' });
  let body = lineEl(170, 88, 360, 220, { stroke: MUTED, dash: '5 4' }) + lineEl(350, 88, 160, 220, { stroke: MUTED, dash: '5 4' });
  body += box(120, 60, cheapLabel, cheap) + box(400, 60, dearLabel, dear);
  body += `<rect x="190" y="122" width="140" height="56" rx="8" fill="#fef3c7" stroke="${PALETTE[6]}" stroke-width="2"/>`;
  body += text(260, 144, 'Mean', { size: 12, fill: MUTED }) + text(260, 164, `${fmt(mean)}${unit}`, { size: 15, weight: 'bold' });
  body += `<rect x="50" y="222" width="140" height="56" rx="8" fill="#dcfce7" stroke="${PALETTE[2]}" stroke-width="2"/>`;
  body += text(120, 244, `${dearLabel} − Mean`, { size: 12, fill: MUTED }) + text(120, 264, fmt(r2(dear - mean)), { size: 15, weight: 'bold' });
  body += `<rect x="330" y="222" width="140" height="56" rx="8" fill="#dcfce7" stroke="${PALETTE[2]}" stroke-width="2"/>`;
  body += text(400, 244, `Mean − ${cheapLabel}`, { size: 12, fill: MUTED }) + text(400, 264, fmt(r2(mean - cheap)), { size: 15, weight: 'bold' });
  return wrap(width, height, body);
};

/** Points on a circle (round table / circular arrangement) with labels. */
export const roundTable = ({ labels, title = '', size = 360 }) => {
  const c = size / 2;
  const R = size / 2 - 60;
  let body = title ? text(c, 24, title, { size: 15, weight: 'bold' }) : '';
  body += `<circle cx="${c}" cy="${c + 6}" r="${R - 20}" fill="#fef3c7" stroke="${PALETTE[6]}" stroke-width="2"/>`;
  labels.forEach((label, i) => {
    const a = -Math.PI / 2 + (i * 2 * Math.PI) / labels.length;
    const x = c + R * Math.cos(a);
    const y = c + 6 + R * Math.sin(a);
    body += `<circle cx="${r2(x)}" cy="${r2(y)}" r="20" fill="#dbeafe" stroke="${PALETTE[0]}" stroke-width="2"/>`;
    body += text(x, y + 5, label, { size: 13, weight: 'bold' });
  });
  return wrap(size, size + 10, body);
};

/** A grid (e.g. the 36 outcomes of two dice), highlighting cells where `mark(row, col)` is true. */
export const grid = ({ rows, cols, cell = (r, c) => `${r},${c}`, mark = () => false, rowTitle = '', colTitle = '', title = '', cellSize = 46 }) => {
  const left = 70;
  const top = title ? 70 : 50;
  const width = left + cols.length * cellSize + 20;
  const height = top + rows.length * cellSize + 20;
  let body = title ? text(width / 2, 24, title, { size: 15, weight: 'bold' }) : '';
  if (colTitle) body += text(left + (cols.length * cellSize) / 2, top - 30, colTitle, { size: 12, fill: MUTED });
  if (rowTitle) body += text(18, top + (rows.length * cellSize) / 2, rowTitle, { size: 12, fill: MUTED, rotate: -90 });
  cols.forEach((c, ci) => (body += text(left + ci * cellSize + cellSize / 2, top - 10, c, { size: 13, weight: 'bold' })));
  rows.forEach((r, ri) => {
    body += text(left - 14, top + ri * cellSize + cellSize / 2 + 5, r, { size: 13, weight: 'bold' });
    cols.forEach((c, ci) => {
      const on = mark(r, c);
      body += `<rect x="${left + ci * cellSize}" y="${top + ri * cellSize}" width="${cellSize}" height="${cellSize}" fill="${on ? '#bbf7d0' : '#ffffff'}" stroke="${GRID}"/>`;
      body += text(left + ci * cellSize + cellSize / 2, top + ri * cellSize + cellSize / 2 + 4, cell(r, c), { size: 11, fill: on ? '#166534' : MUTED, weight: on ? 'bold' : 'normal' });
    });
  });
  return wrap(width, height, body);
};

/** A labelled horizontal timeline, e.g. present worth growing to the sum due. `marks` = [[position 0..1, top label, bottom label]]. */
export const timeline = ({ marks, spans = [], title = '', width = 640, height = 170 }) => {
  const left = 50;
  const right = width - 50;
  const y = title ? 90 : 70;
  const sx = (p) => left + (right - left) * p;
  let body = title ? text(width / 2, 26, title, { size: 15, weight: 'bold' }) : '';
  body += lineEl(left, y, right, y, { stroke: INK, width: 3 });
  marks.forEach(([p, top, bottom]) => {
    body += `<circle cx="${r2(sx(p))}" cy="${y}" r="6" fill="${PALETTE[0]}"/>`;
    // Labels at the ends hang inwards, so they are never cut off by the edge.
    const anchor = p <= 0.1 ? 'start' : p >= 0.9 ? 'end' : 'middle';
    const lx = anchor === 'start' ? sx(p) - 8 : anchor === 'end' ? sx(p) + 8 : sx(p);
    if (top) body += text(lx, y - 16, top, { size: 13, weight: 'bold', anchor });
    if (bottom) body += text(lx, y + 26, bottom, { size: 12, fill: MUTED, anchor });
  });
  spans.forEach(([from, to, label]) => {
    body += `<path d="M ${r2(sx(from))} ${y - 34} Q ${r2((sx(from) + sx(to)) / 2)} ${y - 70} ${r2(sx(to))} ${y - 34}" fill="none" stroke="${PALETTE[1]}" stroke-width="2"/>`;
    body += text((sx(from) + sx(to)) / 2, y - 58, label, { size: 12, fill: PALETTE[1], weight: 'bold' });
  });
  return wrap(width, height, body);
};

/** A tank with inlet and outlet pipes, labels for each pipe's time. */
export const tank = ({ inlets = [], outlets = [], title = '', width = 520, height = 320 }) => {
  let body = title ? text(width / 2, 26, title, { size: 15, weight: 'bold' }) : '';
  body += `<rect x="170" y="70" width="180" height="200" fill="#ffffff" stroke="${INK}" stroke-width="3"/>`;
  body += `<rect x="172" y="170" width="176" height="98" fill="#bfdbfe"/>`;
  inlets.forEach((label, i) => {
    const y = 90 + i * 40;
    body += `<rect x="40" y="${y}" width="130" height="14" fill="${PALETTE[2]}"/>` + text(100, y - 6, label, { size: 13, weight: 'bold', fill: PALETTE[2] });
  });
  outlets.forEach((label, i) => {
    const y = 240 - i * 40;
    body += `<rect x="350" y="${y}" width="130" height="14" fill="${PALETTE[4]}"/>` + text(415, y - 6, label, { size: 13, weight: 'bold', fill: PALETTE[4] });
  });
  return wrap(width, height, body);
};

/** Two growth curves over years, e.g. simple versus compound interest; values per year are given. */
export const growth = (years, series, opts = {}) => line(years, series, opts);

/** `figure(ref, alt, svg, caption)` → the figure entry a day file lists. */
export const figure = (ref, alt, svg, caption = '') => ({ ref, alt, caption, svg });
