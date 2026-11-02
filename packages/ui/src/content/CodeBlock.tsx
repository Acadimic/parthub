import { CheckIcon, CopyIcon, TerminalWindowIcon } from '@phosphor-icons/react';
import hljs from 'highlight.js/lib/core';
import bash from 'highlight.js/lib/languages/bash';
import c from 'highlight.js/lib/languages/c';
import cpp from 'highlight.js/lib/languages/cpp';
import css from 'highlight.js/lib/languages/css';
import java from 'highlight.js/lib/languages/java';
import javascript from 'highlight.js/lib/languages/javascript';
import json from 'highlight.js/lib/languages/json';
import python from 'highlight.js/lib/languages/python';
import pythonRepl from 'highlight.js/lib/languages/python-repl';
import sql from 'highlight.js/lib/languages/sql';
import typescript from 'highlight.js/lib/languages/typescript';
import xml from 'highlight.js/lib/languages/xml';
import { type KeyboardEvent, useMemo, useRef, useState } from 'react';
import { useIsPrint } from '../contexts/print-context';
import { Button } from '../core/Button';
import { Tooltip } from '../core/Tooltip';
import { cn } from '../lib/cn';
import { Textarea } from '../ui/textarea';
import { codeLanguageLabel } from './code-languages';
import type { IRunResult } from './runner/run-result';
import { isRunnable, useCanRunCode } from './runner/run-context';
import { HEADER_BUTTON, RunButtons, RunInput, RunResult, type RunStatus } from './runner/RunPanel';

// Only the languages a course teaches are registered: the full highlight.js bundle is ~1 MB.
const LANGUAGES = {
  bash,
  c,
  cpp,
  css,
  java,
  javascript,
  json,
  python,
  'python-repl': pythonRepl,
  sql,
  typescript,
  xml,
};
Object.entries(LANGUAGES).forEach(([name, language]) => hljs.registerLanguage(name, language));

/**
 * highlight.js token classes on the code palette (light.ts / dark.ts, measured against `code`). In an
 * arbitrary variant Tailwind reads `_` as a space, so `built_in` and `class_` are escaped as `\_`, inside
 * String.raw so the source Tailwind scans and the class the browser gets carry the same single backslash.
 */
const TOKEN_CLASSES = [
  '[&_.hljs-keyword]:text-code-keyword [&_.hljs-name]:text-code-keyword [&_.hljs-selector-tag]:text-code-keyword',
  '[&_.hljs-string]:text-code-string [&_.hljs-regexp]:text-code-string [&_.hljs-subst]:text-code-foreground',
  '[&_.hljs-number]:text-code-number [&_.hljs-literal]:text-code-number [&_.hljs-attr]:text-code-number',
  String.raw`[&_.hljs-title]:text-code-function [&_.hljs-built\_in]:text-code-builtin [&_.hljs-attribute]:text-code-builtin`,
  String.raw`[&_.hljs-type]:text-code-type [&_.hljs-title.class\_]:text-code-type [&_.hljs-selector-class]:text-code-type`,
  '[&_.hljs-meta]:text-code-meta [&_.hljs-tag]:text-code-meta [&_.hljs-symbol]:text-code-meta',
  '[&_.hljs-comment]:italic [&_.hljs-comment]:text-code-comment',
].join(' ');

/** Short snippets read fine without line numbers; from this many lines a number helps point at one. */
const NUMBERED_FROM = 3;

interface ICodeBlockProps {
  code: string;
  /** The fence's language (`python`, `js`, `text`); empty for a block that names none. */
  language: string;
}

/**
 * Edit and run state for one block. The runner modules are imported on the first Run, so a page that
 * never runs code never loads them, nor Pyodide from its CDN.
 */
const useCodeRun = (original: string, language: string) => {
  const [code, setCode] = useState(original);
  const [isEditing, setIsEditing] = useState(false);
  const [input, setInput] = useState('');
  const [status, setStatus] = useState<RunStatus>('idle');
  const [result, setResult] = useState<IRunResult | null>(null);
  const stopRef = useRef<() => void>(() => undefined);
  // New source (the Editor Lab as the author types, or the next question) drops the old edit and run.
  const [source, setSource] = useState(original);
  if (source !== original) {
    setSource(original);
    setCode(original);
    setIsEditing(false);
    setInput('');
    setStatus('idle');
    setResult(null);
  }
  const run = async () => {
    // One value per line; a trailing empty line from Enter is not an extra answer.
    const stdin = input
      .replace(/\n$/, '')
      .split('\n')
      .filter((line, index, lines) => lines.length > 1 || line !== '');
    setResult(null);
    if (language === 'python') {
      const { runPython, stopPython } = await import('./runner/python-runner');
      stopRef.current = stopPython;
      setResult(await runPython(code, stdin, setStatus));
    } else {
      setStatus('running');
      const { runJavaScript } = await import('./runner/js-runner');
      setResult(await runJavaScript(code, stdin, (stop) => (stopRef.current = stop)));
    }
    setStatus('done');
  };
  return {
    code,
    setCode,
    isEditing,
    setIsEditing,
    input,
    setInput,
    status,
    result,
    run,
    stop: () => stopRef.current(),
  };
};

const copyClass = cn(HEADER_BUTTON, 'w-7 px-0');

/**
 * A fenced code block as a learner reads it: a dark editor surface with the language on top, line
 * numbers, a copy button and highlight.js colours; a program's output (`text`) as a terminal panel.
 * Lines never wrap, because indentation is meaning in Python: a long line scrolls inside the block
 * while the numbers stay put. A printout gets plain light text instead.
 *
 * Inside a <CodeRunScope> (a lesson's reading view), Python and JavaScript blocks can also be edited
 * and run (see useCodeRun).
 */
export const CodeBlock = ({ code: original, language }: ICodeBlockProps) => {
  const isPrint = useIsPrint();
  const canRun = useCanRunCode() && isRunnable(language, original);
  const runner = useCodeRun(original, language);
  const { code } = runner;
  const registered = language && hljs.getLanguage(language) ? language : '';
  // highlight.js escapes the source before it wraps tokens, so its output is safe as HTML.
  const html = useMemo(
    () => (registered ? hljs.highlight(code, { language: registered, ignoreIllegals: true }).value : ''),
    [code, registered],
  );
  const isOutput = language === 'text' || language === 'output';
  const lineCount = code.split('\n').length;
  // A >>> session is read prompt by prompt, so numbering its lines only adds noise.
  const isNumbered = !isOutput && language !== 'python-repl' && lineCount >= NUMBERED_FROM;

  if (isPrint) {
    return (
      <pre className="my-4 whitespace-pre-wrap rounded-md border border-border bg-muted p-3 font-mono text-xs leading-relaxed text-foreground">
        <code>{original}</code>
      </pre>
    );
  }

  return (
    <figure className="my-4 overflow-hidden rounded-lg border border-code-header bg-code text-code-foreground shadow-sm">
      <figcaption className="flex items-center justify-between gap-2 bg-code-header px-3 py-1.5 text-code-header-foreground">
        <span className="flex min-w-0 items-center gap-2">
          {isOutput ? <TerminalWindowIcon className="h-4 w-4 shrink-0" /> : <WindowDots />}
          <span className="truncate text-xs font-semibold uppercase tracking-caps">{codeLanguageLabel(language)}</span>
        </span>
        <span className="flex shrink-0 items-center gap-1">
          {canRun ? (
            <RunButtons
              isEdited={code !== original}
              isEditing={runner.isEditing}
              isBusy={runner.status === 'loading' || runner.status === 'running'}
              onReset={() => runner.setCode(original)}
              onToggleEdit={() => runner.setIsEditing(!runner.isEditing)}
              onRun={runner.run}
              onStop={runner.stop}
            />
          ) : null}
          <CopyButton code={code} />
        </span>
      </figcaption>
      <CodeBody
        code={code}
        html={html}
        isEditing={runner.isEditing}
        isNumbered={isNumbered}
        lineCount={lineCount}
        onChange={runner.setCode}
      />
      {canRun && /\binput\(|\bprompt\(/.test(code) ? (
        <RunInput value={runner.input} onChange={runner.setInput} />
      ) : null}
      {runner.status !== 'idle' ? <RunResult status={runner.status} result={runner.result} /> : null}
    </figure>
  );
};

interface ICodeBodyProps {
  code: string;
  html: string;
  isEditing: boolean;
  isNumbered: boolean;
  lineCount: number;
  onChange: (code: string) => void;
}

const INDENT = '    ';

/**
 * Tab indents and Shift+Tab outdents the selected lines (or inserts four spaces at the caret), as an
 * editor does. After Escape the next Tab moves focus on instead, so the box is never a keyboard trap.
 */
const useIndentKeys = (onChange: (code: string) => void) => {
  const isEscapedRef = useRef(false);
  return (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Escape') isEscapedRef.current = true;
    if (event.key !== 'Tab') return;
    if (isEscapedRef.current) {
      isEscapedRef.current = false;
      return;
    }
    event.preventDefault();
    const box = event.currentTarget;
    const { value, selectionStart: start, selectionEnd: end } = box;
    // Inserting through execCommand keeps the browser's undo history; it is the plain caret case only.
    if (!event.shiftKey && start === end && document.execCommand('insertText', false, INDENT)) return;
    const lineStart = value.lastIndexOf('\n', start - 1) + 1;
    const lines = value.slice(lineStart, end).split('\n');
    const changed = lines.map((line) =>
      event.shiftKey ? line.replace(new RegExp(`^ {1,${INDENT.length}}`), '') : INDENT + line,
    );
    const firstShift = changed[0].length - lines[0].length;
    const totalShift = changed.join('\n').length - lines.join('\n').length;
    onChange(value.slice(0, lineStart) + changed.join('\n') + value.slice(end));
    requestAnimationFrame(() =>
      box.setSelectionRange(Math.max(lineStart, start + firstShift), Math.max(lineStart, end + totalShift)),
    );
  };
};

/**
 * The code itself, highlighted, with its line numbers. While it is edited, a transparent text box sits
 * exactly over the highlighting (same font, padding and no wrapping), so the learner types into
 * coloured code; the two only line up while their typography classes stay identical.
 */
const CodeBody = ({ code, html, isEditing, isNumbered, lineCount, onChange }: ICodeBodyProps) => {
  const onKeyDown = useIndentKeys(onChange);
  return (
    <div className="flex font-mono text-xs leading-relaxed sm:text-sm">
      {isNumbered ? <LineNumbers count={lineCount} /> : null}
      <div className="min-w-0 flex-1 overflow-x-auto">
        <div className="relative w-max min-w-full">
          <pre aria-hidden={isEditing} className={cn('whitespace-pre p-3', TOKEN_CLASSES)}>
            {html ? <code dangerouslySetInnerHTML={{ __html: html }} /> : <code>{code}</code>}
            {/* A <pre> drops a trailing newline; without this the caret's new last line has no height. */}
            {isEditing && code.endsWith('\n') ? ' ' : null}
          </pre>
          {isEditing ? (
            <Textarea
              aria-label="Code"
              value={code}
              wrap="off"
              spellCheck={false}
              autoCapitalize="off"
              autoCorrect="off"
              onChange={(event) => onChange(event.target.value)}
              onKeyDown={onKeyDown}
              className="absolute inset-0 h-full min-h-0 resize-none overflow-hidden whitespace-pre rounded-none border-0 bg-transparent p-3 font-mono text-xs leading-relaxed text-transparent caret-code-foreground shadow-none selection:bg-code-function/30 focus-visible:ring-0 sm:text-sm md:text-sm"
            />
          ) : null}
        </div>
      </div>
    </div>
  );
};

/** Copies the code as it stands now (edited or not), and says so for two seconds. */
const CopyButton = ({ code }: { code: string }) => {
  const [isCopied, setIsCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setIsCopied(true);
      window.setTimeout(() => setIsCopied(false), 2000);
    } catch {
      setIsCopied(false);
    }
  };
  return (
    <Tooltip title={isCopied ? 'Copied' : 'Copy code'}>
      <Button isSubtle aria-label={isCopied ? 'Copied' : 'Copy code'} onClick={copy} className={copyClass}>
        {isCopied ? <CheckIcon weight="bold" className="h-4 w-4 text-code-string" /> : <CopyIcon className="h-4 w-4" />}
      </Button>
    </Tooltip>
  );
};

const WindowDots = () => (
  <span aria-hidden className="flex shrink-0 gap-1.5">
    <span className="h-2.5 w-2.5 rounded-full bg-code-meta/80" />
    <span className="h-2.5 w-2.5 rounded-full bg-code-type/80" />
    <span className="h-2.5 w-2.5 rounded-full bg-code-string/80" />
  </span>
);

/** Numbers in their own column, outside the scrolling code, so they stay put and are never copied. */
const LineNumbers = ({ count }: { count: number }) => (
  <pre
    aria-hidden
    className="shrink-0 select-none border-r border-code-header py-3 pl-3 pr-2.5 text-right text-code-comment"
  >
    {Array.from({ length: count }, (_, index) => index + 1).join('\n')}
  </pre>
);
