import { ArrowCounterClockwiseIcon, PencilSimpleIcon, SlidersHorizontalIcon } from '@phosphor-icons/react';
import { Badge, Card, Tooltip } from '@repo/ui/core';
import { cn } from '@repo/ui/lib';
import { useState } from 'react';
import { MathFieldPlayground } from './components/MathFieldPlayground';
import { OutputPanel } from './components/OutputPanel';
import { RichTextEditor } from './components/RichTextEditor';
import { PRESETS } from './lib/sample';
import type { IDocNode } from './lib/types';

/** A caption above a pane, so each half of the split says what it is without a heading's weight. */
const PaneLabel = ({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) => (
  <div className="flex items-center gap-1.5 px-0.5 pb-1.5 text-xxs font-semibold uppercase tracking-caps text-muted-foreground">
    {icon}
    {children}
  </div>
);

/**
 * The editor demo: author on the left, see exactly what the editor produced on the right.
 *
 * A harness, not a product screen. It exists to answer the Phase 0 questions in
 * `.claude/plans/CONTENT_EDITOR_AND_EQUATIONS.md` with something running — does the math field
 * behave under React 19 and the Pages Router, does Devanagari survive, does every equation render
 * through KaTeX, does an Indic IME work inside `contenteditable` — before any of this is wired to
 * a store or a real entity. Once those answers are in, the editor moves to `packages/ui/src/editor`
 * and this screen goes away.
 */
export const Editor = () => {
  const [presetKey, setPresetKey] = useState(PRESETS[0].key);
  const [doc, setDoc] = useState<IDocNode | null>(PRESETS[0].doc);
  /**
   * Bumped on every preset change and remount of the editor. Tiptap takes `content` once, at
   * construction, so swapping the prop alone would leave the previous document on screen — the key
   * is what forces a fresh instance.
   */
  const [instance, setInstance] = useState(0);

  const preset = PRESETS.find((item) => item.key === presetKey) ?? PRESETS[0];

  const loadPreset = (key: string) => {
    const next = PRESETS.find((item) => item.key === key) ?? PRESETS[0];
    setPresetKey(next.key);
    setDoc(next.doc);
    setInstance((value) => value + 1);
  };

  return (
    <div className="flex flex-col gap-4">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
        <div className="flex items-center gap-2.5">
          <h1 className="text-lg font-semibold text-foreground">Editor lab</h1>
          <Badge tone="warning">Demo</Badge>
          <span className="hidden text-sm text-muted-foreground lg:block">
            Equations are first-class blocks — click one to edit it in place.
          </span>
        </div>

        {/* A segmented control, not five loose buttons: the presets are one exclusive choice, and
            joining them says so without a legend. The caption sits under it rather than orphaned on
            the far side of the header, so it reads as describing the selection. */}
        <div className="flex flex-col items-end gap-1">
          <div className="flex items-center gap-2">
            <div className="flex border border-border" role="group" aria-label="Sample document">
              {PRESETS.map((item) => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => loadPreset(item.key)}
                  aria-pressed={item.key === presetKey}
                  className={cn(
                    'border-r border-border px-2.5 py-1.5 text-xs font-semibold transition-colors last:border-r-0',
                    'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-ring',
                    item.key === presetKey
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-background text-muted-foreground hover:bg-accent hover:text-foreground',
                  )}
                >
                  {item.label}
                </button>
              ))}
            </div>
            <Tooltip title="Reload this sample, discarding your edits">
              <button
                type="button"
                onClick={() => loadPreset(presetKey)}
                aria-label="Reset"
                className="flex h-[30px] w-8 items-center justify-center border border-border bg-background text-muted-foreground transition-colors hover:border-primary hover:text-primary focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <ArrowCounterClockwiseIcon className="h-4 w-4" />
              </button>
            </Tooltip>
          </div>
          <p className="max-w-[30rem] text-right text-xs text-muted-foreground">{preset.description}</p>
        </div>
      </header>

      {/* Pane height comes from the viewport, not from the parent.
          `h-full` + `flex-1` only fills when every ancestor has a *definite* height, and the sidebar
          wraps a page in `min-h-full` inside its own scroller — a minimum, not a height, so the
          percentage resolves to auto and the panes size to their content instead. The result was a
          page that fitted outside the sidebar and overflowed inside it, pushing the playground off
          screen. A `vh` cap is independent of the ancestor chain, so it behaves the same in both. */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <section className="flex min-w-0 flex-col">
          <PaneLabel icon={<PencilSimpleIcon className="h-3.5 w-3.5" />}>Author</PaneLabel>
          <Card className="h-[min(58vh,40rem)] min-h-[20rem] overflow-auto border border-border p-0">
            <RichTextEditor key={`${presetKey}-${instance}`} initialContent={preset.doc} onChange={setDoc} />
          </Card>
        </section>

        <section className="flex min-w-0 flex-col">
          <PaneLabel icon={<SlidersHorizontalIcon className="h-3.5 w-3.5" />}>What the editor produced</PaneLabel>
          <Card className="h-[min(58vh,40rem)] min-h-[20rem] overflow-auto border border-border p-0">
            <OutputPanel doc={doc} />
          </Card>
        </section>
      </div>

      <Card className="border border-border p-0">
        <MathFieldPlayground />
      </Card>
    </div>
  );
};
