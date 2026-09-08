import { TextArea } from '@repo/ui/app';
import { useEffect, useState } from 'react';
import { Actions } from '../Actions';
import { type CodeNode } from '../types';

interface IProps {
  block: CodeNode;
  handleChange: (block: CodeNode) => void;
  closeModal: () => void;
}

export const AddCode = ({ block, handleChange, closeModal }: IProps) => {
  const [content, setContent] = useState<string>('');

  const handleLinkTextChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = event.target.value;
    setContent(value);
  };

  const handleSubmit = () => {
    handleChange({ ...block, content });
  };

  useEffect(() => {
    setContent(block.content);
  }, [block]);

  return (
    <div>
      <div className="my-4">
        <TextArea
          value={content}
          onChange={handleLinkTextChange}
          label="Add Code"
          required
          placeholder="Write code here..."
          autoFocus
        />
      </div>
      <Actions handleSubmit={handleSubmit} closeModal={closeModal} />
    </div>
  );
};
