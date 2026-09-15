import { CheckCircleIcon, WarningCircleIcon } from '@phosphor-icons/react';
import { MathRender, renderLatex, Tabs } from '@repo/ui/core';
import { useMemo } from 'react';
import { collectEquations, docToMarkdown, docToPlainText } from '../lib/markdown';
import type { IDocNode } from '../lib/types';
import { RichTextView } from './RichTextView';

interface IProps {
  doc: IDocNode | null;
}

const Pre = ({ children }: { children: string }) => (
  <pre className="max-h-[32rem] overflow-auto bg-muted p-3 font-mono text-xs leading-5 text-foreground">{children}</pre>
);

/**
 * The equation render check, run here against the document on screen.
 *
 * It is the same gate the plan puts on every write — including AI-generated content — so having it
 * visible while authoring is the cheapest way to find out which expressions KaTeX rejects that the
 * MathJax currently in the apps accepted.
 */
const EquationCheck = ({ doc }: IProps) => {
  const results = useMemo(() => collectEquations(doc).map((latex) => ({ latex, ...renderLatex(latex, false) })), [doc]);

  if (!results.length) {
    return <p className="p-3 text-sm text-muted-foreground">No equations in the document yet.</p>;
  }

  const failed = results.filter((result) => result.error);

  return (
    <div className="flex flex-col gap-2 p-3">
      <div className="flex items-center gap-2 text-sm">
        {failed.length ? (
          <>
            <WarningCircleIcon className="h-4 w-4 text-destructive" weight="fill" />
            <span className="font-semibold text-destructive">
              {failed.length} of {results.length} failed to render
            </span>
          </>
        ) : (
          <>
            <CheckCircleIcon className="h-4 w-4 text-success" weight="fill" />
            <span className="font-semibold text-success">All {results.length} equations render</span>
          </>
        )}
      </div>
      <div className="flex flex-col divide-y divide-border border border-border">
        {results.map((result) => (
          <div key={result.latex} className="flex items-center gap-3 p-2">
            <div className="shrink-0">
              <MathRender latex={result.latex} />
            </div>
            <code className="min-w-0 flex-1 truncate font-mono text-xs text-muted-foreground">{result.latex}</code>
            {result.error ? (
              <span className="shrink-0 text-xs font-semibold text-destructive">{result.error}</span>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * What the editor produced, in the four forms that matter: what a reader sees, what leaves the
 * product, what is stored, and whether every equation survives rendering.
 */
export const OutputPanel = ({ doc }: IProps) => {
  const markdown = useMemo(() => docToMarkdown(doc), [doc]);
  const json = useMemo(() => JSON.stringify(doc, null, 2), [doc]);
  const text = useMemo(() => docToPlainText(doc), [doc]);

  return (
    <Tabs
      tabs={[
        {
          label: 'Reading',
          component: (
            <div className="p-4">
              <RichTextView doc={doc} />
            </div>
          ),
        },
        { label: 'Markdown', component: <Pre>{markdown || '(empty)'}</Pre> },
        { label: 'JSON', component: <Pre>{json}</Pre> },
        { label: 'Plain text', component: <Pre>{text || '(empty)'}</Pre> },
        { label: 'Equations', component: <EquationCheck doc={doc} /> },
      ]}
    />
  );
};
