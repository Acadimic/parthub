import { RichTextView } from '@repo/ui/content';
import { type QuestionDto } from '@repo/shared/contracts';
import { type MarkingType } from '@repo/shared/interfaces';
import { CaretDownIcon, LightbulbIcon, PencilSimpleIcon, TagIcon, TrashIcon } from '@phosphor-icons/react';
import { Collapse, Menu } from '@repo/ui/app';
import { Badge } from '@repo/ui/core';
import { cn } from '@repo/ui/lib';
import { useStandardStore } from '@stores';
import { memo, useState } from 'react';
import { AnswerChoices } from './AnswerChoices';
import { getQuestionTypeMeta } from './question-types';

interface IProps {
  question: QuestionDto;
  /** 1-based position in its section. */
  number: number;
  isExpanded: boolean;
  /** Take their subject rather than being bound per row, so the memo below holds. */
  onToggle: (questionId: string) => void;
  onEdit: (question: QuestionDto) => void;
  onDelete: (question: QuestionDto) => void;
}

/** The mark as it is written on a paper: a negative number already carries its sign. */
const withSign = (value: number) => (value > 0 ? `+${value}` : String(value));

const MarksBadges = ({ marks }: { marks: MarkingType }) => (
  <span
    className="inline-flex items-center gap-1"
    title={`${withSign(marks.correct)} correct · ${withSign(marks.incorrect)} incorrect · ${withSign(marks.unattempted)} unattempted`}
  >
    <Badge tone="success" appearance="soft" className="px-1.5 py-0 font-mono text-xxs">
      {withSign(marks.correct)}
    </Badge>
    <Badge tone="destructive" appearance="soft" className="px-1.5 py-0 font-mono text-xxs">
      {withSign(marks.incorrect)}
    </Badge>
    <Badge tone="warning" appearance="soft" className="px-1.5 py-0 font-mono text-xxs">
      {withSign(marks.unattempted)}
    </Badge>
  </span>
);

/** The answer and solution, shown under the row once it is expanded. */
const QuestionAnswer = ({ question }: { question: QuestionDto }) => {
  const meta = getQuestionTypeMeta(question.questionType);
  const options = question.options ?? [];
  const hasSolution = Boolean(question.solution?.body?.text?.trim());

  return (
    <div className="flex flex-col gap-4 border-t border-border px-4 py-3">
      <div>
        <p className="mb-1.5 text-xxs font-semibold uppercase tracking-caps text-muted-foreground">
          {meta.hasChoices ? 'Options' : 'Answer'}
        </p>
        {meta.hasChoices ? (
          <AnswerChoices options={options} isMultiple={meta.isMultiple} />
        ) : (
          <div className="rounded-lg border border-success/50 bg-success/5 px-3 py-2 text-sm">
            <RichTextView
              value={options[0]?.body}
              fallback={<span className="text-muted-foreground">No answer set</span>}
            />
          </div>
        )}
      </div>
      <div>
        <p className="mb-1.5 flex items-center gap-1 text-xxs font-semibold uppercase tracking-caps text-muted-foreground">
          <LightbulbIcon className="h-3 w-3" />
          Solution
        </p>
        {hasSolution ? (
          <div className="rounded-lg bg-muted/40 px-3 py-2 text-sm">
            <RichTextView value={question.solution?.body} />
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">No solution added yet.</p>
        )}
      </div>
    </div>
  );
};

/**
 * One question in the paper: a card that reads at a glance and opens to show its answer.
 *
 * The number, type, marks and chapter sit on a header line of their own, and the question text
 * runs full width underneath. The number used to be a chip beside the first line of text, and
 * nothing kept the two aligned: a paragraph's line box, an equation's ascent and the chip's own
 * height all differ, so the chip sat visibly off the baseline and floated once a question ran to
 * two paragraphs. A header line has nothing to align with. The whole header and text toggle the
 * card; edit and delete live in a menu at the right, so a click on the text never lands on a
 * destructive action.
 */
export const QuestionCard = memo(function QuestionCard({
  question,
  number,
  isExpanded,
  onToggle,
  onEdit,
  onDelete,
}: IProps) {
  const meta = getQuestionTypeMeta(question.questionType);
  const TypeIcon = meta.icon;
  // The name alone: a whole-store subscription would re-render every card and undo the memo.
  const chapterName = useStandardStore((state) =>
    question.chapter ? state.chapterMap[question.chapter]?.name : undefined,
  );
  // The body mounts on the first expand and stays, so a collapsed paper renders no option lists and
  // a reopen is instant. Derived during render, not in an effect: `Collapse` measures the content in
  // its own effect, and content mounted one commit later would measure as nothing.
  const [hasOpened, setHasOpened] = useState(isExpanded);
  if (isExpanded && !hasOpened) setHasOpened(true);

  return (
    <article
      className={cn(
        'relative rounded-lg border bg-background transition-colors',
        isExpanded ? 'border-primary/40' : 'border-border',
      )}
    >
      <button
        type="button"
        onClick={() => onToggle(question._id)}
        aria-expanded={isExpanded}
        className="flex w-full flex-col gap-2 rounded-lg px-4 py-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <span className="flex w-full items-start gap-2">
          <span className="whitespace-nowrap text-xs font-semibold uppercase leading-5 tracking-caps text-primary">
            Question {number}
          </span>
          <span className="flex min-w-0 flex-1 flex-wrap items-center gap-x-2 gap-y-1">
            <Badge tone="neutral" appearance="soft" className="gap-1 px-1.5 py-0 text-xxs">
              <TypeIcon className="h-3 w-3" />
              {meta.label}
            </Badge>
            {question.markings ? <MarksBadges marks={question.markings} /> : null}
            {chapterName ? (
              <span className="inline-flex items-center gap-1 text-xxs text-muted-foreground">
                <TagIcon className="h-3 w-3" />
                {chapterName}
              </span>
            ) : null}
          </span>
          <CaretDownIcon
            className={cn(
              'mt-0.5 h-4 w-4 shrink-0 text-muted-foreground transition-transform',
              isExpanded && 'rotate-180',
            )}
            weight="bold"
          />
          {/* A spacer the width of the menu trigger, so the caret is not hidden under it. */}
          <span className="w-7 shrink-0" aria-hidden="true" />
        </span>
        <RichTextView
          value={question.body}
          className="w-full leading-6"
          fallback={<span className="text-muted-foreground">Empty question</span>}
        />
      </button>
      {/* Absolutely placed over the header row's spacer: a menu inside the toggle button would nest interactive elements. */}
      <div className="absolute right-3 top-2.5">
        <Menu
          menuItems={[
            {
              label: 'Edit question',
              onClick: () => onEdit(question),
              icon: <PencilSimpleIcon weight="bold" className="h-4 w-4" />,
            },
            {
              label: 'Delete question',
              onClick: () => onDelete(question),
              icon: <TrashIcon weight="bold" className="h-4 w-4" />,
            },
          ]}
          className="px-1"
        />
      </div>

      <Collapse isOpen={isExpanded}>{hasOpened ? <QuestionAnswer question={question} /> : null}</Collapse>
    </article>
  );
});
