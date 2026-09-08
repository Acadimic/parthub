import { Label, Switch, TextInput } from '@repo/ui/app';
import { useEffect, useState } from 'react';
import { getEquationInitialContent } from '../../../math-jax-editor/util';
import { Actions, EquationBlock, EquationEditor, EquationType } from '@components/editors';

interface IProps {
  rows: EquationBlock[][][];
  handleChange: (rows: EquationBlock[][][], isBordered?: boolean) => void;
  closeModal: () => void;
  isRowColSame?: boolean;
  isBordered?: boolean;
}

export const RowsInput = ({ rows, handleChange, closeModal, isRowColSame, isBordered }: IProps) => {
  const [row, setRow] = useState<number>(0);
  const [col, setCol] = useState<number>(0);
  const [equationRows, setEquationRows] = useState<EquationBlock[][][]>([]);
  const [isTableBordered, setIsTableBordered] = useState<boolean>(true);

  const addTextItem = (r: number, c: number) => {
    const newRows = [...equationRows];
    if (!newRows[r]) newRows[r] = [];
    if (!newRows[r][c]) newRows[r][c] = [];
    newRows[r][c].push(getEquationInitialContent(EquationType.TEXT));
    setEquationRows(newRows);
  };

  const initializeRows = (r: number, c: number) => {
    const newRows: EquationBlock[][][] = [];
    for (let i = 0; i < r; i++) {
      newRows.push([]);
      for (let j = 0; j < c; j++) {
        newRows[i].push([]);
        if (equationRows[i]?.[j]) {
          newRows[i][j] = equationRows[i][j];
        } else {
          newRows[i][j].push(getEquationInitialContent(EquationType.TEXT));
        }
      }
    }
    setEquationRows(newRows);
  };

  const handleRowChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value) || 0;
    setRow(value);
    if (isRowColSame) setCol(value);
  };

  const handleColChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value) || 0;
    setCol(value);
  };

  const handleBlockChange = (r: number, c: number, blocks: EquationBlock[]) => {
    const newRows = [...equationRows];
    newRows[r][c] = blocks;
    setEquationRows(newRows);
  };

  const handleSubmit = () => {
    handleChange(equationRows, isTableBordered);
  };

  const handleBorderedChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIsTableBordered(e.target.checked);
  };

  useEffect(() => {
    setEquationRows(rows);
    setRow(rows.length);
    setCol(rows[0]?.length || 0);
    if (isBordered !== undefined) setIsTableBordered(isBordered);
  }, [rows]);

  useEffect(() => {
    if (row & col) initializeRows(row, col);
  }, [row, col]);

  console.log('####rows: ', rows);

  return (
    <div>
      <div className="flex gap-2 mb-8 w-full">
        <div className="flex-1 flex gap-2 w-full">
          <div className="w-1/2">
            <TextInput
              label="Rows"
              name="row"
              type="number"
              onChange={handleRowChange}
              value={row === 0 ? '' : String(row)}
            />
          </div>
          <div className="w-1/2">
            {isRowColSame ? null : (
              <TextInput
                label="Columns"
                name="col"
                type="number"
                onChange={handleColChange}
                value={col === 0 ? '' : String(col)}
                required
              />
            )}
          </div>
        </div>
        {isBordered !== undefined && (
          <Switch
            checked={isTableBordered}
            onCheckedChange={(checked) =>
              handleBorderedChange({ target: { checked } } as React.ChangeEvent<HTMLInputElement>)
            }
            label="Border"
          />
        )}
      </div>
      {row && col ? <Label label="Rows" required /> : null}
      <table
        className={`w-full border-collapse border ${isTableBordered ? 'border-color-border' : 'border-transparent'}`}
      >
        {[...Array(row)].map((_, rIndex) => (
          <tr key={rIndex}>
            {[...Array(col)].map((_, cIndex) => {
              if (!equationRows[rIndex]?.[cIndex]) {
                addTextItem(rIndex, cIndex);
                return null;
              }
              return (
                <td
                  key={cIndex}
                  className={`p-1 border ${isTableBordered ? 'border-color-border' : 'border-transparent'}`}
                >
                  <EquationEditor
                    blocks={equationRows[rIndex][cIndex]}
                    handleChange={(blocks) => handleBlockChange(rIndex, cIndex, blocks)}
                  />
                </td>
              );
            })}
          </tr>
        ))}
      </table>
      <Actions handleSubmit={handleSubmit} closeModal={closeModal} />
    </div>
  );
};
