import { useEffect, useState } from 'react';
import { Actions } from '../Actions';
import { EquationEditor } from '../EquationEditor';
import { EquationBlock, SuperscriptNode } from '../types';

interface IProps {
  block: SuperscriptNode;
  handleChange: (block: SuperscriptNode) => void;
  closeModal: () => void;
}

export const Superscript = ({ block, handleChange, closeModal }: IProps) => {
  const [content, setContent] = useState<EquationBlock[]>([]);
  const [exponent, setExponent] = useState<EquationBlock[]>([]);

  const handleContentChange = (blocks: EquationBlock[]) => {
    setContent(blocks);
  };

  const handleExponentChange = (blocks: EquationBlock[]) => {
    setExponent(blocks);
  };

  const handleSubmit = () => {
    handleChange({ ...block, content, exponent });
  };

  useEffect(() => {
    if (!block) return;
    setContent([...block.content]);
    setExponent([...block.exponent]);
  }, [block]);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2">
        <div className="w-1/2"></div>
        <div className="w-1/2">
          <EquationEditor blocks={exponent} handleChange={handleExponentChange} label="Exponent" />
        </div>
      </div>
      <div className="flex gap-2">
        <div className="w-1/2">
          <EquationEditor blocks={content} handleChange={handleContentChange} label="Content" />
        </div>
        <div className="w-1/2"></div>
      </div>
      <Actions handleSubmit={handleSubmit} closeModal={closeModal} />
    </div>
  );
};
