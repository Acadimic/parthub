import {
  ColumnsPlusLeftIcon,
  ColumnsPlusRightIcon,
  RowsPlusBottomIcon,
  RowsPlusTopIcon,
  SelectionAllIcon,
  SelectionIcon,
  TableIcon,
  TextHIcon,
  TrashIcon,
} from '@phosphor-icons/react';
import type { Editor } from '@tiptap/react';
import { ToolbarButton, ToolbarGroup } from './ToolbarButton';

interface IProps {
  editor: Editor;
  /** Whether the table the caret is in draws borders. */
  bordered: boolean;
}

const ICON = 'h-4 w-4';

/**
 * The controls for the table the caret is in.
 *
 * Shown as a second row under the main toolbar only while the caret is inside a table, so the
 * main row never has to make room for nine controls that mean nothing elsewhere. Row and column
 * operations act on the caret's row and column; the three on the right act on the whole table.
 */
export const TableToolbar = ({ editor, bordered }: IProps) => {
  const run = (command: (chain: ReturnType<Editor['chain']>) => ReturnType<Editor['chain']>) => () =>
    command(editor.chain().focus()).run();

  return (
    <div
      className="flex items-center gap-1.5 border-b border-border bg-muted/20 px-2 py-1"
      role="toolbar"
      aria-label="Table"
    >
      <span className="flex items-center gap-1 pr-0.5 text-xxs font-semibold uppercase tracking-caps text-muted-foreground">
        <TableIcon className="h-3.5 w-3.5" />
        Table
      </span>
      <ToolbarGroup label="Rows">
        <ToolbarButton
          label="Add row above"
          icon={<RowsPlusTopIcon className={ICON} />}
          onClick={run((c) => c.addRowBefore())}
        />
        <ToolbarButton
          label="Add row below"
          icon={<RowsPlusBottomIcon className={ICON} />}
          onClick={run((c) => c.addRowAfter())}
        />
        <ToolbarButton
          label="Delete row"
          icon={<TrashIcon className={ICON} />}
          isDanger
          onClick={run((c) => c.deleteRow())}
        />
      </ToolbarGroup>
      <ToolbarGroup label="Columns">
        <ToolbarButton
          label="Add column left"
          icon={<ColumnsPlusLeftIcon className={ICON} />}
          onClick={run((c) => c.addColumnBefore())}
        />
        <ToolbarButton
          label="Add column right"
          icon={<ColumnsPlusRightIcon className={ICON} />}
          onClick={run((c) => c.addColumnAfter())}
        />
        <ToolbarButton
          label="Delete column"
          icon={<TrashIcon className={ICON} />}
          isDanger
          onClick={run((c) => c.deleteColumn())}
        />
      </ToolbarGroup>
      <ToolbarGroup label="Table options">
        <ToolbarButton
          label="Toggle header row"
          icon={<TextHIcon className={ICON} />}
          onClick={run((c) => c.toggleHeaderRow())}
        />
        <ToolbarButton
          label={bordered ? 'Hide borders' : 'Show borders'}
          icon={bordered ? <SelectionAllIcon className={ICON} /> : <SelectionIcon className={ICON} />}
          isActive={bordered}
          onClick={run((c) => c.setTableBordered(!bordered))}
        />
      </ToolbarGroup>
      <ToolbarGroup label="Remove" className="ml-auto">
        <ToolbarButton
          label="Delete table"
          icon={<TrashIcon className={ICON} />}
          isDanger
          onClick={run((c) => c.deleteTable())}
        />
      </ToolbarGroup>
    </div>
  );
};
