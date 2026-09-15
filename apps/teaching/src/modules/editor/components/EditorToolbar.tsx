import {
  CaretDownIcon,
  CodeBlockIcon,
  FlaskIcon,
  FunctionIcon,
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
} from '@phosphor-icons/react';
import { Menu, Tooltip } from '@repo/ui/core';
import type { IMenuItem } from '@repo/ui/core';
import { cn } from '@repo/ui/lib';
import type { Editor } from '@tiptap/react';

interface IProps {
  editor: Editor | null;
}

const ICON = 'h-4 w-4';

/**
 * Pressing a toolbar control moves focus out of the editor, and the browser collapses the text
 * selection when it goes. Block commands survive that because they only need the caret position —
 * which is why headings and lists appeared to work while Bold silently did nothing to the selected
 * words. Every control here suppresses the default mousedown so focus, and the selection, stay put.
 */
const keepSelection = (event: React.MouseEvent) => event.preventDefault();

interface IToolbarButtonProps {
  label: string;
  icon: React.ReactNode;
  isActive?: boolean;
  onClick: () => void;
}

const ToolbarButton = ({ label, icon, isActive, onClick }: IToolbarButtonProps) => (
  <Tooltip title={label}>
    <button
      type="button"
      onMouseDown={keepSelection}
      onClick={onClick}
      aria-label={label}
      aria-pressed={Boolean(isActive)}
      className={cn(
        'flex h-8 w-8 items-center justify-center transition-colors',
        'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
        isActive ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-accent hover:text-foreground',
      )}
    >
      {icon}
    </button>
  </Tooltip>
);

/** A labelled control, for the two actions that are the point of this editor. */
const ToolbarAction = ({ label, icon, onClick }: Omit<IToolbarButtonProps, 'isActive'>) => (
  <button
    type="button"
    onMouseDown={keepSelection}
    onClick={onClick}
    className={cn(
      'flex h-8 items-center gap-1.5 border border-border bg-background px-2.5 text-xs font-semibold text-foreground transition-colors',
      'hover:border-primary hover:bg-primary/10 hover:text-primary',
      'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
    )}
  >
    {icon}
    {label}
  </button>
);

/** Groups are separated by space and a hairline, not by space alone — at this density the eye needs
 *  the rule to find the boundary. */
const ToolbarGroup = ({ children, isLast }: { children: React.ReactNode; isLast?: boolean }) => (
  <div className={cn('flex items-center gap-0.5 px-1', !isLast && 'border-r border-border')}>{children}</div>
);

const BLOCK_TYPES = [
  { label: 'Text', icon: TextTIcon },
  { label: 'Heading 1', icon: TextHOneIcon },
  { label: 'Heading 2', icon: TextHTwoIcon },
  { label: 'Heading 3', icon: TextHThreeIcon },
  { label: 'Quote', icon: QuotesIcon },
  { label: 'Code block', icon: CodeBlockIcon },
] as const;

/**
 * The block type is one choice out of six, so it is one control rather than six — a row of
 * mutually exclusive toggles makes the reader work out that only one can be on, and grows with
 * every block type the editor gains.
 */
const getBlockType = (editor: Editor) => {
  const apply = (label: string) => {
    const chain = editor.chain().focus();
    if (label === 'Heading 1') chain.setHeading({ level: 1 }).run();
    else if (label === 'Heading 2') chain.setHeading({ level: 2 }).run();
    else if (label === 'Heading 3') chain.setHeading({ level: 3 }).run();
    else if (label === 'Quote') chain.toggleBlockquote().run();
    else if (label === 'Code block') chain.toggleCodeBlock().run();
    else chain.setParagraph().run();
  };

  let current = 'Text';
  if (editor.isActive('heading', { level: 1 })) current = 'Heading 1';
  else if (editor.isActive('heading', { level: 2 })) current = 'Heading 2';
  else if (editor.isActive('heading', { level: 3 })) current = 'Heading 3';
  else if (editor.isActive('blockquote')) current = 'Quote';
  else if (editor.isActive('codeBlock')) current = 'Code block';

  const items: IMenuItem[] = BLOCK_TYPES.map(({ label, icon: Icon }) => ({
    label,
    icon: <Icon className={ICON} />,
    isCurrent: label === current,
    onClick: () => apply(label),
  }));

  return { current, items };
};

export const EditorToolbar = ({ editor }: IProps) => {
  if (!editor) return null;

  const blockType = getBlockType(editor);
  const CurrentIcon = BLOCK_TYPES.find((type) => type.label === blockType.current)?.icon ?? TextTIcon;

  return (
    <div className="flex flex-wrap items-center gap-y-1 border-b border-border bg-muted/40 px-1.5 py-1.5">
      <ToolbarGroup>
        <Menu
          items={blockType.items}
          className="inline-flex"
          trigger={
            <button
              type="button"
              onMouseDown={keepSelection}
              aria-label={`Block type: ${blockType.current}`}
              className="flex h-8 min-w-[7.25rem] items-center gap-1.5 border border-border bg-background px-2 text-xs font-semibold text-foreground transition-colors hover:border-primary hover:text-primary focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <CurrentIcon className={ICON} />
              <span className="flex-1 truncate text-left">{blockType.current}</span>
              <CaretDownIcon className="h-3 w-3 text-muted-foreground" weight="bold" />
            </button>
          }
        />
      </ToolbarGroup>

      <ToolbarGroup>
        <ToolbarButton
          label="Bold"
          icon={<TextBIcon className={ICON} weight="bold" />}
          isActive={editor.isActive('bold')}
          onClick={() => editor.chain().focus().toggleBold().run()}
        />
        <ToolbarButton
          label="Italic"
          icon={<TextItalicIcon className={ICON} />}
          isActive={editor.isActive('italic')}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        />
        <ToolbarButton
          label="Strikethrough"
          icon={<TextStrikethroughIcon className={ICON} />}
          isActive={editor.isActive('strike')}
          onClick={() => editor.chain().focus().toggleStrike().run()}
        />
      </ToolbarGroup>

      <ToolbarGroup>
        <ToolbarButton
          label="Bulleted list"
          icon={<ListBulletsIcon className={ICON} />}
          isActive={editor.isActive('bulletList')}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        />
        <ToolbarButton
          label="Numbered list"
          icon={<ListNumbersIcon className={ICON} />}
          isActive={editor.isActive('orderedList')}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        />
        <ToolbarButton
          label="Divider"
          icon={<MinusIcon className={ICON} />}
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
        />
      </ToolbarGroup>

      {/* Last, widest and labelled: the two controls this whole editor exists for should not be two
          more anonymous glyphs in a row of thirteen. */}
      <ToolbarGroup isLast>
        {/* The caption is the first thing to go when the pane is narrow: the two controls beside it
            are already labelled, so it is the only genuinely redundant element in the row. */}
        <span className="hidden pr-1 text-xxs font-semibold uppercase tracking-caps text-muted-foreground 2xl:inline">
          Equation
        </span>
        <Tooltip title="Inline equation — Ctrl/⌘ + E">
          <ToolbarAction
            label="Inline"
            icon={<FunctionIcon className={ICON} />}
            onClick={() => editor.chain().focus().insertInlineMath().run()}
          />
        </Tooltip>
        <Tooltip title="Display equation, on its own line — Ctrl/⌘ + Shift + E">
          <ToolbarAction
            label="Display"
            icon={<SigmaIcon className={ICON} />}
            onClick={() => editor.chain().focus().insertBlockMath().run()}
          />
        </Tooltip>
        {/* Chemistry needs its own entry point now that it is not in the symbol palette: a reaction
            inserted into an existing expression produces a mixed equation that is neither editable
            as maths nor recognised as chemistry. Seeding the node with a bare arrow is what makes it
            open straight into the reactants/products editor. */}
        <Tooltip title="Chemical equation">
          <ToolbarAction
            label="Chemistry"
            icon={<FlaskIcon className={ICON} />}
            onClick={() => editor.chain().focus().insertBlockMath('\\ce{ -> }').run()}
          />
        </Tooltip>
      </ToolbarGroup>
    </div>
  );
};
