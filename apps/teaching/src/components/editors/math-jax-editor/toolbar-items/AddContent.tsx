import { useEffect, useState } from 'react';
import { Actions } from '../Actions';
import { MathEditor } from '../MathEditor';
import { Block, ContentNode } from '../types';

interface IProps {
  block: ContentNode;
  handleChange: (block: ContentNode) => void;
  closeModal: () => void;
}

export const AddContent = ({ block, handleChange, closeModal }: IProps) => {
  const [content, setContent] = useState<Block[]>([]);

  const handleBlockChange = (blocks: Block[]) => {
    setContent(blocks);
  };

  const handleSubmit = () => {
    handleChange({ ...block, content });
  };

  useEffect(() => {
    setContent([...block.content]);
  }, [block]);

  return (
    <div>
      <div className="my-4">
        <MathEditor blocks={content} handleChange={handleBlockChange} label="Add Content" autoFocus />
      </div>
      <Actions handleSubmit={handleSubmit} closeModal={closeModal} />
    </div>
  );
};
