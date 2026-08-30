import { EquationBlock, MatrixNode } from '../types';
import { RowsInput } from './base/RowsInput';

interface IProps {
  block: MatrixNode;
  handleChange: (block: MatrixNode) => void;
  closeModal: () => void;
}

export const Matrix = ({ block, handleChange, closeModal }: IProps) => {
  const handleRowsChange = (rows: EquationBlock[][][]) => {
    handleChange({ ...block, rows });
  };

  return (
    <div>
      <RowsInput rows={block.rows} handleChange={handleRowsChange} closeModal={closeModal} />
    </div>
  );
};
