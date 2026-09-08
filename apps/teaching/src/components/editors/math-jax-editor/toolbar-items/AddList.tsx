import { Button, Label } from '@repo/ui/app';
import { PlusIcon, XIcon } from '@phosphor-icons/react';
import { useEffect, useState } from 'react';
import { Actions } from '../Actions';
import { MathEditor } from '../MathEditor';
import { type Block, EditorContentType, type ListNode, type OrderedListNode } from '../types';
import { getEditorInitialContent } from '../util';

interface IProps {
  isOrdered: boolean;
  block: ListNode | OrderedListNode;
  handleChange: (block: ListNode | OrderedListNode) => void;
  closeModal: () => void;
}

export const AddList = ({ block, handleChange, closeModal, isOrdered }: IProps) => {
  const [content, setContent] = useState<Block[]>([]);
  const [items, setItems] = useState<Block[][]>([]);

  const handleContentChange = (blocks: Block[]) => {
    setContent(blocks);
  };

  const handleItemChange = (index: number, blocks: Block[]) => {
    const newItems = [...items];
    newItems[index] = blocks;
    setItems(newItems);
  };

  const handleSubmit = () => {
    handleChange({ ...block, content, items });
  };

  const handleAddItem = () => {
    setItems([...items, [getEditorInitialContent(EditorContentType.TEXT)]]);
  };

  const handleRemoveItem = (index: number) => {
    const newItems = [...items];
    newItems.splice(index, 1);
    setItems(newItems);
  };

  useEffect(() => {
    setContent([...block.content]);
    setItems([...block.items]);
  }, [block]);

  return (
    <div>
      <Label label={isOrdered ? 'Add Ordered List' : 'Add List'} required />
      <MathEditor blocks={block.content} handleChange={handleContentChange} autoFocus />
      <div className="flex flex-col gap-4 my-4">
        {items.map((item, index) => (
          <div key={index} className="flex items-center gap-2">
            <div className={`text-sm ${isOrdered ? 'pt-[68px]' : 'pt-[68px]'} font-bold`}>
              {isOrdered ? `${index + 1}.` : <span className="text-2xl">•</span>}
            </div>
            <div className="flex-1 w-full overflow-hidden">
              <MathEditor
                blocks={item}
                handleChange={(blocks) => handleItemChange(index, blocks)}
                label={`List Item ${index + 1}`}
              />
            </div>
            <div className="cursor-pointer pt-[68px]" onClick={() => handleRemoveItem(index)}>
              <XIcon weight="bold" className="w-4 h-4" />
            </div>
          </div>
        ))}
      </div>
      <div className="flex justify-start pt-2 mb-4">
        <Button
          isSecondary
          text="Add Item"
          leftsection={<PlusIcon weight="bold" className="w-4 h-4" />}
          onClick={handleAddItem}
        />
      </div>
      <Actions handleSubmit={handleSubmit} closeModal={closeModal} />
    </div>
  );
};
