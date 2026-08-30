import { DeterminantNode, EquationBlock } from '../types';
import { RowsInput } from './base/RowsInput';

interface IProps {
  block: DeterminantNode;
  handleChange: (block: DeterminantNode) => void;
  closeModal: () => void;
}

export const Determinant = ({ block, handleChange, closeModal }: IProps) => {
  const handleRowsChange = (rows: EquationBlock[][][]) => {
    handleChange({ ...block, rows });
  };

  return (
    <div>
      <RowsInput rows={block.rows} handleChange={handleRowsChange} closeModal={closeModal} isRowColSame />
    </div>
  );
};
