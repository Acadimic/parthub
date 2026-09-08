import { Dropdown, Label } from '@repo/ui/app';
import { type IMenuItem } from '@interfaces';
import { useEffect, useState } from 'react';
import { Actions } from '../Actions';
import { MathEditor } from '../MathEditor';
import { type Block, type HeadingNode } from '../types';

interface IProps {
  block: HeadingNode;
  handleChange: (block: HeadingNode) => void;
  closeModal: () => void;
}

export const AddHeading = ({ block, handleChange, closeModal }: IProps) => {
  const [content, setContent] = useState<Block[]>([]);
  const [level, setLevel] = useState<number>(2);

  const handleBlockChange = (blocks: Block[]) => {
    setContent(blocks);
  };

  const handleSubmit = () => {
    handleChange({ ...block, level, content });
  };

  useEffect(() => {
    setContent([...block.content]);
    setLevel(block.level);
  }, [block]);

  const headingLevels = [2, 3, 4, 5];
  const headingLevelItems: IMenuItem[] = headingLevels.map((level) => ({
    label: `Level ${level - 1}`,
    onClick: () => setLevel(level),
  }));

  return (
    <div>
      <Label label="Add Heading" required />
      <div className="my-4 flex items-end gap-2">
        <Dropdown
          selected={`Level ${level - 1}`}
          menuItems={headingLevelItems}
          component={<div className="py-2 w-full">{`Level ${level - 1}`}</div>}
        />
        <MathEditor blocks={block.content} handleChange={handleBlockChange} autoFocus />
      </div>
      <Actions handleSubmit={handleSubmit} closeModal={closeModal} />
    </div>
  );
};
