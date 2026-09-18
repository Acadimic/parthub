import { Table, TableCell, TableHeader, TableRow } from '@tiptap/extension-table';

export const TABLE_NAME = 'table';

/** What the insert picker asks for. */
export interface ITableInsertOptions {
  rows: number;
  cols: number;
  /** Make the first row a header row. */
  withHeaderRow: boolean;
  /** Draw cell borders. Off gives a transparent layout grid, for aligning working or options. */
  bordered: boolean;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    borderedTable: {
      /** Inserts a table at the caret with the given shape and border setting. */
      insertBorderedTable: (options: ITableInsertOptions) => ReturnType;
      /** Shows or hides the borders of the table the caret is in. */
      setTableBordered: (bordered: boolean) => ReturnType;
    };
  }
}

/**
 * Tiptap's table with one attribute added: whether it draws borders.
 *
 * Two kinds of table appear in teaching material. A data table — a truth table, a set of readings,
 * a comparison — wants borders. A layout table — two columns of working side by side, four answer
 * options in a grid — wants none. The old editor shipped these as two separate tools (`TABLE` and
 * `TRANSPARENT_TABLE`); here they are one node with a flag, so a table can switch after the fact
 * and every other piece of table machinery is written once.
 *
 * Column resizing stays off: it needs the extension's own stylesheet for its handles, which this
 * package does not ship, and equal columns are what a teaching table almost always wants.
 */
export const BorderedTable = Table.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      bordered: {
        default: true,
        parseHTML: (element: HTMLElement) => element.getAttribute('data-bordered') !== 'false',
        renderHTML: (attributes: Record<string, unknown>) => ({
          'data-bordered': attributes.bordered ? 'true' : 'false',
        }),
      },
    };
  },

  addCommands() {
    return {
      ...this.parent?.(),

      insertBorderedTable:
        ({ rows, cols, withHeaderRow, bordered }) =>
        ({ chain }) =>
          chain()
            .insertTable({ rows, cols, withHeaderRow })
            // `insertTable` leaves the caret in the first cell, so the update reaches the new table.
            .updateAttributes(TABLE_NAME, { bordered })
            .run(),

      setTableBordered:
        (bordered) =>
        ({ commands }) =>
          commands.updateAttributes(TABLE_NAME, { bordered }),
    };
  },
}).configure({
  resizable: false,
  // No node view. The extension's default `TableView` copies the node's attributes onto its DOM
  // once, at construction, so toggling `bordered` changed the document and left the editor
  // painting the old borders. Rendered through `renderHTML` instead, an attribute change
  // re-renders the element. Column resizing is off, so nothing else needed the view.
  View: null,
});

/**
 * What a cell may hold. Tiptap's default is any block, which lets a table go inside a table; the
 * content plan rules nested tables out, and the reading view, the Markdown exporter and a
 * translator would all have to learn them. Paragraphs, lists and a display equation cover what a
 * teaching table holds; inline equations live inside the paragraphs.
 */
const CELL_CONTENT = '(paragraph | bulletList | orderedList | blockMath)+';

export const FlatTableCell = TableCell.extend({ content: CELL_CONTENT });
export const FlatTableHeader = TableHeader.extend({ content: CELL_CONTENT });

/** The table node and its three parts, in the order the editor registers them. */
export const TableExtensions = [BorderedTable, TableRow, FlatTableHeader, FlatTableCell];
