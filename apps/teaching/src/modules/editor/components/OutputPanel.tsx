import { MathRender, RichTextView, renderLatex } from '@repo/ui/content';
import { collectEquations, docToMarkdown, toRichText } from '@repo/ui/editor';
import { docToPlainText } from '@repo/shared/utils';
import { CheckCircleIcon, WarningCircleIcon } from '@phosphor-icons/react';
import { encode as encodeToon } from '@toon-format/toon';
import { Tabs } from '@repo/ui/core';
import { useMemo } from 'react';
import type { IRichTextDoc } from '@repo/shared/interfaces';

interface IProps {
  doc: IRichTextDoc | null;
}

const Pre = ({ children }: { children: string }) => (
  <pre className="max-h-[32rem] overflow-auto bg-muted p-3 font-mono text-xs leading-5 text-foreground">{children}</pre>
);

/**
 * TOON — Token-Oriented Object Notation: the same document, encoded for a language model rather
 * than for a parser. Uniform arrays collapse to one header row plus values, which is where the
 * saving comes from.
 *
 * It earns a panel because the plan turns on this number. Handing a model ProseMirror JSON costs
 * four to six times the tokens of the equivalent Markdown, which is the argument for Markdown being
 * the AI write path; TOON is what that gap looks like when the structure has to be preserved —
 * worth seeing measured against a real document rather than assumed.
 */
const toToon = (doc: IRichTextDoc | null): { text: string; saving: number | null } => {
  if (!doc) return { text: '(empty)', saving: null };
  try {
    const text = encodeToon(doc);
    const json = JSON.stringify(doc, null, 2);
    return { text, saving: json.length ? Math.round((1 - text.length / json.length) * 100) : null };
  } catch (error) {
    return { text: error instanceof Error ? error.message : 'Could not encode', saving: null };
  }
};

/**
 * The equation render check, run here against the document on screen.
 *
 * It is the same gate the plan puts on every write — including AI-generated content — so having it
 * visible while authoring is the cheapest way to find out which expressions KaTeX rejects that the
 * MathJax the apps used to render with accepted.
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
  const toon = useMemo(() => toToon(doc), [doc]);
  const text = useMemo(() => docToPlainText(doc), [doc]);

  return (
    <Tabs
      // Pins the tab strip and scrolls the panel beneath it, matching the editor's fixed toolbar.
      className="flex h-full min-h-0 flex-col"
      contentClassName="min-h-0 flex-1 overflow-auto"
      tabs={[
        {
          label: 'Reading',
          component: (
            <div className="p-4">
              <RichTextView value={doc ? toRichText(doc) : null} />
            </div>
          ),
        },
        { label: 'Markdown', component: <Pre>{markdown || '(empty)'}</Pre> },
        { label: 'JSON', component: <Pre>{json}</Pre> },
        {
          label: 'TOON',
          component: (
            <div className="flex h-full flex-col">
              <p className="shrink-0 border-b border-border bg-muted/40 px-3 py-1.5 text-xxs text-muted-foreground">
                {toon.saving === null
                  ? 'Token-oriented encoding of the stored document'
                  : `${toon.text.length} characters — ${toon.saving}% smaller than the JSON beside it`}
              </p>
              <Pre>{toon.text}</Pre>
            </div>
          ),
        },
        { label: 'Plain text', component: <Pre>{text || '(empty)'}</Pre> },
        { label: 'Equations', component: <EquationCheck doc={doc} /> },
      ]}
    />
  );
};
