import { RichTextView } from '@repo/ui/content';
import { RichTextEditor } from '@repo/ui/editor';
import { type OptionDto, type QuestionDto } from '@repo/shared/contracts';
import { type MarkingType } from '@repo/shared/interfaces';
import { richTextFromMarkdown } from '@repo/shared/utils';
import { CheckboxSelection, RadioSelection } from '@components/app/selections';
import { Select } from '@components/app/selects';
import { TextInput } from '@repo/ui/app';
import { Marking, QuestionType } from '@enums';
import { type ISelectItem } from '@interfaces';
import { AddChapterButton } from '@modules/chapters/components/AddChapterButton';
import { useStandardLookups, useQuestionLookups, useSelectedQuestion, useSelectedTestPaper } from '@stores';
import { useEffect, useState } from 'react';
import { SelectQuestionType } from './SelectQuestionType';

const MARKING_FIELDS = [
  { name: Marking.CORRECT, label: 'Correct Marks', placeholder: 'Correct' },
  { name: Marking.INCORRECT, label: 'Incorrect Marks', placeholder: 'Incorrect' },
  { name: Marking.UNATTEMPTED, label: 'Unattempted Marks', placeholder: 'Unattempted' },
];

/**
 * What the marks inputs hold: text, not numbers.
 *
 * A negative mark passes through "-" on its way to "-1", and a cleared field through "", neither of
 * which is a number. Keeping the raw text here is what lets the author type one — the store is
 * patched from it separately, so a half-typed value never has to round-trip through `Number`.
 */
type IMarkInputs = Record<Marking, string>;

const toMarkInputs = (markings?: MarkingType): IMarkInputs => {
  const inputs = {} as IMarkInputs;
  Object.values(Marking).forEach((marking) => {
    const value = markings?.[marking];
    inputs[marking] = value === undefined ? '' : String(value);
  });
  return inputs;
};

/**
 * The marks to store for a set of inputs.
 *
 * Every key is written on every change, an unparseable field as 0. The previous version deleted the
 * key instead and refilled it afterwards, so the store never saw `-` and a negative mark could not
 * be typed at all; `MarkingsDto` requires all three, so a missing one also failed validation.
 */
const toMarkings = (inputs: IMarkInputs): MarkingType => {
  const parse = (value: string) => {
    const parsed = parseFloat(value);
    return Number.isFinite(parsed) ? parsed : 0;
  };
  return {
    [Marking.CORRECT]: parse(inputs[Marking.CORRECT]),
    [Marking.INCORRECT]: parse(inputs[Marking.INCORRECT]),
    [Marking.UNATTEMPTED]: parse(inputs[Marking.UNATTEMPTED]),
    [Marking.PARTIALLY_CORRECT]: parse(inputs[Marking.PARTIALLY_CORRECT]),
  };
};

/** The three marks-per-outcome inputs, which differ only in name and label. */
const MarkingInputs = ({
  marks,
  onChange,
}: {
  marks: IMarkInputs;
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
          className="w-32 font-mono"
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

/** The typed-in answer for a question that has no options list, as text the input can hold. */
const toAnswerText = (options: OptionDto[]): string => options[0]?.body.text ?? '';

export const AddSolution = () => {
  const questionStore = useQuestionLookups();
  const { patchQuestion, patchOption, setSolution } = questionStore;
  const selectedTestPaper = useSelectedTestPaper();
  const selectedQuestion = useSelectedQuestion();
  const { getStandardSubjectItems, getStandardItemsByIds, getChapterItems } = useStandardLookups();
  const [marks, setMarks] = useState<IMarkInputs>(() => toMarkInputs(selectedQuestion?.markings));

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
    if (!selectedQuestion) return;
    const { name, value } = e.target;
    const newMarks: IMarkInputs = { ...marks, [name as Marking]: value };
    setMarks(newMarks);
    patchQuestion(selectedQuestion._id, { markings: toMarkings(newMarks) });
  };

  // Keyed on the type as well as the id: changing a question's type replaces its marks with the
  // section's defaults for the new type, and the inputs have to follow.
  useEffect(() => {
    setMarks(toMarkInputs(selectedQuestion?.markings));
  }, [selectedQuestion?._id, selectedQuestion?.questionType]);

  if (!selectedQuestion || !selectedTestPaper) return null;

  const questionOptions = selectedQuestion.options ?? [];
  // Built here rather than in the store so an option keeps its equations in the picker: the label
  // is a rendered node, which is what `ISelectItem.label` allows.
  const optionItems: ISelectItem[] = questionOptions.map((option) => ({
    label: <RichTextView value={option.body} />,
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
            <RichTextView value={selectedQuestion.body} />
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
                value={toAnswerText(questionOptions)}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  const [firstOption] = questionOptions;
                  // A typed-in answer is plain by nature, so it round-trips through the plain-text
                  // builder rather than opening a full editor for one number or word.
                  if (firstOption) {
                    patchOption(selectedQuestion._id, firstOption._id, {
                      body: richTextFromMarkdown(e.target.value),
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
