import {
  ArrowUUpLeftIcon,
  ArrowUUpRightIcon,
  CaretDownIcon,
  CodeBlockIcon,
  CodeIcon,
  FlaskIcon,
  FunctionIcon,
  ImageIcon,
  ListBulletsIcon,
  ListNumbersIcon,
  MinusIcon,
  QuotesIcon,
  SigmaIcon,
  TextBIcon,
  TextHOneIcon,
  TextHThreeIcon,
  TextHTwoIcon,
  TextItalicIcon,
  TextStrikethroughIcon,
  TextTIcon,
  TextUnderlineIcon,
} from '@phosphor-icons/react';
import { type Editor, useEditorState } from '@tiptap/react';
import { useLayoutEffect, useState } from 'react';
import { type IMenuItem, Menu } from '../../core/Menu';
import { cn } from '../../lib/cn';
import { TableInsertMenu } from './TableInsertMenu';
import { TableToolbar } from './TableToolbar';
import { CONTROL_CLASS, keepSelection, ToolbarAction, ToolbarButton, ToolbarGroup } from './ToolbarButton';

interface IProps {
  editor: Editor | null;
  /** Opens the file picker; absent where the host cannot upload, which hides the button. */
  onPickImage?: () => void;
  isUploadingImage?: boolean;
}

const ICON = 'h-4 w-4';

/**
 * Below this width the row sheds its least-used controls rather than wrapping. Wrapping put the
 * equation actions — the reason this editor exists — alone on a second line under a row of
 * formatting glyphs, four times over in a question with four options.
 */
const COMPACT_WIDTH = 600;

/** The block types an author can turn the current block into, in the order the menu lists them. */
const BLOCK_TYPES = [
  { key: 'paragraph', label: 'Text', icon: TextTIcon },
  { key: 'heading-1', label: 'Heading 1', icon: TextHOneIcon },
  { key: 'heading-2', label: 'Heading 2', icon: TextHTwoIcon },
  { key: 'heading-3', label: 'Heading 3', icon: TextHThreeIcon },
  { key: 'blockquote', label: 'Quote', icon: QuotesIcon },
  { key: 'codeBlock', label: 'Code block', icon: CodeBlockIcon },
] as const;

type BlockTypeKey = (typeof BLOCK_TYPES)[number]['key'];

/** The inline marks the toolbar toggles, one entry each so adding a sixth is one line. */
const MARKS = [
  {
    name: 'bold',
    label: 'Bold — Ctrl/⌘ + B',
    icon: <TextBIcon className={ICON} weight="bold" />,
    toggle: (chain: ReturnType<Editor['chain']>) => chain.toggleBold(),
  },
  {
    name: 'italic',
    label: 'Italic — Ctrl/⌘ + I',
    icon: <TextItalicIcon className={ICON} />,
    toggle: (chain: ReturnType<Editor['chain']>) => chain.toggleItalic(),
  },
  {
    name: 'underline',
    label: 'Underline — Ctrl/⌘ + U',
    icon: <TextUnderlineIcon className={ICON} />,
    toggle: (chain: ReturnType<Editor['chain']>) => chain.toggleUnderline(),
  },
  {
    name: 'strike',
    label: 'Strikethrough',
    icon: <TextStrikethroughIcon className={ICON} />,
    toggle: (chain: ReturnType<Editor['chain']>) => chain.toggleStrike(),
  },
  {
    name: 'code',
    label: 'Inline code',
    icon: <CodeIcon className={ICON} />,
    toggle: (chain: ReturnType<Editor['chain']>) => chain.toggleCode(),
  },
];

const currentBlockType = (editor: Editor): BlockTypeKey => {
  if (editor.isActive('heading', { level: 1 })) return 'heading-1';
  if (editor.isActive('heading', { level: 2 })) return 'heading-2';
  if (editor.isActive('heading', { level: 3 })) return 'heading-3';
  if (editor.isActive('blockquote')) return 'blockquote';
  if (editor.isActive('codeBlock')) return 'codeBlock';
  return 'paragraph';
};

const applyBlockType = (editor: Editor, key: BlockTypeKey) => {
  const chain = editor.chain().focus();
  if (key === 'heading-1') chain.setHeading({ level: 1 }).run();
  else if (key === 'heading-2') chain.setHeading({ level: 2 }).run();
  else if (key === 'heading-3') chain.setHeading({ level: 3 }).run();
  else if (key === 'blockquote') chain.toggleBlockquote().run();
  else if (key === 'codeBlock') chain.toggleCodeBlock().run();
  else chain.setParagraph().run();
};

interface IToolbarState {
  blockType: BlockTypeKey;
  marks: Record<string, boolean>;
  bulletList: boolean;
  orderedList: boolean;
  canUndo: boolean;
  canRedo: boolean;
  /** The caret is inside a table, so the table row is shown. */
  inTable: boolean;
  tableBordered: boolean;
}

/**
 * What the toolbar shows before the first transaction. The selector below is only re-run on a
 * transaction, so an editor that has just been created has no state yet — without a default the
 * toolbar was absent until the author's first keystroke or click.
 */
const INITIAL_STATE: IToolbarState = {
  blockType: 'paragraph',
  marks: {},
  bulletList: false,
  orderedList: false,
  canUndo: false,
  canRedo: false,
  inTable: false,
  tableBordered: true,
};

/**
 * Tracks whether the toolbar has room for everything, or has to go compact.
 *
 * The element is held in state rather than a ref: the toolbar renders nothing until the editor
 * exists, so an effect keyed on mount alone ran once with no element and never observed anything.
 */
const useIsCompact = () => {
  const [element, setElement] = useState<HTMLDivElement | null>(null);
  const [isCompact, setIsCompact] = useState(false);
  useLayoutEffect(() => {
    if (!element || typeof ResizeObserver === 'undefined') return undefined;
    const observer = new ResizeObserver(([entry]) => setIsCompact(entry.contentRect.width < COMPACT_WIDTH));
    observer.observe(element);
    return () => observer.disconnect();
  }, [element]);
  return { ref: setElement, isCompact };
};

/**
 * The fixed toolbar above the document, in one row.
 *
 * Formatting sits on the left in the order an author reaches for it — history, block type, marks,
 * lists — and the equation control on the right, as one split button: the primary action inserts
 * an inline equation (or converts the selected text into one), the caret offers display and
 * chemistry. Narrow panes shed undo/redo and the divider rather than wrapping; both stay reachable
 * from the keyboard and the block menu.
 *
 * State is read through `useEditorState` rather than from `editor` in render: Tiptap 3 no longer
 * re-renders the owner on every transaction, so a toolbar that read `editor.isActive` directly
 * showed the state of the *previous* selection.
 */
export const EditorToolbar = ({ editor, onPickImage, isUploadingImage = false }: IProps) => {
  const { ref, isCompact } = useIsCompact();
  const state =
    useEditorState({
      editor,
      selector: ({ editor: instance }): IToolbarState | null => {
        if (!instance) return null;
        return {
          blockType: currentBlockType(instance),
          marks: Object.fromEntries(MARKS.map((mark) => [mark.name, instance.isActive(mark.name)])),
          bulletList: instance.isActive('bulletList'),
          orderedList: instance.isActive('orderedList'),
          canUndo: instance.can().undo(),
          canRedo: instance.can().redo(),
          inTable: instance.isActive('table'),
          tableBordered: instance.getAttributes('table').bordered !== false,
        };
      },
    }) ?? INITIAL_STATE;

  if (!editor) return null;

  const blockItems: IMenuItem[] = BLOCK_TYPES.map(({ key, label, icon: Icon }) => ({
    label,
    icon: <Icon className={ICON} />,
    isCurrent: key === state.blockType,
    onClick: () => applyBlockType(editor, key),
  }));
  const current = BLOCK_TYPES.find((type) => type.key === state.blockType) ?? BLOCK_TYPES[0];
  const CurrentIcon = current.icon;

  const equationItems: IMenuItem[] = [
    {
      label: 'Inline equation — Ctrl/⌘ + E',
      icon: <FunctionIcon className={ICON} />,
      onClick: () => editor.chain().focus().insertInlineMath().run(),
    },
    {
      label: 'Display equation — Ctrl/⌘ + Shift + E',
      icon: <SigmaIcon className={ICON} />,
      onClick: () => editor.chain().focus().insertBlockMath().run(),
    },
    {
      label: 'Chemical equation',
      icon: <FlaskIcon className={ICON} />,
      onClick: () => editor.chain().focus().insertChemicalEquation().run(),
    },
  ];

  return (
    <div ref={ref} className="flex flex-col">
      {/* Left to right, in the order an author works: fix a mistake, choose the block, style the
          text, shape the paragraph, insert an object — and the equation last and alone, because it
          is the one thing this editor exists for. */}
      <div
        className="flex items-center gap-1.5 border-b border-border bg-muted/40 px-2 py-1.5"
        role="toolbar"
        aria-label="Formatting"
      >
        {!isCompact && (
          <ToolbarGroup label="History">
            <ToolbarButton
              label="Undo — Ctrl/⌘ + Z"
              icon={<ArrowUUpLeftIcon className={ICON} />}
              isDisabled={!state.canUndo}
              onClick={() => editor.chain().focus().undo().run()}
            />
            <ToolbarButton
              label="Redo — Ctrl/⌘ + Shift + Z"
              icon={<ArrowUUpRightIcon className={ICON} />}
              isDisabled={!state.canRedo}
              onClick={() => editor.chain().focus().redo().run()}
            />
          </ToolbarGroup>
        )}

        {/* The block type is one choice out of six, so it is one control rather than six. */}
        <ToolbarGroup label="Block type">
          <Menu
            items={blockItems}
            className="inline-flex"
            trigger={
              <button
                type="button"
                onMouseDown={keepSelection}
                aria-label={`Block type: ${current.label}`}
                className={cn(
                  CONTROL_CLASS,
                  'gap-1.5 px-1.5 text-foreground hover:bg-accent',
                  isCompact ? '' : 'min-w-[7rem]',
                )}
              >
                <CurrentIcon className={ICON} />
                {!isCompact && <span className="flex-1 truncate text-left">{current.label}</span>}
                <CaretDownIcon className="h-3 w-3 text-muted-foreground" weight="bold" />
              </button>
            }
          />
        </ToolbarGroup>

        <ToolbarGroup label="Text style">
          {MARKS.map((mark) => (
            <ToolbarButton
              key={mark.name}
              label={mark.label}
              icon={mark.icon}
              isActive={state.marks[mark.name]}
              onClick={() => mark.toggle(editor.chain().focus()).run()}
            />
          ))}
        </ToolbarGroup>

        <ToolbarGroup label="Lists">
          <ToolbarButton
            label="Bulleted list"
            icon={<ListBulletsIcon className={ICON} />}
            isActive={state.bulletList}
            onClick={() => editor.chain().focus().toggleBulletList().run()}
          />
          <ToolbarButton
            label="Numbered list"
            icon={<ListNumbersIcon className={ICON} />}
            isActive={state.orderedList}
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
          />
        </ToolbarGroup>

        <ToolbarGroup label="Insert">
          <TableInsertMenu
            isDisabled={state.inTable}
            onInsert={(options) => editor.chain().focus().insertBorderedTable(options).run()}
          />
          {onPickImage ? (
            <ToolbarButton
              label={isUploadingImage ? 'Uploading image…' : 'Image — upload, paste or drop a picture'}
              icon={<ImageIcon className={cn(ICON, isUploadingImage ? 'animate-pulse' : '')} />}
              isDisabled={isUploadingImage}
              onClick={onPickImage}
            />
          ) : null}
          {!isCompact && (
            <ToolbarButton
              label="Divider"
              icon={<MinusIcon className={ICON} />}
              onClick={() => editor.chain().focus().setHorizontalRule().run()}
            />
          )}
        </ToolbarGroup>

        {/* A split button: press it for an inline equation, open the caret for display or
            chemistry. One bordered unit, so it reads as a single control with a menu. */}
        <ToolbarGroup label="Equation" className="ml-auto gap-0 p-0 overflow-hidden">
          <ToolbarAction
            label="Equation"
            title="Inline equation — Ctrl/⌘ + E. With text selected, converts the selection."
            icon={<FunctionIcon className={ICON} />}
            onClick={() => editor.chain().focus().insertInlineMath().run()}
            className="rounded-none px-2.5"
          />
          <Menu
            items={equationItems}
            className="inline-flex"
            trigger={
              <button
                type="button"
                onMouseDown={keepSelection}
                aria-label="More equation types"
                className={cn(
                  CONTROL_CLASS,
                  'w-6 rounded-none border-l border-border text-foreground hover:bg-primary/10 hover:text-primary',
                )}
              >
                <CaretDownIcon className="h-3 w-3" weight="bold" />
              </button>
            }
          />
        </ToolbarGroup>
      </div>
      {state.inTable ? <TableToolbar editor={editor} bordered={state.tableBordered} /> : null}
    </div>
  );
};
