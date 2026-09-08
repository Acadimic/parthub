import React, { useState } from 'react';

import { TextInput } from '@parthhub/ui/app';
import { IFunctionProps } from '@interfaces';
import RowColEntry from './function-models/RowColEntry';

const Metrics = (props: IFunctionProps) => {
  const { handleChange, name, closeModal } = props;
  const [row, setRow] = useState<number>(0);
  const [column, setColumn] = useState<number>(0);

  const handleRowChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setRow(parseInt(value) || 0);
  };

  const handleColumnChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setColumn(parseInt(value) || 0);
  };

  const getHTML = (data: any) => {
    let htmlForParent = `
       <table style="display: inline-table; border-collapse: collapse; vertical-align: middle;"><tbody>
       <tr style="line-height:0.1"><td style=" border-top:2px solid currentColor; border-left:2px solid currentColor">&nbsp;</td>
       <td colspan="${column}"></td>
       <td style=" border-top:2px solid currentColor; border-right:2px solid currentColor" >&nbsp;</td></tr>`;
    for (let i = 1; i <= row; i += 1) {
      htmlForParent = `${htmlForParent} <tr><td style="border-left:2px solid currentColor"></td>`;
      for (let j = 1; j <= column; j += 1) {
        htmlForParent = `${htmlForParent}  <td style="padding:0 10px; text-align:center">
         ${data[`${name}-${i}-${j}`]}
        </td>`;
      }
      htmlForParent = `${htmlForParent} <td style="border-right:2px solid currentColor" ></td></tr>`;
    }
    htmlForParent = `${htmlForParent}
      <tr style="line-height:0.1"><td style=" border-bottom:2px solid currentColor; border-left:2px solid currentColor">&nbsp;</td>
       <td colspan="${column}"></td>
       <td style=" border-bottom:2px solid currentColor; border-right:2px solid currentColor" >&nbsp;</td></tr></tbody>
   </table>&nbsp;`;

    return htmlForParent;
  };

  return (
    <>
      <div className="flex mb-7 justify-center">
        <div className="flex w-1/2 justify-center">
          <TextInput
            id="standard-number"
            label="Rows"
            name="row"
            type="number"
            onChange={handleRowChange}
            value={row === 0 ? '' : String(row)}
            autoFocus
            placeholder="Enter Row Size"
          />
        </div>
        <div className="flex w-1/2 justify-center">
          <TextInput
            id="standard-number"
            label="Columns"
            name="column"
            type="number"
            onChange={handleColumnChange}
            value={column === 0 ? '' : String(column)}
            placeholder="Enter Column Size"
          />
        </div>
      </div>
      <RowColEntry
        handleChange={handleChange}
        row={row}
        column={column}
        name={name}
        closeModal={closeModal}
        getHTML={getHTML}
      />
    </>
  );
};

export default Metrics;
