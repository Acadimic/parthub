import { Button } from '@repo/ui/app';
import { PlusIcon } from '@phosphor-icons/react';
import { QuestionType } from '@enums';
import { type IOption, useStores } from '@stores';
import { observer } from 'mobx-react-lite';
import { AddOption } from './AddOption';
import { SelectQuestionType } from './SelectQuestionType';
import { type Block, MathEditor } from '@components/editors';
import { getBlocks } from '@components/editors/math-jax-editor/util';

export const AddQuestion = observer(() => {
  const { selectorStore, questionStore } = useStores();
  const { selectedQuestion } = selectorStore;
  const { getOptionsByIds, createOption, removeOptionById } = questionStore;

  const handleQuestionTextChange = (blocks: Block[]) => {
    selectedQuestion?.setQuestion(JSON.stringify(blocks));
  };

  const handleAddOption = () => {
    if (!selectedQuestion) return;
    const newOption = createOption(selectedQuestion._id);
    selectedQuestion.setOptions([...selectedQuestion.options, newOption._id]);
  };

  const handleRemoveOption = (option: IOption) => {
    if (!selectedQuestion || selectedQuestion.options.length === 1) return;
    selectedQuestion.setOptions(selectedQuestion.options.filter((id) => id !== option._id));
    removeOptionById(option._id);
  };

  if (!selectedQuestion) return null;

  return (
    <div className="flex flex-col justify-center items-center w-full">
      <div className="flex justify-end w-full">
        <SelectQuestionType />
      </div>
      <div className="flex flex-col gap-4 w-full">
        <div>
          <MathEditor handleChange={handleQuestionTextChange} blocks={getBlocks(selectedQuestion.question)} autoFocus />
        </div>
        <div className="flex flex-col gap-3">
          {selectedQuestion.questionType === QuestionType.SINGLE_CHOICE ||
          selectedQuestion.questionType === QuestionType.MULTIPLE_CHOICE ? (
            <>
              {getOptionsByIds(selectedQuestion.options).map((option, index) => {
                return (
                  <AddOption key={option._id} option={option} index={index} handleRemoveOption={handleRemoveOption} />
                );
              })}
              <div className="flex justify-end pt-2 pb-8">
                <Button
                  isSecondary
                  text="Add Option"
                  leftsection={<PlusIcon weight="bold" className="w-4 h-4" />}
                  onClick={handleAddOption}
                />
              </div>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
});
