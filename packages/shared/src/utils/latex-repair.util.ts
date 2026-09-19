/**
 * Repairs for LaTeX that travelled through JSON with single backslashes.
 *
 * A model that writes `"$\frac{a}{b}$"` inside a JSON string has written a form-feed escape, not
 * `\frac`: `JSON.parse` turns `\f` into U+000C and the equation arrives as `<FF>rac{a}{b}`. The
 * same happens to `\times` (tab), `\ne` (newline), `\beta` (backspace) and `\rho` (carriage
 * return); every other command (`\pi`, `\div`, `\sqrt`) is an *invalid* escape and makes the
 * whole reply unparseable. Both halves are handled here: the raw text is repaired before it is
 * parsed, and anything that still slipped through is repaired inside the equation afterwards.
 */

/** LaTeX commands whose first letter is also a JSON escape letter, grouped by that letter. */
export const LATEX_COMMANDS_BY_ESCAPE: Record<'b' | 'f' | 'n' | 'r' | 't', readonly string[]> = {
  b: [
    'beta',
    'bar',
    'begin',
    'binom',
    'boxed',
    'bullet',
    'bigcap',
    'bigcup',
    'bigg',
    'big',
    'bmod',
    'bf',
    'backslash',
    'because',
    'bot',
    'brace',
    'brack',
    'breve',
    'bigoplus',
    'bigotimes',
    'bigvee',
    'bigwedge',
    'bowtie',
    'bullet',
  ],
  f: ['frac', 'forall', 'flat', 'fbox', 'footnotesize'],
  n: [
    'ne',
    'neq',
    'nabla',
    'nu',
    'not',
    'notin',
    'neg',
    'newline',
    'nmid',
    'nparallel',
    'nsubseteq',
    'nsupseteq',
    'nleq',
    'ngeq',
    'nless',
    'ngtr',
    'natural',
    'ncong',
    'nexists',
    'nrightarrow',
    'nleftarrow',
    'nsim',
    'nvdash',
    'nolimits',
    'normalsize',
  ],
  r: [
    'rho',
    'right',
    'rangle',
    'rightarrow',
    'rm',
    'rfloor',
    'rceil',
    'rbrace',
    'rbrack',
    'rvert',
    'rVert',
    'ref',
    'rule',
    'raisebox',
    'rightleftharpoons',
    'rightharpoonup',
    'rightharpoondown',
  ],
  t: [
    'times',
    'text',
    'textbf',
    'textit',
    'textrm',
    'textsf',
    'texttt',
    'textcolor',
    'textnormal',
    'tan',
    'tau',
    'theta',
    'therefore',
    'to',
    'tilde',
    'top',
    'triangle',
    'tfrac',
    'tanh',
    'tbinom',
    'triangleleft',
    'triangleright',
    'tt',
    'tiny',
    'thinspace',
    'twoheadrightarrow',
  ],
};

const CONTROL_TO_LETTER: Record<string, 'b' | 'f' | 'n' | 'r' | 't'> = {
  '\b': 'b',
  '\f': 'f',
  '\n': 'n',
  '\r': 'r',
  '\t': 't',
};

const isCommand = (letter: 'b' | 'f' | 'n' | 'r' | 't', rest: string): boolean =>
  LATEX_COMMANDS_BY_ESCAPE[letter].includes(`${letter}${rest}`);

/**
 * Puts the backslash back on a command that `JSON.parse` turned into a control character.
 *
 * `<TAB>imes2` becomes `\times2`; a tab followed by "he" stays a tab, because `\the` is not a
 * command in the table. The letter run after the control character must be a whole command, so a
 * newline before the word "even" is never read as `\ne` + "ven".
 */
export const repairLatexControlEscapes = (value: string): string =>
  value.replace(/[\b\f\n\r\t]([a-zA-Z]+)/g, (match, letters: string) => {
    const letter = CONTROL_TO_LETTER[match[0]];
    // The whole run, then shorter prefixes: `<TAB>imes2` has run "imes", `<LF>e0` has run "e".
    for (let length = letters.length; length >= 1; length -= 1) {
      const rest = letters.slice(0, length);
      if (isCommand(letter, rest) && !/[a-zA-Z]/.test(letters.slice(length, length + 1))) {
        return `\\${letter}${rest}${letters.slice(length)}`;
      }
    }
    return match;
  });

/** `20%` in LaTeX is `20` and a comment; the author meant `20\%`. */
export const escapeLatexPercent = (value: string): string => value.replace(/(^|[^\\])%/g, '$1\\%');

/**
 * Commands that lost their first letter *and* the control character that replaced it.
 *
 * An equation that began `\\frac{a}{b}` arrived as `<FF>rac{a}{b}`, and an importer that trimmed
 * the equation threw the form feed away with the whitespace, leaving `rac{a}{b}`. Only the start
 * of an equation is affected, so only a leading run is checked, and only against commands whose
 * first letter is a JSON escape letter; the run must be followed by `{`, a digit, a space or a
 * backslash so a variable called `an` is left alone.
 */
const HEADLESS_COMMANDS: Record<string, string> = Object.values(LATEX_COMMANDS_BY_ESCAPE)
  .reduce<string[]>((all, commands) => all.concat(commands), [])
  .filter((command) => command.length >= 3)
  .reduce<Record<string, string>>((map, command) => ({ ...map, [command.slice(1)]: command }), {});

export const repairLeadingLostEscape = (value: string): string => {
  const match = /^\s*([a-zA-Z]+)(?=[{\d\s\\]|$)/.exec(value);
  const command = match ? HEADLESS_COMMANDS[match[1]] : undefined;
  return command ? value.replace(match?.[1] ?? '', `\\${command}`) : value;
};

/** A `$` inside an equation is a price, and KaTeX refuses a bare one; `\\$` renders as `$`. */
export const escapeLatexDollar = (value: string): string => value.replace(/(^|[^\\])\$/g, '$1\\$');

/** The LaTeX an equation node should store: escapes restored, percent and dollar escaped, trimmed. */
export const normaliseLatex = (value: string): string =>
  escapeLatexDollar(escapeLatexPercent(repairLeadingLostEscape(repairLatexControlEscapes(value)))).trim();

/**
 * Repairs a JSON reply's string escapes before it is parsed.
 *
 * Inside string literals only. A backslash before a character that is not a JSON escape (`\pi`,
 * `\div`, `\(`, `\%`, `\$`, `\{`) is doubled, because as written the JSON would not parse at all.
 * A backslash before `b`, `f`, `n`, `r` or `t` is doubled only when the letters that follow spell
 * a LaTeX command from the table, so a real `\n` line break stays a line break. `\u` is left alone
 * when four hex digits follow, and doubled otherwise (`\underline`).
 */
/** What one backslash inside a JSON string should become: the text to emit, how far to skip, whether it was a repair. */
const resolveEscape = (next: string, after: string): { text: string; skip: number; repaired: boolean } => {
  if (next === '\\') return { text: '\\\\', skip: 1, repaired: false };
  if (next === '"' || next === '/') return { text: `\\${next}`, skip: 1, repaired: false };
  if (next === 'u') {
    const isUnicode = /^[0-9a-fA-F]{4}/.test(after);
    return { text: isUnicode ? '\\u' : '\\\\u', skip: 1, repaired: !isUnicode };
  }
  if (next in LATEX_COMMANDS_BY_ESCAPE) {
    const letter = next as keyof typeof LATEX_COMMANDS_BY_ESCAPE;
    const letters = /^[a-zA-Z]*/.exec(after)?.[0] ?? '';
    const spellsCommand = [...Array(letters.length + 1).keys()].some(
      (length) => isCommand(letter, letters.slice(0, length)) && !/[a-zA-Z]/.test(letters.slice(length, length + 1)),
    );
    return { text: spellsCommand ? `\\\\${next}` : `\\${next}`, skip: 1, repaired: spellsCommand };
  }
  // Anything else after a backslash is not a JSON escape: the backslash was meant literally.
  return { text: '\\\\', skip: 0, repaired: true };
};

export const repairJsonEscapes = (text: string): { text: string; repairs: number } => {
  let out = '';
  let repairs = 0;
  let inString = false;
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    if (char === '"') inString = !inString;
    if (!inString || char !== '\\') {
      out += char;
      continue;
    }
    const resolved = resolveEscape(text[index + 1] ?? '', text.slice(index + 2));
    out += resolved.text;
    index += resolved.skip;
    if (resolved.repaired) repairs += 1;
  }
  return { text: out, repairs };
};
