import { TextInput } from '@repo/ui/app';
import { IFunctionProps, IEditorCellMap } from '@interfaces';
import { useState } from 'react';
import RowColEntry from './function-models/RowColEntry';

const Determinant = (props: IFunctionProps) => {
  const { handleChange, name, closeModal } = props;
  const [row, setRow] = useState<number>(0);

  const handleRowChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setRow(parseInt(value) || 0);
  };

  const getHTML = (data: IEditorCellMap) => {
    let htmlForParent = `
      <table style=" display: inline-table; border-left:2px solid currentColor; border-right:2px solid currentColor;
      vertical-align: middle "><tbody>`;
    for (let i = 1; i <= row; i += 1) {
      htmlForParent = `${htmlForParent} <tr>`;
      for (let j = 1; j <= row; j += 1) {
        htmlForParent = `${htmlForParent}  <td style="padding:0 10px;text-align:center">
         ${data[`${name}-${i}-${j}`]}
        </td>`;
      }
      htmlForParent = `${htmlForParent} </tr>`;
    }
    htmlForParent = `${htmlForParent}   </tbody>
   </table>&nbsp;`;
    return htmlForParent;
  };

  return (
    <>
      <div>
        <div className="mb-7">
          <TextInput
            id="standard-number"
            label="Size"
            name="row"
            type="number"
            onChange={handleRowChange}
            value={row === 0 ? '' : String(row)}
            autoFocus
            placeholder="Enter Size"
          />
        </div>
      </div>
      <RowColEntry
        handleChange={handleChange}
        row={row}
        column={row}
        name={name}
        closeModal={closeModal}
        getHTML={getHTML}
      />
    </>
  );
};

export default Determinant;
