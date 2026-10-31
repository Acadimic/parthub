/**
 * The languages a code block can name, in the order an author picks from. `value` is the fence name
 * (```python) and the highlight.js language; `text` is a program's output and is never coloured.
 */
export const CODE_LANGUAGES = [
  { value: 'python', label: 'Python' },
  { value: 'python-repl', label: 'Python shell' },
  { value: 'text', label: 'Output' },
  { value: 'javascript', label: 'JavaScript' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'java', label: 'Java' },
  { value: 'c', label: 'C' },
  { value: 'cpp', label: 'C++' },
  { value: 'sql', label: 'SQL' },
  { value: 'bash', label: 'Shell' },
  { value: 'html', label: 'HTML' },
  { value: 'css', label: 'CSS' },
  { value: 'json', label: 'JSON' },
] as const;

/** Names an AI reply or a pasted fence may use for the same languages. */
const ALIASES: Record<string, string> = {
  py: 'Python',
  js: 'JavaScript',
  ts: 'TypeScript',
  sh: 'Shell',
  shell: 'Shell',
  xml: 'HTML',
  output: 'Output',
};

/** The label shown above a block; a language outside the list shows as written, none as "Code". */
export const codeLanguageLabel = (language: string): string =>
  CODE_LANGUAGES.find((item) => item.value === language)?.label ?? ALIASES[language] ?? (language || 'Code');
