import katex from 'katex';
// Registers \ce{...} for chemical equations. Must be imported after katex, and for its side effect
// only — it mutates the katex singleton rather than exporting anything.
import 'katex/contrib/mhchem';
import { useMemo } from 'react';
import { cn } from '../lib/cn';

export interface IMathRenderProps {
  /** The LaTeX source. Rendered as-is; never pre-escape it. */
  latex: string;
  /** Display (block) rather than inline: centred, on its own line, with full-size operators. */
  displayMode?: boolean;
  className?: string;
}

interface IRenderResult {
  html: string;
  error: string | null;
}

/**
 * `renderToString` is pure and the same expression recurs constantly — the same formula in a
 * question and again in its solution, one expression across sixty rendered rows. Keyed by the two
 * inputs that decide the output, so a repeat is a map hit rather than a re-parse.
 *
 * Unbounded would grow with every distinct expression a long session renders, so it is capped and
 * cleared wholesale on overflow. A plain clear rather than an LRU because the cost of a miss is
 * microseconds and tracking recency for this would cost more than it saves.
 */
const CACHE_LIMIT = 500;
const cache = new Map<string, IRenderResult>();

/**
 * `trust: false` is the security boundary, not a default worth inheriting silently: it disables
 * \href, \url and \includegraphics, which is what stops authored content from smuggling a link or
 * a remote image through an equation. `maxExpand` and `maxSize` bound a macro-expansion bomb, so a
 * hostile expression cannot lock the reader's tab.
 *
 * `throwOnError: false` makes KaTeX return an error node instead of throwing, which is what lets a
 * bad equation render as a visible chip rather than taking down the surrounding React tree.
 */
export const renderLatex = (latex: string, displayMode: boolean): IRenderResult => {
  const key = `${displayMode ? 'd' : 'i'}:${latex}`;
  const hit = cache.get(key);
  if (hit) return hit;

  let result: IRenderResult;
  try {
    result = {
      html: katex.renderToString(latex, {
        displayMode,
        throwOnError: false,
        output: 'htmlAndMathml',
        trust: false,
        strict: 'ignore',
        maxSize: 50,
        maxExpand: 1000,
      }),
      error: null,
    };
  } catch (error) {
    // Reached only for failures KaTeX raises before parsing, which `throwOnError` does not cover.
    result = { html: '', error: error instanceof Error ? error.message : 'Could not render equation' };
  }

  if (cache.size >= CACHE_LIMIT) cache.clear();
  cache.set(key, result);
  return result;
};

/**
 * Renders one LaTeX expression with KaTeX.
 *
 * Read-only, and deliberately free of the editor: this is what the student-facing app imports
 * through `@repo/ui/content`, so it must not pull in MathLive or ProseMirror.
 */
export const MathRender = ({ latex, displayMode = false, className }: IMathRenderProps) => {
  const { html, error } = useMemo(() => renderLatex(latex, displayMode), [latex, displayMode]);

  if (error || !latex.trim()) {
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1 border border-destructive/40 bg-destructive/10 px-1.5 py-0.5 font-mono text-xs text-destructive',
          className,
        )}
        title={error ?? 'Empty equation'}
      >
        {latex.trim() || 'empty equation'}
      </span>
    );
  }

  return (
    <span
      // Mathematics is written left-to-right regardless of the language around it. Inside an
      // Arabic or Hebrew paragraph the browser otherwise folds the equation into the surrounding
      // right-to-left run and reorders its parts — `x + 10` renders as `10 + x`, and the trailing
      // punctuation jumps to the wrong end. An explicit `dir` also makes the element a bidi isolate
      // under the HTML UA stylesheet, which is what keeps it from disturbing the text either side.
      dir="ltr"
      className={cn(displayMode && 'block overflow-x-auto py-1 text-center', className)}
      // The markup is KaTeX's own output for a LaTeX string, produced with `trust: false`, so no
      // author-supplied text reaches the DOM unescaped. This is the one place in the content
      // pipeline that injects HTML, and it is why `trust` must never be turned on.
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
};
