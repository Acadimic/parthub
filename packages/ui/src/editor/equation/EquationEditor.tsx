import {
  ArrowsInLineHorizontalIcon,
  ArrowsOutLineHorizontalIcon,
  CheckIcon,
  ClipboardTextIcon,
  CodeIcon,
  CopyIcon,
  FlaskIcon,
  FunctionIcon,
  KeyboardIcon,
  SigmaIcon,
  TrashIcon,
  XIcon,
} from '@phosphor-icons/react';
import { useRef, useState } from 'react';
import { type IMathFieldHandle, MathField } from '../../core/MathField';
import { TextInput } from '../../core/TextInput';
import { Tooltip } from '../../core/Tooltip';
import { cn } from '../../lib/cn';
import { ChemistryEditor } from './ChemistryEditor';
import { parseChemicalEquation, toChemicalEquationLatex } from './chemistry';
import { FormulaGallery } from './FormulaGallery';
import { PanelButton } from './panel-controls';
import { SymbolPalette } from './SymbolPalette';

export interface IEquationEditorProps {
  latex: string;
  onChange: (latex: string) => void;
  /** Display (own line) rather than inline. */
  displayMode: boolean;
  onDone: () => void;
  onCancel: () => void;
  onDelete: () => void;
  /** Switches the equation between inline and display. Absent when the host cannot (a bare field). */
  onToggleDisplayMode?: () => void;
  /** Inserts a copy of the equation right after this one. */
  onDuplicate?: () => void;
}

const ICON = 'h-4 w-4';

/** The on-screen keyboard is a MathLive global, present once a field has loaded. */
const toggleVirtualKeyboard = () => {
  const keyboard = (window as unknown as { mathVirtualKeyboard?: { visible: boolean } }).mathVirtualKeyboard;
  if (keyboard) keyboard.visible = !keyboard.visible;
};

/**
 * The equation authoring surface: a live math field plus the templates that fill it.
 *
 * There is no dialog. A palette item inserts a template with `#?` placeholders straight into the
 * field and the caret lands in the first box, so a nested expression is typed in one continuous
 * gesture. Chemistry swaps the field for `ChemistryEditor`, since MathLive cannot place a caret
 * inside an mhchem atom. The header carries what can be done to the equation as a whole: switch
 * inline/display, duplicate, copy the source, show it, delete, cancel, done.
 */
export const EquationEditor = ({
  latex,
  onChange,
  displayMode,
  onDone,
  onCancel,
  onDelete,
  onToggleDisplayMode,
  onDuplicate,
}: IEquationEditorProps) => {
  const handleRef = useRef<IMathFieldHandle | null>(null);
  const [isShowingSource, setIsShowingSource] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const chemistry = parseChemicalEquation(latex);

  /** Three kinds of equation, three headers — the author should not have to infer which one this is. */
  let HeaderIcon = FunctionIcon;
  let headerLabel = 'Inline equation';
  if (chemistry.isChemistry) {
    HeaderIcon = FlaskIcon;
    headerLabel = displayMode ? 'Chemical equation' : 'Inline chemical equation';
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

  const copySource = async () => {
    try {
      await navigator.clipboard.writeText(latex);
      setIsCopied(true);
      window.setTimeout(() => setIsCopied(false), 1500);
    } catch {
      // Clipboard access can be denied; the source stays visible through the toggle beside this.
      setIsShowingSource(true);
    }
  };

  return (
    <div
      // `select-text` restores selection inside the panel: ProseMirror's node-view wrapper sets
      // `user-select: none` on draggable node views, which otherwise inherits into the inputs.
      className="flex select-text flex-col border border-primary bg-card shadow-md"
      onKeyDown={(event) => event.stopPropagation()}
    >
      {/* Header: what you are editing on the left, what you can do to it on the right — with the
          destructive action held apart from the two that close the panel. */}
      <div className="flex items-center gap-1 border-b border-border bg-muted/50 py-1 pl-2.5 pr-1.5">
        <HeaderIcon className={cn(ICON, 'text-primary')} />
        <span className="flex-1 pl-1 text-xxs font-semibold uppercase tracking-caps text-muted-foreground">
          {headerLabel}
        </span>

        {onToggleDisplayMode ? (
          <PanelButton
            label={displayMode ? 'Show inline, within the text' : 'Show on its own line'}
            onClick={onToggleDisplayMode}
          >
            {displayMode ? (
              <ArrowsInLineHorizontalIcon className={ICON} />
            ) : (
              <ArrowsOutLineHorizontalIcon className={ICON} />
            )}
          </PanelButton>
        ) : null}
        {onDuplicate ? (
          <PanelButton label="Duplicate equation" onClick={onDuplicate}>
            <CopyIcon className={ICON} />
          </PanelButton>
        ) : null}
        <PanelButton label={isCopied ? 'Copied' : 'Copy source'} onClick={copySource} isActive={isCopied}>
          {isCopied ? <CheckIcon className={ICON} /> : <ClipboardTextIcon className={ICON} />}
        </PanelButton>
        <PanelButton
          label={isShowingSource ? 'Hide source' : 'Show source'}
          onClick={() => setIsShowingSource(!isShowingSource)}
          isActive={isShowingSource}
        >
          <CodeIcon className={ICON} />
        </PanelButton>
        {/* The on-screen keyboard belongs to the math field; a chemical equation is typed as text. */}
        {chemistry.isChemistry ? null : (
          <PanelButton label="On-screen maths keyboard" onClick={toggleVirtualKeyboard}>
            <KeyboardIcon className={ICON} />
          </PanelButton>
        )}

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
            onChange={(next) => onChange(toChemicalEquationLatex(next))}
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
              <SymbolPalette onInsert={insert} />
              <FormulaGallery onInsert={insert} />
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
            placeholder="Equation source"
            aria-label="Equation source"
            leftSection={<CodeIcon className="h-3.5 w-3.5 text-muted-foreground" />}
          />
        ) : null}
      </div>
    </div>
  );
};
