import { RenderEquation } from '@components/others';
import { useEffect, useState } from 'react';
import { Actions } from '../Actions';
import { EquationEditor } from '../EquationEditor';
import { type EquationBlock, type LimitNode } from '../types';

interface IProps {
  block: LimitNode;
  handleChange: (block: LimitNode) => void;
  closeModal: () => void;
}

export const Limit = ({ block, handleChange, closeModal }: IProps) => {
  const [left, setLeft] = useState<EquationBlock[]>([]);
  const [right, setRight] = useState<EquationBlock[]>([]);
  const [content, setContent] = useState<EquationBlock[]>([]);

  const handleContentChange = (blocks: EquationBlock[]) => {
    setContent(blocks);
  };

  const handleLeftChange = (blocks: EquationBlock[]) => {
    setLeft(blocks);
  };

  const handleRightChange = (blocks: EquationBlock[]) => {
    setRight(blocks);
  };

  const handleSubmit = () => {
    handleChange({ ...block, left, right, content });
  };

  useEffect(() => {
    if (!block) return;
    setLeft([...block.left]);
    setRight([...block.right]);
    setContent([...block.content]);
  }, [block]);

  return (
    <div>
      <div className="w-full">
        <div className="w-full flex items-end justify-center gap-2">
          <div className="w-1/2">
            <div className="text-2xl h-8">
              <RenderEquation equation={`\\lim`} />
            </div>
          </div>
          <div className="w-1/2">
            <EquationEditor blocks={content} handleChange={handleContentChange} />
          </div>
        </div>
        <div className="w-full">
          <div className="w-1/2 flex items-end justify-center">
            <div className="w-[40%]">
              <EquationEditor blocks={left} handleChange={handleLeftChange} />
            </div>
            <div className="flex items-center justify-center font-bold px-1 w-[30%]">
              <RenderEquation equation={`\\longrightarrow`} />
            </div>
            <div className="w-[40%]">
              <EquationEditor blocks={right} handleChange={handleRightChange} />
            </div>
          </div>
          <div className="w-1/2"></div>
        </div>
      </div>
      <Actions handleSubmit={handleSubmit} closeModal={closeModal} />
    </div>
  );
};
