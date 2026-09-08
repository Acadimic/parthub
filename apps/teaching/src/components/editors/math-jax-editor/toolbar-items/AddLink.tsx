import { Label, TextInput } from '@repo/ui/app';
import { errorToast } from '@utils/helpers';
import { useEffect, useState } from 'react';
import { Actions } from '../Actions';
import { MathEditor } from '../MathEditor';
import { type Block, type LinkNode } from '../types';

interface IProps {
  block: LinkNode;
  handleChange: (block: LinkNode) => void;
  closeModal: () => void;
}

export const AddLink = ({ block, handleChange, closeModal }: IProps) => {
  const [content, setContent] = useState<Block[]>([]);
  const [href, setHref] = useState<string>('');

  const handleBlockChange = (blocks: Block[]) => {
    setContent(blocks);
  };

  const handleLinkTextChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setHref(value);
  };

  const handleSubmit = () => {
    if (!href) {
      errorToast({ message: 'Please enter a URL.' });
      return false;
    }
    handleChange({ ...block, content: content || href, href });
  };

  useEffect(() => {
    setContent([...block.content]);
    setHref(block.href);
  }, [block]);

  return (
    <div>
      <Label label="Add Content" required />
      <MathEditor blocks={block.content} handleChange={handleBlockChange} autoFocus />
      <div className="my-4">
        <TextInput value={href} onChange={handleLinkTextChange} label="Add URL" required />
      </div>
      <Actions handleSubmit={handleSubmit} closeModal={closeModal} />
    </div>
  );
};
