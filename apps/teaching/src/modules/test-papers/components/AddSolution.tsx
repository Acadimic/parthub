import { type QuestionDto } from '@repo/shared/contracts';
import { type MarkingType } from '@repo/shared/interfaces';
import { richTextFromText } from '@repo/shared/utils';
import { CheckboxSelection, RadioSelection } from '@components/app/selections';
import { Select } from '@components/app/selects';
import { RichTextEditor, TextInput } from '@repo/ui/app';
import { RichTextContent } from '@repo/ui/core';
import { Marking, QuestionType } from '@enums';
import { type ISelectItem } from '@interfaces';
import { AddChapterButton } from '@modules/chapters/components/AddChapterButton';
import {
  useStandardLookups,
  useQuestionLookups,
  useSelectedQuestion,
  useSelectedTestPaper,
  useSelectedTestPaperSection,
} from '@stores';
import { defaultMarkings } from '@utils/constants';
import { useEffect, useState } from 'react';
import { SelectQuestionType } from './SelectQuestionType';

const MARKING_FIELDS = [
  { name: Marking.CORRECT, label: 'Correct Marks', placeholder: 'Correct' },
  { name: Marking.INCORRECT, label: 'Incorrect Marks', placeholder: 'Incorrect' },
  { name: Marking.UNATTEMPTED, label: 'Unattempted Marks', placeholder: 'Unattempted' },
];

/** The three marks-per-outcome inputs, which differ only in name and label. */
const MarkingInputs = ({
  marks,
  onChange,
}: {
  marks: Record<string, number>;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}) => (
  <div className="flex flex-col md:flex-row gap-2.5">
    {MARKING_FIELDS.map(({ name, label, placeholder }) => (
      <div key={name} className="w-full md:w-[33.33%]">
        <TextInput
          name={name}
          type="number"
          label={label}
          placeholder={placeholder}
          className="w-32"
          required
          value={marks[name] ?? ''}
          onChange={onChange}
        />
      </div>
    ))}
  </div>
);

/** Standard, subject and chapter. Chapter only applies once the first two are chosen. */
const QuestionTaxonomy = ({
  question,
  standardItems,
  subjectItems,
  getChapterItems,
  onStandardChange,
  onPatchQuestion,
}: {
  question: QuestionDto;
  standardItems: ISelectItem[];
  subjectItems: ISelectItem[];
  getChapterItems: (standard: string, subject: string) => ISelectItem[];
  onStandardChange: (values: ISelectItem[]) => void;
  onPatchQuestion: (id: string, fields: Partial<QuestionDto>) => void;
}) => (
  <div className="flex flex-col md:flex-row gap-2.5">
    <div className="flex flex-col md:flex-row gap-2.5">
      <Select
        label="Standards"
        items={standardItems}
        required
        isGrouped
        values={question.standard ? [question.standard] : []}
        onChange={onStandardChange}
        isSingleSelect
      />
      <Select
        label="Subject"
        items={subjectItems}
        values={question.subject ? [question.subject] : []}
        onChange={(values) => onPatchQuestion(question._id, { subject: values[0]?.value })}
        isSingleSelect
        isDisabled={!question.standard}
      />
    </div>
    <div className="flex items-end gap-2.5">
      {question.standard && question.subject && (
        <>
          <div className="w-full flex-1">
            <Select
              label="Chapter"
              items={getChapterItems(question.standard, question.subject)}
              values={question.chapter ? [question.chapter] : []}
              onChange={(values) => values[0] && onPatchQuestion(question._id, { chapter: values[0]?.value })}
              isSingleSelect
              required
            />
          </div>
          <div className="pb-[1px]">
            <AddChapterButton standard={question.standard} subject={question.subject} />
          </div>
        </>
      )}
    </div>
  </div>
);

/**
 * A question's subject choices, or none while it has no standard yet — `QuestionDto` leaves
 * `standard` optional because a write body need not send it. Outside the component so the guard
 * does not count against the render function's complexity.
 */
const toSubjectItems = (
  standard: string | undefined,
  getItems: (standardId: string) => ISelectItem[],
): ISelectItem[] => (standard ? getItems(standard) : []);

export const AddSolution = () => {
  const questionStore = useQuestionLookups();
  const { patchQuestion, patchOption, setSolution } = questionStore;
  const selectedTestPaperSection = useSelectedTestPaperSection();
  const selectedTestPaper = useSelectedTestPaper();
  const selectedQuestion = useSelectedQuestion();
  const { getStandardSubjectItems, getStandardItemsByIds, getChapterItems } = useStandardLookups();
  const [marks, setMarks] = useState<Record<string, number>>(defaultMarkings[QuestionType.SINGLE_CHOICE]);

  const handleCheckboxOptionClick = (optionId: string) => {
    if (!selectedQuestion) return;
    const option = (selectedQuestion.options ?? []).find((item) => item._id === optionId);
    if (!option) return;
    patchOption(selectedQuestion._id, optionId, { isCorrect: !option.isCorrect });
  };

  /** Exactly one correct answer, so selecting one clears the rest. */
  const handleRadioOptionClick = (optionId: string) => {
    if (!selectedQuestion) return;
    (selectedQuestion.options ?? []).forEach((item) =>
      patchOption(selectedQuestion._id, item._id, { isCorrect: item._id === optionId }),
    );
  };

  const handleStandardChange = (values: ISelectItem[]) => {
    if (!selectedQuestion) return;
    const value = values[0].value;
    patchQuestion(selectedQuestion._id, { standard: value });
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

  if (!selectedQuestion || !selectedTestPaper) return null;

  const questionOptions = selectedQuestion.options ?? [];
  // Built here rather than in the store so an option keeps its equations in the picker: the label
  // is a rendered node, which is what `ISelectItem.label` allows.
  const optionItems: ISelectItem[] = questionOptions.map((option) => ({
    label: <RichTextContent value={option.body} />,
    value: option._id,
  }));
  const isMultipleChoice = selectedQuestion.questionType === QuestionType.MULTIPLE_CHOICE;
  const isSingleOrBoolean =
    selectedQuestion.questionType === QuestionType.SINGLE_CHOICE ||
    selectedQuestion.questionType === QuestionType.BOOLEAN;

  return (
    <div className="flex flex-col justify-center items-center w-full gap-4 pb-8">
      <div className="w-full flex justify-end">
        <SelectQuestionType />
      </div>
      <div className="flex flex-col gap-12 w-full">
        <div className="">
          <div className="flex gap-2">
            <span className="shrink-0 text-sm font-bold text-foreground">Question:</span>
            <RichTextContent value={selectedQuestion.body} />
          </div>
          <div>
            {isMultipleChoice && (
              <CheckboxSelection
                selectedValues={questionOptions.filter((option) => option.isCorrect).map((option) => option._id)}
                label="Select one or more options."
                options={optionItems}
                handleClick={handleCheckboxOptionClick}
                required
              />
            )}
            {isSingleOrBoolean && (
              <RadioSelection
                selectedValue={questionOptions.find((option) => option.isCorrect)?._id}
                label="Select one option."
                options={optionItems}
                handleClick={handleRadioOptionClick}
                required
              />
            )}
            {!isMultipleChoice && !isSingleOrBoolean && (
              <TextInput
                placeholder="Enter Answer"
                value={questionOptions[0]?.body.text ?? ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  const [firstOption] = questionOptions;
                  // A typed-in answer is plain by nature, so it round-trips through the plain-text
                  // builder rather than opening a full editor for one number or word.
                  if (firstOption) {
                    patchOption(selectedQuestion._id, firstOption._id, {
                      body: richTextFromText(e.target.value),
                    });
                  }
                }}
              />
            )}
          </div>
        </div>
        <div className="">
          <MarkingInputs marks={marks} onChange={handleChangeMarks} />
        </div>
        <div>
          <QuestionTaxonomy
            question={selectedQuestion}
            standardItems={getStandardItemsByIds(selectedTestPaper.standards ?? [])}
            subjectItems={toSubjectItems(selectedQuestion.standard, getStandardSubjectItems)}
            getChapterItems={getChapterItems}
            onStandardChange={handleStandardChange}
            onPatchQuestion={patchQuestion}
          />
        </div>
        <div>
          <div>
            <RichTextEditor
              label="Add Solution"
              value={selectedQuestion.solution?.body}
              onChange={(body) => setSolution(selectedQuestion._id, body)}
              editorClassName="min-h-[14rem]"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
