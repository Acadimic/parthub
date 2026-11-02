import type { IRunResult } from './run-result';

/** Long enough for timers in a lesson program, short enough to stop a forgotten setInterval. */
const TIME_LIMIT_MS = 6_000;

/**
 * Runs inside the sandboxed frame before the learner's code. console.log prints values the way Node
 * does (`[ 1, 2, 3 ]`, `{ name: 'Asha' }`, `Map(1) { 'a' => 1 }`), because every output in the
 * course was checked with Node; prompt() answers from the input box and echoes like a console; the
 * first uncaught error ends the run, as a crash would. Pending timers are counted so the frame can
 * say when the program has finished.
 */
const PRELUDE = String.raw`
const token = __TOKEN__;
const answers = __ANSWERS__;
const send = (type, text) => parent.postMessage({ token, type, text }, '*');
const isIdent = (key) => /^[A-Za-z_$][\w$]*$/.test(key);
const quote = (s) => "'" + String(s).replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, '\\n') + "'";
const inspect = (value, depth = 0, seen = new Set()) => {
  if (typeof value === 'string') return depth === 0 ? value : quote(value);
  if (typeof value === 'number') return Object.is(value, -0) ? '-0' : String(value);
  if (typeof value === 'bigint') return value + 'n';
  if (typeof value === 'symbol' || typeof value === 'boolean' || value == null) return String(value);
  if (typeof value === 'function') {
    if (/^class\b/.test(Function.prototype.toString.call(value))) return '[class ' + (value.name || '(anonymous)') + ']';
    return value.name ? '[Function: ' + value.name + ']' : '[Function (anonymous)]';
  }
  if (seen.has(value)) return '[Circular *1]';
  if (value instanceof Error) return value.name + ': ' + value.message;
  if (value instanceof Date) return value.toISOString();
  if (value instanceof RegExp) return String(value);
  if (value instanceof Promise) return 'Promise { <pending> }';
  const next = new Set(seen).add(value);
  const show = (v) => inspect(v, depth + 1, next);
  const list = (open, items, close, prefix = '') => {
    if (!items.length) return prefix + open + close;
    const line = prefix + open + ' ' + items.join(', ') + ' ' + close;
    if (line.length <= 72 && !line.includes('\n')) return line;
    const pad = '  '.repeat(depth + 1);
    return prefix + open + '\n' + items.map((i) => pad + i).join(',\n') + '\n' + '  '.repeat(depth) + close;
  };
  if (Array.isArray(value)) {
    if (depth > 2) return '[Array]';
    const items = [];
    for (let i = 0; i < value.length; i++) items.push(i in value ? show(value[i]) : '<1 empty item>');
    return list('[', items, ']');
  }
  if (value instanceof Map) {
    if (depth > 2) return '[Map]';
    return list('{', [...value].map(([k, v]) => show(k) + ' => ' + show(v)), '}', 'Map(' + value.size + ') ');
  }
  if (value instanceof Set) {
    if (depth > 2) return '[Set]';
    return list('{', [...value].map(show), '}', 'Set(' + value.size + ') ');
  }
  const proto = Object.getPrototypeOf(value);
  const name = proto === null ? '[Object: null prototype]' : proto.constructor && proto.constructor !== Object ? proto.constructor.name : '';
  if (depth > 2) return name ? '[' + name + ']' : '[Object]';
  const items = Object.keys(value).map((k) => (isIdent(k) ? k : quote(k)) + ': ' + show(value[k]));
  return list('{', items, '}', name ? name + ' ' : '');
};
const log = (...args) => send('out', args.map((a) => inspect(a)).join(' '));
console.log = console.info = console.warn = console.error = console.debug = log;
window.prompt = (question = '') => {
  if (!answers.length) throw new Error('prompt() needs a value: type it in the Input box under the code');
  const answer = answers.shift();
  send('out', question + answer);
  return answer;
};
let pending = 0;
const timers = new Set();
const realSetTimeout = window.setTimeout.bind(window);
const realClearTimeout = window.clearTimeout.bind(window);
const realSetInterval = window.setInterval.bind(window);
const realClearInterval = window.clearInterval.bind(window);
// Node refuses a timer whose callback is not a function (setTimeout(ring(), 50)); browsers ignore it.
// The course teaches the Node error, so the frame raises it too.
const needFunction = (fn) => {
  if (typeof fn !== 'function') {
    const error = new TypeError('The "callback" argument must be of type function. Received ' + (fn === undefined ? 'undefined' : inspect(fn, 1)));
    throw error;
  }
};
window.setTimeout = (fn, ms, ...rest) => {
  needFunction(fn);
  const id = realSetTimeout(() => { if (timers.delete(id)) pending--; typeof fn === 'function' && fn(...rest); }, ms);
  timers.add(id); pending++;
  return id;
};
window.clearTimeout = (id) => { if (timers.delete(id)) pending--; realClearTimeout(id); };
window.setInterval = (fn, ms, ...rest) => { needFunction(fn); const id = realSetInterval(fn, ms, ...rest); timers.add(id); pending++; return id; };
window.clearInterval = (id) => { if (timers.delete(id)) pending--; realClearInterval(id); };
let finished = false;
const finish = () => { if (!finished) { finished = true; send('done', ''); } };
const fail = (error) => {
  if (finished) return;
  send('error', error instanceof Error ? error.name + ': ' + error.message : 'Uncaught ' + inspect(error, 1));
  finish();
};
window.addEventListener('error', (event) => { event.preventDefault(); fail(event.error ?? new Error(String(event.message).replace(/^Uncaught /, ''))); });
window.addEventListener('unhandledrejection', (event) => { event.preventDefault(); fail(event.reason); });
window.__watch = () => {
  const check = () => (finished ? null : pending === 0 ? finish() : realSetTimeout(check, 25));
  realSetTimeout(check, 0);
};
`;

/** Code with import or export needs its module files, which a lesson shows as separate blocks. */
export const isRunnableJavaScript = (code: string) => !/^\s*(import\s|export\s)/m.test(code);

/** A closing script tag inside the learner's code would end the script element early. */
const safeScript = (code: string) => code.replace(/<\/script/gi, '<\\/script');

/**
 * Runs a JavaScript program in a sandboxed frame (scripts only: no same-origin access, so it cannot
 * touch the app, its storage or the learner's session). Nothing is downloaded. The frame is removed
 * when the program finishes, crashes, is stopped or runs past the time limit.
 */
export const runJavaScript = (
  code: string,
  stdin: string[],
  register: (stop: () => void) => void,
): Promise<IRunResult> =>
  new Promise((resolve) => {
    const token = Math.random().toString(36).slice(2);
    const frame = document.createElement('iframe');
    frame.setAttribute('sandbox', 'allow-scripts');
    frame.setAttribute('aria-hidden', 'true');
    frame.style.display = 'none';
    const lines: string[] = [];
    let error: string | null = null;
    let timer = 0;
    const end = (isStopped: boolean) => {
      window.clearTimeout(timer);
      window.removeEventListener('message', onMessage);
      frame.remove();
      resolve({ stdout: lines.join('\n'), error, isStopped });
    };
    const onMessage = (event: MessageEvent<{ token?: string; type?: string; text?: string }>) => {
      if (event.source !== frame.contentWindow || event.data?.token !== token) return;
      if (event.data.type === 'out') lines.push(event.data.text ?? '');
      else if (event.data.type === 'error') error = event.data.text ?? null;
      else if (event.data.type === 'done') end(false);
    };
    window.addEventListener('message', onMessage);
    const prelude = PRELUDE.replace('__TOKEN__', JSON.stringify(token)).replace('__ANSWERS__', JSON.stringify(stdin));
    frame.srcdoc = `<!doctype html><html><body><script>${safeScript(prelude)}</script><script>${safeScript(code)}</script><script>window.__watch()</script></body></html>`;
    document.body.appendChild(frame);
    timer = window.setTimeout(() => end(true), TIME_LIMIT_MS);
    register(() => end(true));
  });
