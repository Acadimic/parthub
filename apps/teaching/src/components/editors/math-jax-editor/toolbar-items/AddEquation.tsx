import { useEffect, useState } from 'react';
import { Actions } from '../Actions';
import { EquationEditor } from '../EquationEditor';
import { type EquationBlock, type EquationNode } from '../types';

interface IProps {
  block: EquationNode;
  handleChange: (block: EquationNode) => void;
  closeModal: () => void;
}

export const AddEquation = ({ block, handleChange, closeModal }: IProps) => {
  const [equationBlocks, setEquationBlocks] = useState<EquationBlock[]>([]);

  const handleBlockChange = (blocks: EquationBlock[]) => {
    setEquationBlocks(blocks);
  };

  const handleSubmit = () => {
    handleChange({ ...block, blocks: equationBlocks });
  };

  useEffect(() => {
    setEquationBlocks([...block.blocks]);
  }, [block]);

  // console.log('####equationBlocks: ', equationBlocks);

  return (
    <div>
      <EquationEditor blocks={equationBlocks} handleChange={handleBlockChange} label="Add Equation" autoFocus />
      <Actions handleSubmit={handleSubmit} closeModal={closeModal} />
    </div>
  );
};
