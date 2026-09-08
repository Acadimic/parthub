import { type MarkingType } from '@repo/shared';
import { CheckboxSelection, RadioSelection } from '@components/app/selections';
import { Select } from '@components/app/selects';
import { TextInput } from '@repo/ui/app';
import { Html } from '@components/others';
import { Marking, QuestionType } from '@enums';
import { type ISelectItem } from '@interfaces';
import { AddChapterButton } from '@modules/chapters/components/AddChapterButton';
import {
  useStandardLookups,
  useQuestionLookups,
  useSelectedQuestion,
  useSelectedSolution,
  useSelectedTestPaper,
  useSelectedTestPaperSection,
} from '@stores';
import { defaultMarkings } from '@utils/constants';
import { useEffect, useState } from 'react';
import { SelectQuestionType } from './SelectQuestionType';
import { type Block, MathEditor } from '@components/editors';
import { getBlocks } from '@components/editors/math-jax-editor/util';

export const AddSolution = () => {
  const questionStore = useQuestionLookups();
  const { patchSolution } = questionStore;
  const { getOptionItems } = questionStore;
  const { patchQuestion } = questionStore;
  const { patchOption } = questionStore;
  const selectedTestPaperSection = useSelectedTestPaperSection();
  const selectedTestPaper = useSelectedTestPaper();
  const selectedSolution = useSelectedSolution();
  const selectedQuestion = useSelectedQuestion();
  const { getOptionsByIds, upsertSolution } = questionStore;
  const { getStandardSubjectItems, getStandardItemsByIds, getChapterItems } = useStandardLookups();
  const [marks, setMarks] = useState<Record<string, number>>(defaultMarkings[QuestionType.SINGLE_CHOICE]);

  const handleCheckboxOptionClick = (optionId: string) => {
    if (!selectedQuestion) return;
    const options = getOptionsByIds(selectedQuestion.options ?? []);
    const option = options.find((item) => item._id === optionId);
    if (!option) return;
    patchOption(option._id, { isCorrect: !option.isCorrect });
  };

  const handleRadioOptionClick = (optionId: string) => {
    if (!selectedQuestion) return;
    const options = getOptionsByIds(selectedQuestion.options ?? []);
    const option = options.find((item) => item._id === optionId);
    if (!option) return;
    options.forEach((item) => patchOption(item._id, { isCorrect: false }));
    patchOption(option._id, { isCorrect: true });
  };

  const handleStandardChange = (values: ISelectItem[]) => {
    if (!selectedQuestion) return;
    const value = values[0].value;
    patchQuestion(selectedQuestion._id, { standard: value });
  };

  const handleSolutionTextChange = (blocks: Block[]) => {
    if (!selectedSolution) return;
    patchSolution(selectedSolution._id, { solution: JSON.stringify(blocks) });
  };

  const handleChangeMarks = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!selectedQuestion || !selectedTestPaperSection) return;
    const { name, value } = e.target;
    const numberValue = parseFloat(value);
    const newMarks = { ...marks };
    if (Number.isNaN(numberValue)) delete newMarks[name as Marking];
    else newMarks[name as Marking] = numberValue;
    setMarks(newMarks);
    const saveMarks = { ...newMarks };
    Object.values(Marking).forEach((marking) => {
      if (!saveMarks[marking]) saveMarks[marking] = 0;
    });
    patchQuestion(selectedQuestion._id, { markings: saveMarks as MarkingType });
  };

  useEffect(() => {
    if (selectedQuestion) setMarks({ ...selectedQuestion.markings });
  }, [selectedQuestion?._id]);

  useEffect(() => {
    if (selectedQuestion) upsertSolution(selectedQuestion._id);
  }, [selectedQuestion?._id]);

  if (!selectedQuestion || !selectedTestPaper) return null;

  return (
    <div className="flex flex-col justify-center items-center w-full gap-4 pb-8">
      <div className="w-full flex justify-end">
        <SelectQuestionType />
      </div>
      <div className="flex flex-col gap-12 w-full">
        <div className="">
          <Html html={selectedQuestion.question} prefix="Question:" />
          <div>
            {selectedQuestion.questionType === QuestionType.MULTIPLE_CHOICE ? (
              <CheckboxSelection
                selectedValues={getOptionsByIds(selectedQuestion.options ?? [])
                  .filter((option) => option.isCorrect)
                  .map((option) => option._id)}
                label="Select one or more options."
                options={getOptionItems(selectedQuestion._id)}
                handleClick={handleCheckboxOptionClick}
                required
                isHtml
              />
            ) : selectedQuestion.questionType === QuestionType.SINGLE_CHOICE ||
              selectedQuestion.questionType === QuestionType.BOOLEAN ? (
              <RadioSelection
                selectedValue={getOptionsByIds(selectedQuestion.options ?? []).find((option) => option.isCorrect)?._id}
                label="Select one option."
                options={getOptionItems(selectedQuestion._id)}
                handleClick={handleRadioOptionClick}
                required
                isHtml
              />
            ) : (
              <TextInput
                placeholder="Enter Answer"
                value={getOptionsByIds(selectedQuestion.options ?? [])[0].option}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  const value = e.target.value;
                  const [firstOption] = getOptionsByIds(selectedQuestion.options ?? []);
                  if (firstOption) patchOption(firstOption._id, { option: value });
                }}
              />
            )}
          </div>
        </div>
        <div className="">
          <div className="flex flex-col md:flex-row gap-2.5">
            <div className="w-full md:w-[33.33%]">
              <TextInput
                name={Marking.CORRECT}
                type="number"
                label="Correct Marks"
                placeholder="Correct"
                className="w-32"
                required
                value={marks[Marking.CORRECT] === undefined ? '' : marks[Marking.CORRECT]}
                onChange={handleChangeMarks}
              />
            </div>
            <div className="w-full md:w-[33.33%]">
              <TextInput
                name={Marking.INCORRECT}
                type="number"
                label="Incorrect Marks"
                placeholder="Incorrect"
                className="w-32"
                required
                value={marks[Marking.INCORRECT] === undefined ? '' : marks[Marking.INCORRECT]}
                onChange={handleChangeMarks}
              />
            </div>
            <div className="w-full md:w-[33.33%]">
              <TextInput
                name={Marking.UNATTEMPTED}
                type="number"
                label="Unattempted Marks"
                placeholder="Unattempted"
                className="w-32"
                required
                value={marks[Marking.UNATTEMPTED] === undefined ? '' : marks[Marking.UNATTEMPTED]}
                onChange={handleChangeMarks}
              />
            </div>
          </div>
        </div>
        <div>
          <div className="flex flex-col md:flex-row gap-2.5">
            <div className="flex flex-col md:flex-row gap-2.5">
              <Select
                label="Standards"
                items={getStandardItemsByIds(selectedTestPaper.standards ?? [])}
                required
                isGrouped
                values={[selectedQuestion.standard]}
                onChange={handleStandardChange}
                isSingleSelect
              />
              <Select
                label="Subject"
                items={getStandardSubjectItems(selectedQuestion.standard) || []}
                values={selectedQuestion.subject ? [selectedQuestion.subject] : []}
                onChange={(values) => patchQuestion(selectedQuestion._id, { subject: values[0]?.value })}
                isSingleSelect
                isDisabled={!selectedQuestion.standard}
              />
            </div>
            <div className="flex items-end gap-2.5">
              {selectedQuestion.standard && selectedQuestion.subject && (
                <>
                  <div className="w-full flex-1">
                    <Select
                      label="Chapter"
                      items={getChapterItems(selectedQuestion.standard, selectedQuestion.subject)}
                      values={selectedQuestion.chapter ? [selectedQuestion.chapter] : []}
                      onChange={(values) =>
                        values[0] && patchQuestion(selectedQuestion._id, { chapter: values[0]?.value })
                      }
                      isSingleSelect
                      required
                    />
                  </div>
                  <div className="pb-[1px]">
                    <AddChapterButton standard={selectedQuestion.standard} subject={selectedQuestion.subject} />
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
        <div>
          <div>
            {selectedSolution && (
              <MathEditor
                label="Add Solution"
                handleChange={handleSolutionTextChange}
                blocks={getBlocks(selectedSolution.solution)}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
