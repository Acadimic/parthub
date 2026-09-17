import { KeyboardIcon } from '@phosphor-icons/react';
import { Button, MathField, MathRender, Tooltip } from '@repo/ui/core';
import type { IMathFieldHandle } from '@repo/ui/core';
import { useRef, useState } from 'react';
import { FORMULA_GALLERY } from '@repo/ui/app';

/**
 * The math field on its own, with no document around it.
 *
 * Isolating it matters for the spike: when something misbehaves — the caret, an IME, the on-screen
 * keyboard — this says whether the problem is MathLive or the ProseMirror integration wrapped
 * around it. It is also the quickest way to try an expression without first making a document.
 */
export const MathFieldPlayground = () => {
  const [latex, setLatex] = useState('\\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}');
  const handleRef = useRef<IMathFieldHandle | null>(null);

  const insert = (value: string) => {
    handleRef.current?.insert(value);
    setLatex(handleRef.current?.getValue() ?? latex);
  };

  const toggleKeyboard = () => {
    const keyboard = (window as unknown as { mathVirtualKeyboard?: { visible: boolean } }).mathVirtualKeyboard;
    if (keyboard) keyboard.visible = !keyboard.visible;
  };

  return (
    <div className="flex flex-col gap-3 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          {/* Matches the pane captions above, so the three sections of the page read as one system. */}
          <p className="text-xxs font-semibold uppercase tracking-caps text-muted-foreground">
            Equation field on its own
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Type <code className="bg-muted px-1 font-mono">1/2</code>,{' '}
            <code className="bg-muted px-1 font-mono">sqrt</code>, <code className="bg-muted px-1 font-mono">pi</code>{' '}
            or <code className="bg-muted px-1 font-mono">x^2</code> and watch it become notation. Arrow keys walk into
            and out of a fraction.
          </p>
        </div>
        <Tooltip title="On-screen maths keyboard">
          <Button isSecondary className="shrink-0 px-2 py-1.5" onClick={toggleKeyboard}>
            <KeyboardIcon className="h-4 w-4" />
          </Button>
        </Tooltip>
      </div>

      <MathField
        value={latex}
        onChange={setLatex}
        onReady={(handle) => {
          handleRef.current = handle;
        }}
      />

      <div className="flex flex-wrap gap-1">
        {FORMULA_GALLERY.slice(0, 6).map((item) => (
          <Button key={item.label} isSecondary className="px-2 py-1 text-xs" onClick={() => insert(item.latex)}>
            {item.label}
          </Button>
        ))}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="border border-border p-3">
          <p className="mb-2 text-xxs font-semibold uppercase tracking-caps text-muted-foreground">
            Rendered by KaTeX (what a student sees)
          </p>
          <MathRender latex={latex} displayMode />
        </div>
        <div className="border border-border p-3">
          <p className="mb-2 text-xxs font-semibold uppercase tracking-caps text-muted-foreground">
            Stored LaTeX (what goes in the database)
          </p>
          <code className="block break-all font-mono text-xs text-foreground">{latex || '(empty)'}</code>
        </div>
      </div>
    </div>
  );
};
