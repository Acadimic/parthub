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
import { useMemo, useState } from 'react';
import { useIsPrint } from '../contexts/print-context';
import { Button } from '../core/Button';
import { Tooltip } from '../core/Tooltip';
import { cn } from '../lib/cn';
import { codeLanguageLabel } from './code-languages';

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
 * A fenced code block as a learner reads it: a dark editor surface with the language on top, line
 * numbers, a copy button and highlight.js colours; a program's output (`text`) as a terminal panel.
 * Lines never wrap, because indentation is meaning in Python: a long line scrolls inside the block
 * while the numbers stay put. A printout gets plain light text instead.
 */
export const CodeBlock = ({ code, language }: ICodeBlockProps) => {
  const isPrint = useIsPrint();
  const [isCopied, setIsCopied] = useState(false);
  const registered = language && hljs.getLanguage(language) ? language : '';
  // highlight.js escapes the source before it wraps tokens, so its output is safe as HTML.
  const html = useMemo(
    () => (registered ? hljs.highlight(code, { language: registered, ignoreIllegals: true }).value : ''),
    [code, registered],
  );
  const isOutput = language === 'text' || language === 'output';
  const label = codeLanguageLabel(language);
  const lineCount = code.split('\n').length;
  // A >>> session is read prompt by prompt, so numbering its lines only adds noise.
  const isNumbered = !isOutput && language !== 'python-repl' && lineCount >= NUMBERED_FROM;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setIsCopied(true);
      window.setTimeout(() => setIsCopied(false), 2000);
    } catch {
      setIsCopied(false);
    }
  };

  if (isPrint) {
    return (
      <pre className="my-4 whitespace-pre-wrap rounded-md border border-border bg-muted p-3 font-mono text-xs leading-relaxed text-foreground">
        <code>{code}</code>
      </pre>
    );
  }

  return (
    <figure className="my-4 overflow-hidden rounded-lg border border-code-header bg-code text-code-foreground shadow-sm">
      <figcaption className="flex items-center justify-between gap-2 bg-code-header px-3 py-1.5 text-code-header-foreground">
        <span className="flex min-w-0 items-center gap-2">
          {isOutput ? (
            <TerminalWindowIcon className="h-4 w-4 shrink-0" />
          ) : (
            <span aria-hidden className="flex shrink-0 gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-code-meta/80" />
              <span className="h-2.5 w-2.5 rounded-full bg-code-type/80" />
              <span className="h-2.5 w-2.5 rounded-full bg-code-string/80" />
            </span>
          )}
          <span className="truncate text-xs font-semibold uppercase tracking-caps">{label}</span>
        </span>
        <Tooltip title={isCopied ? 'Copied' : 'Copy code'}>
          <Button
            isSubtle
            aria-label={isCopied ? 'Copied' : 'Copy code'}
            onClick={copy}
            className="flex h-7 w-7 shrink-0 items-center justify-center bg-transparent p-0 text-code-header-foreground hover:bg-code hover:text-code-foreground"
          >
            {isCopied ? (
              <CheckIcon weight="bold" className="h-4 w-4 text-code-string" />
            ) : (
              <CopyIcon className="h-4 w-4" />
            )}
          </Button>
        </Tooltip>
      </figcaption>
      <div className="flex font-mono text-xs leading-relaxed sm:text-sm">
        {isNumbered ? (
          <pre
            aria-hidden
            className="shrink-0 select-none border-r border-code-header py-3 pl-3 pr-2.5 text-right text-code-comment"
          >
            {Array.from({ length: lineCount }, (_, index) => index + 1).join('\n')}
          </pre>
        ) : null}
        <pre className={cn('min-w-0 flex-1 overflow-x-auto whitespace-pre p-3', TOKEN_CLASSES)}>
          {html ? <code dangerouslySetInnerHTML={{ __html: html }} /> : <code>{code}</code>}
        </pre>
      </div>
    </figure>
  );
};
