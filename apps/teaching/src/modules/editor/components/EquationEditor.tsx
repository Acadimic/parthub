import {
  CheckIcon,
  CodeIcon,
  FlaskIcon,
  FunctionIcon,
  KeyboardIcon,
  SigmaIcon,
  SparkleIcon,
  TrashIcon,
  XIcon,
} from '@phosphor-icons/react';
import { MathField, MathRender, Popover, TextInput, Tooltip } from '@repo/ui/core';
import type { IMathFieldHandle } from '@repo/ui/core';
import { cn } from '@repo/ui/lib';
import { useRef, useState } from 'react';
import { FORMULA_GALLERY, PALETTE_GROUPS, parseChemistry, toChemistryLatex, toPreviewLatex } from '../lib/palette';
import { ChemistryEditor } from './ChemistryEditor';
import type { IPaletteItem } from '../lib/types';

interface IProps {
  latex: string;
  onChange: (latex: string) => void;
  displayMode: boolean;
  onDone: () => void;
  onCancel: () => void;
  onDelete: () => void;
}

const ICON = 'h-4 w-4';

/** A square icon control in the panel's header strip. */
const PanelButton = ({
  label,
  children,
  onClick,
  isActive,
  isDanger,
}: {
  label: string;
  children: React.ReactNode;
  onClick: () => void;
  isActive?: boolean;
  isDanger?: boolean;
}) => (
  <Tooltip title={label}>
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-pressed={isActive}
      className={cn(
        'flex h-7 w-7 items-center justify-center transition-colors',
        'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
        isDanger && 'text-muted-foreground hover:bg-destructive/10 hover:text-destructive',
        !isDanger && isActive && 'bg-primary/10 text-primary',
        !isDanger && !isActive && 'text-muted-foreground hover:bg-accent hover:text-foreground',
      )}
    >
      {children}
    </button>
  </Tooltip>
);

/** One insertable symbol. The visible content is rendered maths, so the name lives on `aria-label`. */
const InsertTile = ({ item, onInsert }: { item: IPaletteItem; onInsert: (latex: string) => void }) => (
  <Tooltip title={item.label}>
    <button
      type="button"
      onClick={() => onInsert(item.latex)}
      aria-label={item.label}
      className="flex h-10 min-w-10 items-center justify-center border border-border bg-background px-2 transition-colors hover:border-primary hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
    >
      <MathRender latex={toPreviewLatex(item)} />
    </button>
  </Tooltip>
);

const PopoverHeading = ({ children }: { children: React.ReactNode }) => (
  <p className="mb-1.5 text-xxs font-semibold uppercase tracking-caps text-muted-foreground">{children}</p>
);

/**
 * The equation authoring surface: a live math field plus the templates that fill it.
 *
 * The thing to notice is what is absent — there is no dialog. A palette item inserts a template
 * with `#?` placeholders straight into the field and the caret lands in the first box, so a nested
 * expression is typed in one continuous gesture. The editor this replaces opened a modal per
 * function, which made `\frac{\sqrt{x+1}}{2}` require a dialog inside a dialog.
 */
export const EquationEditor = ({ latex, onChange, displayMode, onDone, onCancel, onDelete }: IProps) => {
  const handleRef = useRef<IMathFieldHandle | null>(null);
  const [isShowingSource, setIsShowingSource] = useState(false);
  const chemistry = parseChemistry(latex);

  /** Three kinds of equation, three headers — the author should not have to infer which one this is. */
  let HeaderIcon = FunctionIcon;
  let headerLabel = 'Inline equation';
  if (chemistry.isChemistry) {
    HeaderIcon = FlaskIcon;
    headerLabel = 'Chemical equation';
  } else if (displayMode) {
    HeaderIcon = SigmaIcon;
    headerLabel = 'Display equation';
  }

  const insert = (value: string) => {
    handleRef.current?.insert(value);
    // The field emits `input` for its own edits but not for a programmatic insert, so the document
    // would keep the pre-insert value until the next keystroke.
    onChange(handleRef.current?.getValue() ?? latex);
  };

  const toggleKeyboard = () => {
    // `mathVirtualKeyboard` is a global MathLive installs on `window`; it is not exported from the
    // module, and it only exists once a field has loaded.
    const keyboard = (window as unknown as { mathVirtualKeyboard?: { visible: boolean } }).mathVirtualKeyboard;
    if (keyboard) keyboard.visible = !keyboard.visible;
  };

  return (
    <div
      // `select-text` restores selection inside the panel: ProseMirror's node-view wrapper sets
      // `user-select: none` on draggable node views, which otherwise inherits into the LaTeX input
      // as well as the field.
      className="flex select-text flex-col border border-primary bg-card shadow-md"
      onKeyDown={(e) => e.stopPropagation()}
    >
      {/* Header: what you are editing on the left, what you can do to it on the right — with the
          destructive action held apart from the two that close the panel. */}
      <div className="flex items-center gap-2 border-b border-border bg-muted/50 py-1 pl-2.5 pr-1.5">
        <HeaderIcon className={cn(ICON, 'text-primary')} />
        <span className="flex-1 text-xxs font-semibold uppercase tracking-caps text-muted-foreground">
          {headerLabel}
        </span>

        {/* The on-screen keyboard belongs to the math field; a chemical equation is typed as text. */}
        {chemistry.isChemistry ? null : (
          <PanelButton label="On-screen maths keyboard" onClick={toggleKeyboard}>
            <KeyboardIcon className={ICON} />
          </PanelButton>
        )}
        <PanelButton
          label={isShowingSource ? 'Hide LaTeX source' : 'Show LaTeX source'}
          onClick={() => setIsShowingSource(!isShowingSource)}
          isActive={isShowingSource}
        >
          <CodeIcon className={ICON} />
        </PanelButton>

        <span className="mx-0.5 h-5 w-px bg-border" aria-hidden="true" />

        <PanelButton label="Delete equation" onClick={onDelete} isDanger>
          <TrashIcon className={ICON} />
        </PanelButton>
        <PanelButton label="Cancel — Esc" onClick={onCancel}>
          <XIcon className={ICON} />
        </PanelButton>
        <Tooltip title="Done — Enter">
          <button
            type="button"
            onClick={onDone}
            aria-label="Done"
            className="flex h-7 items-center gap-1 bg-primary px-2 text-xs font-semibold text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <CheckIcon className="h-3.5 w-3.5" weight="bold" />
            Done
          </button>
        </Tooltip>
      </div>

      <div className="flex flex-col gap-2 p-2">
        {chemistry.isChemistry ? (
          <ChemistryEditor
            body={chemistry.body}
            onChange={(next) => onChange(toChemistryLatex(next))}
            onSubmit={onDone}
            onCancel={onCancel}
          />
        ) : (
          <>
            <MathField
              value={latex}
              onChange={onChange}
              onSubmit={onDone}
              onCancel={onCancel}
              onReady={(handle) => {
                handleRef.current = handle;
              }}
              autoFocus
              fieldClassName={displayMode ? 'text-lg' : 'text-base'}
            />

            {/* Below the field, deliberately: the palette opens downward from its trigger, so with
                this row above it the popover covered the very expression being edited. */}
            <div className="flex items-center gap-1.5">
              <Popover
                className="w-[min(32rem,90vw)] max-h-80 overflow-y-auto p-3"
                trigger={
                  <button
                    type="button"
                    className="flex h-8 items-center gap-1.5 border border-border bg-background px-2.5 text-xs font-semibold transition-colors hover:border-primary hover:bg-primary/10 hover:text-primary focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    <FunctionIcon className={ICON} />
                    Symbols
                  </button>
                }
              >
                <div className="flex flex-col gap-3">
                  {PALETTE_GROUPS.map((group) => (
                    <div key={group.name}>
                      <PopoverHeading>{group.name}</PopoverHeading>
                      <div className="flex flex-wrap gap-1">
                        {group.items.map((item) => (
                          <InsertTile key={item.label} item={item} onInsert={insert} />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </Popover>

              <Popover
                className="w-[min(28rem,90vw)] max-h-80 overflow-y-auto p-2"
                trigger={
                  <button
                    type="button"
                    className="flex h-8 items-center gap-1.5 border border-border bg-background px-2.5 text-xs font-semibold transition-colors hover:border-primary hover:bg-primary/10 hover:text-primary focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    <SparkleIcon className={ICON} />
                    Formulas
                  </button>
                }
              >
                <div className="flex flex-col">
                  <div className="px-2 pb-1 pt-1">
                    <PopoverHeading>Insert a complete formula</PopoverHeading>
                  </div>
                  {FORMULA_GALLERY.map((item) => (
                    <button
                      key={item.label}
                      type="button"
                      onClick={() => insert(item.latex)}
                      className="flex items-center justify-between gap-3 border-t border-border px-2 py-2.5 text-left transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    >
                      <span className="text-sm font-medium">{item.label}</span>
                      <MathRender latex={item.latex} className="shrink-0" />
                    </button>
                  ))}
                </div>
              </Popover>

              <span className="ml-auto hidden text-xxs text-muted-foreground sm:block">
                Type <code className="bg-muted px-1 font-mono">1/2</code>,{' '}
                <code className="bg-muted px-1 font-mono">sqrt</code>,{' '}
                <code className="bg-muted px-1 font-mono">^</code> · Tab between boxes
              </span>
            </div>
          </>
        )}

        {isShowingSource ? (
          <TextInput
            value={latex}
            onChange={(event) => onChange(event.target.value)}
            inputClassName="font-mono text-xs"
            placeholder="LaTeX source"
            aria-label="LaTeX source"
            leftSection={<CodeIcon className="h-3.5 w-3.5 text-muted-foreground" />}
          />
        ) : null}
      </div>
    </div>
  );
};
