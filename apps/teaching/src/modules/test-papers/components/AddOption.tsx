import { XIcon } from '@phosphor-icons/react';
import { type IOption, useQuestionLookups } from '@stores';
import { type Block, MathEditor } from '@components/editors';
import { getBlocks } from '@components/editors/math-jax-editor/util';

interface IProps {
  option: IOption;
  index: number;
  handleRemoveOption: (option: IOption) => void;
}

export const AddOption = ({ option, index, handleRemoveOption }: IProps) => {
  const { patchOption } = useQuestionLookups();

  const handleOptionTextChange = (blocks: Block[]) => {
    patchOption(option._id, { option: JSON.stringify(blocks) });
  };

  return (
    <div key={option._id} className="">
      <div className="flex items-center space-x-1.5">
        <div className="flex-1">
          <MathEditor
            label={`Option ${index + 1}`}
            handleChange={handleOptionTextChange}
            blocks={getBlocks(option.option)}
          />
        </div>
        {index !== 0 && (
          <div className="cursor-pointer" onClick={() => handleRemoveOption(option)}>
            <XIcon weight="bold" className="w-4 h-4" />
          </div>
        )}
      </div>
    </div>
  );
};
