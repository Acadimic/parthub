/**
 * Standard-library modules a Run can import. Any other import is a module from another block of
 * the lesson (`import shop`), which the browser does not have.
 */
const PYTHON_MODULES = new Set([
  'abc',
  'array',
  'base64',
  'bisect',
  'calendar',
  'collections',
  'contextlib',
  'copy',
  'csv',
  'dataclasses',
  'datetime',
  'decimal',
  'doctest',
  'email',
  'enum',
  'fractions',
  'functools',
  'hashlib',
  'heapq',
  'inspect',
  'io',
  'itertools',
  'json',
  'math',
  'numbers',
  'operator',
  'os',
  'pathlib',
  'pprint',
  're',
  'random',
  'statistics',
  'string',
  'sys',
  'textwrap',
  'time',
  'timeit',
  'traceback',
  'types',
  'typing',
  'unittest',
  'uuid',
]);

const importsOtherCode = (code: string) =>
  [...code.matchAll(/^\s*(?:from|import)\s+([A-Za-z_]\w*)/gm)].some(([, name]) => !PYTHON_MODULES.has(name));

/** Reads a file without writing one first: the lesson's file exists on the learner's computer, not in the browser. */
const readsMissingFile = (code: string) => {
  const reads = /\bopen\(|\.read_text\(|\.read_bytes\(|\.exists\(|\.is_file\(|\.is_dir\(|\.glob\(|\.iterdir\(/.test(
    code,
  );
  const writes = /\bopen\([^)]*["'][wax]b?\+?["']|\.write_text\(|\.write_bytes\(|\.mkdir\(|\.touch\(/.test(code);
  return reads && !writes;
};

/** DOM code needs the lesson's page, which a Run does not have. */
const usesPage = (code: string) => /\bdocument\b|\bwindow\.|addEventListener|querySelector/.test(code);

/**
 * Whether a code block can run in the browser and show what the lesson shows. Off for a fill-the-gap
 * exercise (____), JavaScript modules, DOM code, and Python that imports another block or reads a
 * file it did not write.
 */
export const isRunnable = (language: string, code: string) => {
  if (code.includes('____')) return false;
  if (language === 'python') return !importsOtherCode(code) && !readsMissingFile(code);
  if (language === 'javascript') return !/^\s*(import\s|export\s)/m.test(code) && !usesPage(code);
  return false;
};
