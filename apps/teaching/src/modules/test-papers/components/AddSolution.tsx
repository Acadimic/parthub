import { RichTextView } from '@repo/ui/content';
import { RichTextEditor } from '@components/others';
import { type OptionDto, type QuestionDto } from '@repo/shared/contracts';
import { type MarkingType } from '@repo/shared/interfaces';
import { richTextFromMarkdown } from '@repo/shared/utils';
import { Select } from '@components/app/selects';
import { Badge } from '@repo/ui/core';
import { TextInput, DrawerSection } from '@repo/ui/app';
import { Marking, QuestionType } from '@enums';
import { type ISelectItem } from '@interfaces';
import { AddChapterButton } from '@modules/chapters/components/AddChapterButton';
import { useStandardLookups, useQuestionLookups, useSelectedQuestion, useSelectedTestPaper } from '@stores';
import { useSpeechLocale } from '@hooks/speech-locale.hook';
import { useEffect, useState } from 'react';
import { AnswerChoices } from './AnswerChoices';
import { getQuestionTypeMeta } from './question-types';

const MARKING_FIELDS: { name: Marking; label: string; tone: string }[] = [
  { name: Marking.CORRECT, label: 'Correct', tone: 'text-success' },
  { name: Marking.INCORRECT, label: 'Incorrect', tone: 'text-destructive' },
  { name: Marking.UNATTEMPTED, label: 'Unattempted', tone: 'text-muted-foreground' },
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

/** Every key is written on every change, an unparseable field as 0; `MarkingsDto` requires all three. */
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

/** The three marks-per-outcome inputs in one row, coloured the way the paper shows them. */
const MarkingInputs = ({
  marks,
  onChange,
}: {
  marks: IMarkInputs;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}) => (
  <div className="grid grid-cols-3 gap-3">
    {MARKING_FIELDS.map(({ name, label, tone }) => (
      <label key={name} className="flex flex-col gap-1">
        <span className={`text-xs font-semibold ${tone}`}>{label}</span>
        <TextInput
          name={name}
          type="number"
          step="0.5"
          placeholder="0"
          className="font-mono"
          value={marks[name] ?? ''}
          onChange={onChange}
          aria-label={`${label} marks`}
        />
      </label>
    ))}
  </div>
);

/** Standard, subject and chapter. Chapter only applies once the first two are chosen. */
const QuestionTaxonomy = ({
  question,
  standardItems,
  subjectItems,
  getChapterItems,
  onPatchQuestion,
}: {
  question: QuestionDto;
  standardItems: ISelectItem[];
  subjectItems: ISelectItem[];
  getChapterItems: (standard: string, subject: string) => ISelectItem[];
  onPatchQuestion: (id: string, fields: Partial<QuestionDto>) => void;
}) => (
  <div className="grid gap-3 sm:grid-cols-2">
    <Select
      label="Standard"
      items={standardItems}
      required
      isGrouped
      values={question.standard ? [question.standard] : []}
      onChange={(values) => values[0] && onPatchQuestion(question._id, { standard: values[0].value })}
      isSingleSelect
    />
    <Select
      label="Subject"
      items={subjectItems}
      values={question.subject ? [question.subject] : []}
      onChange={(values) => onPatchQuestion(question._id, { subject: values[0]?.value })}
      isSingleSelect
      isDisabled={!question.standard}
      placeholder={question.standard ? 'Select subject' : 'Choose a standard first'}
    />
    {question.standard && question.subject ? (
      <div className="flex items-end gap-2 sm:col-span-2">
        <div className="min-w-0 flex-1">
          <Select
            label="Chapter"
            items={getChapterItems(question.standard, question.subject)}
            values={question.chapter ? [question.chapter] : []}
            onChange={(values) => values[0] && onPatchQuestion(question._id, { chapter: values[0]?.value })}
            isSingleSelect
            required
          />
        </div>
        <div className="pb-px">
          <AddChapterButton standard={question.standard} subject={question.subject} />
        </div>
      </div>
    ) : null}
  </div>
);

/** A question's subject choices, or none while it has no standard yet. */
const toSubjectItems = (
  standard: string | undefined,
  getItems: (standardId: string) => ISelectItem[],
): ISelectItem[] => (standard ? getItems(standard) : []);

/** The typed-in answer for a question that has no options list, as text the input can hold. */
const toAnswerText = (options: OptionDto[]): string => options[0]?.body.text ?? '';

const answerHint = (hasChoices: boolean, isMultiple: boolean) => {
  if (!hasChoices) return 'What the student has to enter to be marked correct.';
  return isMultiple ? 'Tick every option that is correct.' : 'Pick the one correct option.';
};

/**
 * Step two of the question drawer: the answer, the marks, where the question belongs, and the
 * worked solution. The question is shown at the top, read-only, so the author marks the answer
 * against the text they wrote rather than from memory.
 */
export const AddSolution = () => {
  const { patchQuestion, patchOption, setSolution } = useQuestionLookups();
  const selectedTestPaper = useSelectedTestPaper();
  const selectedQuestion = useSelectedQuestion();
  const speechLocale = useSpeechLocale([selectedQuestion?.standard, ...(selectedTestPaper?.standards ?? [])]);
  const { getStandardSubjectItems, getStandardItemsByIds, getChapterItems } = useStandardLookups();
  const [marks, setMarks] = useState<IMarkInputs>(() => toMarkInputs(selectedQuestion?.markings));

  // Keyed on the type as well as the id: changing a question's type replaces its marks with the
  // section's defaults for the new type, and the inputs have to follow.
  useEffect(() => {
    setMarks(toMarkInputs(selectedQuestion?.markings));
  }, [selectedQuestion?._id, selectedQuestion?.questionType]);

  if (!selectedQuestion || !selectedTestPaper) return null;

  const meta = getQuestionTypeMeta(selectedQuestion.questionType);
  const options = selectedQuestion.options ?? [];
  const TypeIcon = meta.icon;

  const toggleOption = (optionId: string) => {
    if (meta.isMultiple) {
      const option = options.find((item) => item._id === optionId);
      if (option) patchOption(selectedQuestion._id, optionId, { isCorrect: !option.isCorrect });
      return;
    }
    // Exactly one correct answer, so selecting one clears the rest.
    options.forEach((item) => patchOption(selectedQuestion._id, item._id, { isCorrect: item._id === optionId }));
  };

  const handleChangeMarks = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    const next: IMarkInputs = { ...marks, [name as Marking]: value };
    setMarks(next);
    patchQuestion(selectedQuestion._id, { markings: toMarkings(next) });
  };

  const setTypedAnswer = (text: string) => {
    const [first] = options;
    // A typed-in answer is plain by nature, so it round-trips through the plain-text builder
    // rather than opening a full editor for one number or word.
    if (first) patchOption(selectedQuestion._id, first._id, { body: richTextFromMarkdown(text) });
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-lg border border-border bg-muted/30 px-4 py-3">
        <div className="mb-1.5 flex items-center gap-2">
          <Badge tone="neutral" appearance="soft" className="gap-1.5">
            <TypeIcon className="h-3.5 w-3.5" />
            {meta.label}
          </Badge>
          <span className="text-xxs font-semibold uppercase tracking-caps text-muted-foreground">Question</span>
        </div>
        <RichTextView value={selectedQuestion.body} />
      </div>

      <DrawerSection title="Correct answer" isRequired hint={answerHint(meta.hasChoices, meta.isMultiple)}>
        {meta.hasChoices ? (
          <AnswerChoices options={options} isMultiple={meta.isMultiple} onToggle={toggleOption} />
        ) : (
          <TextInput
            placeholder={selectedQuestion.questionType === QuestionType.INTEGER ? 'e.g. 42' : 'The expected answer'}
            value={toAnswerText(options)}
            onChange={(event: React.ChangeEvent<HTMLInputElement>) => setTypedAnswer(event.target.value)}
            aria-label="Correct answer"
          />
        )}
      </DrawerSection>

      <DrawerSection
        title="Marks"
        hint="Filled from the section's default marking; change them for this question only."
      >
        <MarkingInputs marks={marks} onChange={handleChangeMarks} />
      </DrawerSection>

      <DrawerSection title="Classification" hint="Where the question sits in the syllabus, for filtering and reports.">
        <QuestionTaxonomy
          question={selectedQuestion}
          standardItems={getStandardItemsByIds(selectedTestPaper.standards ?? [])}
          subjectItems={toSubjectItems(selectedQuestion.standard, getStandardSubjectItems)}
          getChapterItems={getChapterItems}
          onPatchQuestion={patchQuestion}
        />
      </DrawerSection>

      <DrawerSection title="Solution" hint="Shown to the student after the attempt. Optional, but worth it.">
        <RichTextEditor
          value={selectedQuestion.solution?.body}
          onChange={(body) => setSolution(selectedQuestion._id, body)}
          placeholder="Explain the working, step by step."
          defaultLanguage={speechLocale}
          editorClassName="min-h-[10rem] rounded-lg"
        />
      </DrawerSection>
    </div>
  );
};
