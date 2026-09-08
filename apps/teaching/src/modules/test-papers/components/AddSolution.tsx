import { CheckboxSelection, RadioSelection } from '@components/app/selections';
import { Select } from '@components/app/selects';
import { TextInput } from '@repo/ui/app';
import { Html } from '@components/others';
import { Marking, QuestionType } from '@enums';
import { type ISelectItem } from '@interfaces';
import { AddChapterButton } from '@modules/chapters/components/AddChapterButton';
import { type MarkingType, useStores } from '@stores';
import { defaultMarkings } from '@utils/constants';
import { getStandardSelectItem } from '@utils/helpers';
import { observer } from 'mobx-react-lite';
import { useEffect, useState } from 'react';
import { SelectQuestionType } from './SelectQuestionType';
import { type Block, MathEditor } from '@components/editors';
import { getBlocks } from '@components/editors/math-jax-editor/util';

export const AddSolution = observer(() => {
  const { selectorStore, questionStore, standardStore } = useStores();
  const { selectedQuestion, selectedTestPaper, selectedTestPaperSection, selectedSolution } = selectorStore;
  const { getOptionsByIds, upsertSolution } = questionStore;
  const { getStandardsByIds, getStandardById, getStandardSubjectChapters } = standardStore;
  const [marks, setMarks] = useState<Record<string, number>>(defaultMarkings[QuestionType.SINGLE_CHOICE]);

  const handleCheckboxOptionClick = (optionId: string) => {
    if (!selectedQuestion) return;
    const options = getOptionsByIds(selectedQuestion.options);
    const option = options.find((item) => item._id === optionId);
    if (!option) return;
    option.setIsCorrect(!option.isCorrect);
  };

  const handleRadioOptionClick = (optionId: string) => {
    if (!selectedQuestion) return;
    const options = getOptionsByIds(selectedQuestion.options);
    const option = options.find((item) => item._id === optionId);
    if (!option) return;
    options.forEach((item) => item.setIsCorrect(false));
    option.setIsCorrect(true);
  };

  const handleStandardChange = (values: ISelectItem[]) => {
    const value = values[0].value;
    selectedQuestion?.setStandard(value);
  };

  const handleSolutionTextChange = (blocks: Block[]) => {
    selectedSolution?.setSolution(JSON.stringify(blocks));
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
    selectedQuestion.setMarkings(saveMarks as MarkingType);
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
                selectedValues={getOptionsByIds(selectedQuestion.options)
                  .filter((option) => option.isCorrect)
                  .map((option) => option._id)}
                label="Select one or more options."
                options={selectedQuestion.optionItems}
                handleClick={handleCheckboxOptionClick}
                required
                isHtml
              />
            ) : selectedQuestion.questionType === QuestionType.SINGLE_CHOICE ||
              selectedQuestion.questionType === QuestionType.BOOLEAN ? (
              <RadioSelection
                selectedValue={getOptionsByIds(selectedQuestion.options).find((option) => option.isCorrect)?._id}
                label="Select one option."
                options={selectedQuestion.optionItems}
                handleClick={handleRadioOptionClick}
                required
                isHtml
              />
            ) : (
              <TextInput
                placeholder="Enter Answer"
                value={getOptionsByIds(selectedQuestion.options)[0].option}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  const value = e.target.value;
                  getOptionsByIds(selectedQuestion.options)[0].setOption(value);
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
                items={getStandardsByIds(selectedTestPaper.standards).map((standard) =>
                  getStandardSelectItem(standard),
                )}
                required
                isGrouped
                values={[selectedQuestion.standard]}
                onChange={handleStandardChange}
                isSingleSelect
              />
              <Select
                label="Subject"
                items={getStandardById(selectedQuestion.standard)?.subjectItems || []}
                values={selectedQuestion.subject ? [selectedQuestion.subject] : []}
                onChange={(values) => selectedQuestion.setSubject(values[0]?.value)}
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
                      items={[
                        ...getStandardSubjectChapters(selectedQuestion.standard, selectedQuestion.subject).map(
                          (chapter) => ({ label: chapter.name, value: chapter._id }),
                        ),
                      ]}
                      values={selectedQuestion.chapter ? [selectedQuestion.chapter] : []}
                      onChange={(values) => values[0] && selectedQuestion.setChapter(values[0]?.value)}
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
});
