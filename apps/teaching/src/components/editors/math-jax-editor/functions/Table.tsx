import { EquationBlock, TableNode } from '../types';
import { RowsInput } from './base/RowsInput';

interface IProps {
  block: TableNode;
  handleChange: (block: TableNode) => void;
  closeModal: () => void;
}

export const Table = ({ block, handleChange, closeModal }: IProps) => {
  const handleRowsChange = (rows: EquationBlock[][][], isBordered?: boolean) => {
    handleChange({ ...block, rows, isBordered: isBordered || false });
  };

  return (
    <div>
      <RowsInput
        rows={block.rows}
        handleChange={handleRowsChange}
        closeModal={closeModal}
        isBordered={block.isBordered}
      />
    </div>
  );
};
