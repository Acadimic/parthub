import { useEffect, useState } from 'react';
import { Actions } from '../Actions';
import { EquationEditor } from '../EquationEditor';
import { type EquationBlock, type SubscriptNode } from '../types';

interface IProps {
  block: SubscriptNode;
  handleChange: (block: SubscriptNode) => void;
  closeModal: () => void;
}

export const Subscript = ({ block, handleChange, closeModal }: IProps) => {
  const [base, setBase] = useState<EquationBlock[]>([]);
  const [content, setContent] = useState<EquationBlock[]>([]);

  const handleBaseChange = (blocks: EquationBlock[]) => {
    setBase(blocks);
  };

  const handleContentChange = (blocks: EquationBlock[]) => {
    setContent(blocks);
  };

  const handleSubmit = () => {
    handleChange({ ...block, content, base });
  };

  useEffect(() => {
    if (!block) return;
    setBase([...block.base]);
    setContent([...block.content]);
  }, [block]);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2">
        <div className="w-1/2">
          <EquationEditor blocks={content} handleChange={handleContentChange} label="Content" />
        </div>
        <div className="w-1/2"></div>
      </div>
      <div className="flex gap-2">
        <div className="w-1/2"></div>
        <div className="w-1/2">
          <EquationEditor blocks={base} handleChange={handleBaseChange} label="Base" />
        </div>
      </div>
      <Actions handleSubmit={handleSubmit} closeModal={closeModal} />
    </div>
  );
};
