import { RenderEquation } from '@components/others';
import { useEffect, useState } from 'react';
import { Actions } from '../Actions';
import { EquationEditor } from '../EquationEditor';
import { EquationBlock, IntegralNode } from '../types';

interface IProps {
  block: IntegralNode;
  handleChange: (block: IntegralNode) => void;
  closeModal: () => void;
}

export const Integral = ({ block, handleChange, closeModal }: IProps) => {
  const [top, setTop] = useState<EquationBlock[]>([]);
  const [bottom, setBottom] = useState<EquationBlock[]>([]);
  const [content, setContent] = useState<EquationBlock[]>([]);

  const handleContentChange = (blocks: EquationBlock[]) => {
    setContent(blocks);
  };

  const handleTopChange = (blocks: EquationBlock[]) => {
    setTop(blocks);
  };

  const handleBottomChange = (blocks: EquationBlock[]) => {
    setBottom(blocks);
  };

  const handleSubmit = () => {
    handleChange({ ...block, top, bottom, content });
  };

  useEffect(() => {
    if (!block) return;
    setTop([...block.top]);
    setBottom([...block.bottom]);
    setContent([...block.content]);
  }, [block]);

  return (
    <div>
      <div className="w-full">
        <div className="w-full">
          <div className="w-[20%]">
            <EquationEditor blocks={top} handleChange={handleTopChange} />
          </div>
        </div>
        <div className="w-full flex items-center">
          <div className="w-1/4">
            <div className="text-2xl">
              <RenderEquation equation={`\\int`} />
            </div>
          </div>
          <div className="flex-1">
            <EquationEditor blocks={content} handleChange={handleContentChange} />
          </div>
        </div>
        <div className="w-full">
          <div className="w-[20%]">
            <EquationEditor blocks={bottom} handleChange={handleBottomChange} />
          </div>
        </div>
      </div>
      <Actions handleSubmit={handleSubmit} closeModal={closeModal} />
    </div>
  );
};
