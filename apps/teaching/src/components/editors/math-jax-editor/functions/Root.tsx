import { TextInput } from '@components/app';
import { RenderEquation } from '@components/others';
import { useEffect, useState } from 'react';
import { Actions } from '../Actions';
import { EquationEditor } from '../EquationEditor';
import { EquationBlock, RootNode } from '../types';

interface IProps {
  initialIndex?: string;
  block: RootNode;
  handleChange: (block: RootNode) => void;
  closeModal: () => void;
}

export const Root = ({ initialIndex, block, handleChange, closeModal }: IProps) => {
  const [index, setIndex] = useState('');
  const [content, setContent] = useState<EquationBlock[]>([]);

  const handleRootChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setIndex(value);
  };

  const handleContentChange = (blocks: EquationBlock[]) => {
    setContent(blocks);
  };

  const handleSubmit = () => {
    handleChange({ ...block, index, content });
  };

  const isUnacceptedIndex = ['0', '1', '2'].includes(index);

  useEffect(() => {
    if (block) {
      setIndex(block.index);
      setContent([...block.content]);
    } else if (initialIndex && !isUnacceptedIndex) {
      setIndex(initialIndex);
    }
  }, [block, initialIndex]);

  return (
    <div>
      <div className="flex items-end w-full h-full gap-1">
        <div className="h-[88px] w-28">
          <TextInput value={index} onChange={handleRootChange} label="Index" />
        </div>
        <div className="text-3xl h-20">
          <RenderEquation equation={`\\sqrt[${isUnacceptedIndex ? '' : index}]{}`} />
        </div>
        <div className="flex-1">
          <EquationEditor blocks={content} handleChange={handleContentChange} label="Radicand" />
        </div>
      </div>
      <Actions handleSubmit={handleSubmit} closeModal={closeModal} />
    </div>
  );
};
