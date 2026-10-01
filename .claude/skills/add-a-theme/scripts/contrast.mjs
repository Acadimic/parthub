#!/usr/bin/env node
/**
 * Audit a theme's contrast. Usage:
 *
 *   node .claude/skills/add-a-theme/scripts/contrast.mjs packages/ui/src/themes/light.ts
 *   node .claude/skills/add-a-theme/scripts/contrast.mjs packages/ui/src/themes/dark.ts
 *
 * Reads any file containing `name: '#hex'` (the TypeScript theme objects) or `--name: #hex;`
 * (a CSS custom-property block), so it keeps working if the palette moves into CSS.
 *
 * It checks the two things a palette gets wrong silently:
 *   - a `<role>` / `<role>-foreground` pair that is not legible (the pairing is the whole promise
 *     of the token system: `bg-primary text-primary-foreground` must be readable without the call
 *     site thinking about it);
 *   - two surfaces so close that the boundary between them disappears. Both dark backgrounds were
 *     once literally the same hex, which erased the edge between sidebar, canvas and hover.
 *
 * Exit code is 1 if anything fails, so it can gate a change.
 */
import { readFileSync } from 'node:fs';

const AA = 4.5; // WCAG AA for normal-sized text
const AA_LARGE = 3.0; // AA for >=18.66px bold or >=24px
const SURFACE_SEPARATION = 1.06; // below this two surfaces read as one flat sheet

const SURFACES = ['background', 'card', 'popover', 'muted', 'accent', 'secondary'];

const toRgb = (hex) => {
  let h = hex.replace('#', '').trim();
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
};

const luminance = (hex) => {
  const [r, g, b] = toRgb(hex).map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

export const contrast = (a, b) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

const parseTokens = (file) => {
  const text = readFileSync(file, 'utf8');
  const tokens = {};
  // `'muted-foreground': '#5b6a80',` and `background: '#ffffff',`
  for (const m of text.matchAll(/['"]?([a-z0-9-]+)['"]?\s*:\s*['"](#[0-9a-fA-F]{3,8})['"]/g)) tokens[m[1]] = m[2];
  // `--muted-foreground: #5b6a80;`
  for (const m of text.matchAll(/--([a-z0-9-]+)\s*:\s*(#[0-9a-fA-F]{3,8})\s*;/g)) tokens[m[1]] = m[2];
  return tokens;
};

const file = process.argv[2];
if (!file) {
  console.error('usage: contrast.mjs <theme file>');
  process.exit(2);
}

const tokens = parseTokens(file);
const names = Object.keys(tokens);
if (!names.length) {
  console.error(`no colours found in ${file} — expected \`name: '#hex'\` or \`--name: #hex;\``);
  process.exit(2);
}

let failures = 0;
const row = (ok, label, detail) => {
  if (!ok) failures++;
  console.log(`${ok ? '  ok  ' : ' FAIL '} ${label.padEnd(38)} ${detail}`);
};

console.log(`\n${file}  (${names.length} tokens)\n`);

console.log('role / foreground pairs');
for (const name of names) {
  if (name.endsWith('-foreground')) continue;
  const fg = tokens[`${name}-foreground`];
  if (!fg) continue;
  const r = contrast(tokens[name], fg);
  row(r >= AA, `bg-${name} + text-${name}-foreground`, `${r.toFixed(2)}  (need ${AA})`);
}

console.log('\ntext tokens on every surface');
const surfaces = SURFACES.filter((s) => tokens[s]);
for (const text of ['foreground', 'muted-foreground']) {
  if (!tokens[text]) continue;
  for (const s of surfaces) {
    const r = contrast(tokens[text], tokens[s]);
    row(r >= AA, `text-${text} on bg-${s}`, `${r.toFixed(2)}  (need ${AA})`);
  }
}

// `warning` is deliberately absent: it is a true yellow, legible only as a fill under its dark
// foreground (checked above), and nothing sets it as text.
console.log('\nstatus colours as text on the base surfaces');
for (const name of ['destructive', 'success', 'info', 'primary']) {
  if (!tokens[name]) continue;
  for (const s of ['background', 'muted'].filter((x) => tokens[x])) {
    const r = contrast(tokens[name], tokens[s]);
    row(r >= AA, `text-${name} on bg-${s}`, `${r.toFixed(2)}  (need ${AA})`);
  }
}

console.log('\nsurfaces must stay distinguishable');
for (let i = 0; i < surfaces.length; i++) {
  for (let j = i + 1; j < surfaces.length; j++) {
    const [a, b] = [surfaces[i], surfaces[j]];
    if (tokens[a] === tokens[b]) {
      // Deliberate aliases are common (light-mode `card` is usually the same white as
      // `background`). Report, but do not fail: only a *near* miss is the dangerous case.
      console.log(`  note  ${`bg-${a} == bg-${b}`.padEnd(38)} identical by design?`);
      continue;
    }
    const r = contrast(tokens[a], tokens[b]);
    if (r < SURFACE_SEPARATION) row(false, `bg-${a} vs bg-${b}`, `${r.toFixed(3)}  (need ${SURFACE_SEPARATION})`);
  }
}

console.log(`\n${failures === 0 ? 'PASS — no contrast failures' : `${failures} failure(s)`}\n`);
process.exit(failures === 0 ? 0 : 1);
