/* eslint-disable react/display-name */
import { BlankState } from '@components/others';
import { IColumnData } from '@interfaces';
import { ACTIONS } from '@utils/constants';
import * as React from 'react';
import { TableComponents, TableVirtuoso } from 'react-virtuoso';
import { Menu, Checkbox, Tooltip } from '@parthhub/ui/app';

const DEFAULT_CELL_WIDTH = 180;
const INDEX_FIELD = 'index';

const VirtuosoTableComponents: TableComponents<Record<string, unknown>> = {
  Scroller: React.forwardRef<HTMLDivElement>((props, ref) => (
    <div {...props} ref={ref} className="!bg-background-primary overflow-auto" />
  )),
  Table: (props) => <table {...props} className="border-collapse w-full table-fixed text-sm" />,
  TableHead: React.forwardRef<HTMLTableSectionElement>((props, ref) => <thead {...props} ref={ref} />),
  TableRow: (props) => <tr {...props} />,
  TableBody: React.forwardRef<HTMLTableSectionElement>((props, ref) => <tbody {...props} ref={ref} />),
};

interface IProps {
  rows: Record<string, unknown>[];
  columns: IColumnData[];
}

export const DataTable = ({ rows, columns }: IProps) => {
  const allColumns = [{ label: '', dataKey: INDEX_FIELD, width: 68 }, ...columns];

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
              className={`bg-background-primary truncate font-bold border-b ${isFirstColumn ? '' : 'border-l'} ${isAction ? 'sticky right-0 text-center' : ''} border-color-border px-2 py-2`}
            >
              <Tooltip>{column.label}</Tooltip>
            </th>
          );
        })}
      </tr>
    );
  };

  const rowContent = (_index: number, row: Record<string, unknown>) => {
    return (
      <React.Fragment>
        {allColumns.map((column, i) => {
          const { dataKey, menuItems, width, component } = column;
          const isAction = dataKey === ACTIONS;
          const isFirstColumn = i === 0;
          const title = column.tooltipTitle ? column.tooltipTitle(row) : '';
          const formattedValue = column.valueFormatter ? column.valueFormatter(row) : (row[dataKey] as React.ReactNode);
          const { color, bg } = column.getColor ? column.getColor(row) : { color: 'inherit', bg: 'inherit' };
          return (
            <td
              key={dataKey}
              align="left"
              style={{ width: width || DEFAULT_CELL_WIDTH, background: bg, color: color }}
              className={`py-0 h-full ${column.getColor ? '' : 'bg-background-primary'} truncate font-medium border-b ${isFirstColumn ? '' : 'border-l'} ${isAction ? 'sticky right-0' : ''} border-color-border px-2`}
            >
              <div>
                {dataKey === INDEX_FIELD ? (
                  <Checkbox checked={false} />
                ) : dataKey === 'actions' ? (
                  <Menu menuItems={menuItems || []} data={row} />
                ) : component ? (
                  component(row)
                ) : (
                  <Tooltip title={title}>
                    <div className="truncate">{formattedValue}</div>
                  </Tooltip>
                )}
              </div>
            </td>
          );
        })}
      </React.Fragment>
    );
  };

  return (
    <div className="shadow-none border h-[calc(100vh-140px)] sm:h-[calc(100vh-148px)] w-full overflow-auto border-color-border rounded-sm">
      {rows.length ? (
        <TableVirtuoso
          data={rows}
          components={VirtuosoTableComponents}
          fixedHeaderContent={fixedHeaderContent}
          itemContent={rowContent}
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
