import { Block, MathEditor } from '@components/editors';
import { getBlocks } from '@components/editors/math-jax-editor/util';
import { X } from '@phosphor-icons/react';
import { IOption } from '@stores';
import { observer } from 'mobx-react-lite';

interface IProps {
  option: IOption;
  index: number;
  handleRemoveOption: (option: IOption) => void;
}

export const AddOption = observer(({ option, index, handleRemoveOption }: IProps) => {
  const handleOptionTextChange = (blocks: Block[]) => {
    option.setOption(JSON.stringify(blocks));
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
            <X weight="bold" className="w-4 h-4" />
          </div>
        )}
      </div>
    </div>
  );
});
