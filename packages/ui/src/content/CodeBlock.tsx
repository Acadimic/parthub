import { CheckIcon, CopyIcon } from '@phosphor-icons/react';
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

/** highlight.js token classes on the theme's chart colours, so light and dark follow the theme. */
const TOKEN_CLASSES = [
  '[&_.hljs-keyword]:text-chart-5 [&_.hljs-meta_.hljs-keyword]:text-chart-5',
  '[&_.hljs-string]:text-chart-2 [&_.hljs-regexp]:text-chart-2',
  '[&_.hljs-number]:text-chart-3 [&_.hljs-literal]:text-chart-3',
  '[&_.hljs-title]:text-chart-1 [&_.hljs-built_in]:text-chart-1 [&_.hljs-type]:text-chart-1',
  '[&_.hljs-meta]:text-chart-4 [&_.hljs-tag]:text-chart-4 [&_.hljs-attr]:text-chart-3',
  '[&_.hljs-comment]:italic [&_.hljs-comment]:text-muted-foreground',
].join(' ');

interface ICodeBlockProps {
  code: string;
  /** The fence's language (`python`, `js`, `text`); empty for a block that names none. */
  language: string;
}

/**
 * A fenced code block as a learner reads it: the language on top, a copy button, and the code
 * coloured by highlight.js. Lines never wrap, because indentation is meaning in Python; a long line
 * scrolls inside the block instead of widening the page.
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
  const label = codeLanguageLabel(language);

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
    <figure className="my-4 overflow-hidden rounded-md border border-border bg-muted/50">
      {!isPrint ? (
        <figcaption className="flex items-center justify-between gap-2 border-b border-border px-3 py-1">
          <span className="text-xs font-semibold uppercase tracking-caps text-muted-foreground">{label}</span>
          <Tooltip title={isCopied ? 'Copied' : 'Copy code'}>
            <Button
              isSubtle
              aria-label={isCopied ? 'Copied' : 'Copy code'}
              onClick={copy}
              className="flex h-7 w-7 shrink-0 items-center justify-center p-0"
            >
              {isCopied ? (
                <CheckIcon weight="bold" className="h-4 w-4 text-primary" />
              ) : (
                <CopyIcon className="h-4 w-4" />
              )}
            </Button>
          </Tooltip>
        </figcaption>
      ) : null}
      <pre
        className={cn(
          'overflow-x-auto p-3 font-mono text-xs leading-relaxed text-foreground sm:text-sm',
          isPrint ? 'whitespace-pre-wrap' : 'whitespace-pre',
          TOKEN_CLASSES,
        )}
      >
        {html ? <code dangerouslySetInnerHTML={{ __html: html }} /> : <code>{code}</code>}
      </pre>
    </figure>
  );
};
