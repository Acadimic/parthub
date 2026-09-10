import { BlankState } from '@components/others';
import { type IColumnData } from '@interfaces';
import { ACTIONS } from '@utils/constants';
import * as React from 'react';
import { type TableComponents, TableVirtuoso } from 'react-virtuoso';
import { Menu, Checkbox, Tooltip } from '@repo/ui/app';

const DEFAULT_CELL_WIDTH = 180;
const INDEX_FIELD = 'index';

const VirtuosoTableComponents: TableComponents<Record<string, unknown>> = {
  Scroller: React.forwardRef<HTMLDivElement>((props, ref) => (
    <div {...props} ref={ref} className="!bg-background overflow-auto" />
  )),
  Table: (props) => <table {...props} className="border-collapse w-full table-fixed text-sm" />,
  TableHead: React.forwardRef<HTMLTableSectionElement>((props, ref) => <thead {...props} ref={ref} />),
  TableRow: (props) => <tr {...props} />,
  TableBody: React.forwardRef<HTMLTableSectionElement>((props, ref) => <tbody {...props} ref={ref} />),
};

interface IProps<T extends object> {
  rows: T[];
  columns: IColumnData<T>[];
}

export const DataTable = <T extends object>({ rows, columns }: IProps<T>) => {
  const allColumns: IColumnData<T>[] = [{ label: '', dataKey: INDEX_FIELD, width: 68 }, ...columns];

  const fixedHeaderContent = () => {
    return (
      <tr>
        {allColumns.map((column, i) => {
          const isAction = column.dataKey === ACTIONS;
          const isFirstColumn = i === 0;
          return (
            <th
              key={column.dataKey}
              align="left"
              style={{ width: column.width || DEFAULT_CELL_WIDTH }}
              className={`bg-background truncate font-bold border-b ${isFirstColumn ? '' : 'border-l'} ${isAction ? 'sticky right-0 text-center' : ''} border-border px-2 py-2`}
            >
              <Tooltip>{column.label}</Tooltip>
            </th>
          );
        })}
      </tr>
    );
  };

  const rowContent = (_index: number, row: T) => {
    return (
      <React.Fragment>
        {allColumns.map((column, i) => {
          const { dataKey, menuItems, width, component } = column;
          const isAction = dataKey === ACTIONS;
          const isFirstColumn = i === 0;
          const title = column.tooltipTitle ? column.tooltipTitle(row) : '';
          const rawValue = (row as Record<string, unknown>)[dataKey] as React.ReactNode;
          const formattedValue = column.valueFormatter ? column.valueFormatter(row) : rawValue;
          const { color, bg } = column.getColor ? column.getColor(row) : { color: 'inherit', bg: 'inherit' };
          let cell: React.ReactNode;
          if (dataKey === INDEX_FIELD) {
            cell = <Checkbox checked={false} />;
          } else if (dataKey === 'actions') {
            cell = <Menu menuItems={menuItems ?? []} data={row} />;
          } else if (component) {
            cell = component(row);
          } else {
            cell = (
              <Tooltip title={title}>
                <div className="truncate">{formattedValue}</div>
              </Tooltip>
            );
          }
          return (
            <td
              key={dataKey}
              align="left"
              style={{ width: width || DEFAULT_CELL_WIDTH, background: bg, color }}
              className={`py-0 h-full ${column.getColor ? '' : 'bg-background'} truncate font-medium border-b ${isFirstColumn ? '' : 'border-l'} ${isAction ? 'sticky right-0' : ''} border-border px-2`}
            >
              <div>{cell}</div>
            </td>
          );
        })}
      </React.Fragment>
    );
  };

  return (
    <div className="shadow-none border h-[calc(100vh-140px)] sm:h-[calc(100vh-148px)] w-full overflow-auto border-border rounded-sm">
      {rows.length ? (
        <TableVirtuoso
          data={rows as Record<string, unknown>[]}
          components={VirtuosoTableComponents}
          fixedHeaderContent={fixedHeaderContent}
          itemContent={(index, row) => rowContent(index, row as T)}
          className="w-full"
        />
      ) : (
        <div className="h-full flex items-center justify-center">
          <BlankState />
        </div>
      )}
    </div>
  );
};
