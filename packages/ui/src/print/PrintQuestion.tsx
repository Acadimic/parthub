import { CheckIcon, XIcon } from '@phosphor-icons/react';
import { Marking } from '@repo/shared/enums';
import type { ReactNode } from 'react';
import { RichTextView } from '../content/RichTextView';
import { cn } from '../lib/cn';
import { getAnswerLineCount, getQuestionKind, isShortOption, OPTION_LETTERS } from './question-kind';
import type { IPrintQuestion, IPrintResponse, PrintSolutions } from './types';

/** Body text inside a printout: the page's size, and paragraphs that do not add a gap at the top. */
export const PRINT_TEXT = 'text-[10.5pt] leading-[1.55] [&>p:first-child]:mt-0 [&>p:last-child]:mb-0';

export const formatMarks = (marks: number) => `${marks} ${marks === 1 ? 'mark' : 'marks'}`;

interface IProps {
  question: IPrintQuestion;
  number: number;
  /** "4 marks", or "+4 / −1" when the section does not state one rule for all its questions. */
  marksLabel: string;
  withAnswers: boolean;
  /** Only read with answers: whether the worked solution prints under the question. */
  solutions: PrintSolutions;
  /** The learner's own answer, when a submitted sitting is printed; null on a plain paper. */
  response: IPrintResponse | null;
}

const OPTION_TONES = {
  plain: { row: 'border-transparent', letter: 'border-border text-muted-foreground' },
  right: { row: 'border-success/40 bg-success/10', letter: 'border-success bg-success text-success-foreground' },
  wrong: {
    row: 'border-destructive/40 bg-destructive/10',
    letter: 'border-destructive bg-destructive text-destructive-foreground',
  },
};

/** The small caps note at the end of an option row: "Correct", "Your answer". */
const OptionNote = ({ tone, text }: { tone: 'right' | 'wrong'; text: string }) => (
  <span
    className={cn(
      'ml-auto flex shrink-0 items-center gap-1 text-[7.5pt] font-bold uppercase tracking-caps',
      tone === 'right' ? 'text-success' : 'text-destructive',
    )}
  >
    {tone === 'right' ? <CheckIcon weight="bold" className="h-3 w-3" /> : <XIcon weight="bold" className="h-3 w-3" />}
    {text}
  </span>
);

/** How one option prints: plain, the right answer, or the learner's pick and whether it was right. */
const optionLook = (isCorrect: boolean, isPicked: boolean, hasResponse: boolean) => {
  if (isPicked && isCorrect) return { tone: 'right' as const, note: 'Your answer' };
  if (isPicked) return { tone: 'wrong' as const, note: 'Your answer' };
  if (isCorrect) return { tone: 'right' as const, note: hasResponse ? 'Correct answer' : 'Correct' };
  return null;
};

const Options = ({ question, withAnswers, response }: Pick<IProps, 'question' | 'withAnswers' | 'response'>) => {
  const options = question.options ?? [];
  const isTwoUp = options.every((option) => isShortOption(option.body));
  return (
    <ol className={cn('mt-3 grid gap-x-6 gap-y-1.5', isTwoUp ? 'grid-cols-2 max-sm:grid-cols-1' : 'grid-cols-1')}>
      {options.map((option, index) => {
        const look = optionLook(withAnswers && option.isCorrect, !!response?.given.includes(option._id), !!response);
        const tone = OPTION_TONES[look?.tone ?? 'plain'];
        return (
          <li
            key={option._id}
            className={cn('flex items-start gap-2.5 rounded-lg border px-2.5 py-1.5 break-inside-avoid', tone.row)}
          >
            <span
              className={cn(
                'mt-0.5 flex h-[5.6mm] w-[5.6mm] shrink-0 items-center justify-center rounded-full border text-[8pt] font-bold',
                tone.letter,
              )}
            >
              {OPTION_LETTERS[index]}
            </span>
            <RichTextView value={option.body} className={cn(PRINT_TEXT, 'min-w-0 flex-1')} />
            {look ? <OptionNote tone={look.tone} text={look.note} /> : null}
          </li>
        );
      })}
    </ol>
  );
};

/** A labelled box holding one answer: the learner's, or the expected one. */
const AnswerChip = ({ label, tone, children }: { label: string; tone: 'right' | 'wrong'; children: ReactNode }) => (
  <div
    className={cn(
      'inline-flex min-w-[52mm] items-center gap-3 rounded-lg border px-4 py-2 text-[9pt] font-semibold',
      tone === 'right'
        ? 'border-success/40 bg-success/10 text-success'
        : 'border-destructive/40 bg-destructive/10 text-destructive',
    )}
  >
    {label}
    <span className="text-[10.5pt] font-bold">{children}</span>
  </div>
);

/** Where a typed answer goes: an empty box on the paper, the answer once revealed, and the learner's. */
const AnswerBox = ({ question, withAnswers, response }: Pick<IProps, 'question' | 'withAnswers' | 'response'>) => {
  const answer = question.options?.[0]?.body;
  const expected = withAnswers && answer?.text.trim() ? answer : null;
  if (response) {
    const given = response.given[0]?.trim();
    const isRight = response.result === Marking.CORRECT;
    return (
      <div className="mt-3 flex flex-wrap gap-2">
        <AnswerChip label="Your answer" tone={isRight ? 'right' : 'wrong'}>
          {given || 'Not answered'}
        </AnswerChip>
        {!isRight && expected ? (
          <AnswerChip label="Correct answer" tone="right">
            <RichTextView value={expected} className={cn(PRINT_TEXT, 'font-bold text-success')} />
          </AnswerChip>
        ) : null}
      </div>
    );
  }
  if (expected) {
    return (
      <div className="mt-3">
        <AnswerChip label="Answer" tone="right">
          <RichTextView value={expected} className={cn(PRINT_TEXT, 'font-bold text-success')} />
        </AnswerChip>
      </div>
    );
  }
  return (
    <div className="mt-3 flex h-[10mm] w-[52mm] items-center rounded-lg border-[1.5px] border-border px-4 text-[9pt] text-muted-foreground">
      Answer
    </div>
  );
};

const AnswerLines = ({ count }: { count: number }) => (
  <div className="mt-3">
    {Array.from({ length: count }, (_, index) => (
      <div key={index} className="h-[8mm] border-b border-border" />
    ))}
  </div>
);

/** A written answer as the learner typed it, kept to its own lines. */
const WrittenAnswer = ({ text }: { text: string }) => (
  <div className="mt-3 rounded-lg border border-border px-4 py-3">
    <p className="mb-1 text-[7.8pt] font-bold uppercase tracking-[0.1em] text-muted-foreground">Your answer</p>
    <p className="whitespace-pre-wrap text-[10.5pt] leading-[1.55]">{text || 'Not answered'}</p>
  </div>
);

const Solution = ({ question, isWritten }: { question: IPrintQuestion; isWritten: boolean }) =>
  question.solution?.body?.text.trim() ? (
    <div className="mt-3.5 rounded-lg bg-primary/10 px-4 py-3">
      <p className="mb-1 text-[7.8pt] font-bold uppercase tracking-[0.1em] text-primary">
        {isWritten ? 'Model answer' : 'Solution'}
      </p>
      <RichTextView value={question.solution.body} className={PRINT_TEXT} />
    </div>
  ) : null;

const RESULT_BADGES: Record<Marking, { text: string; className: string }> = {
  [Marking.CORRECT]: { text: 'Correct', className: 'bg-success/15 text-success' },
  [Marking.INCORRECT]: { text: 'Incorrect', className: 'bg-destructive/15 text-destructive' },
  [Marking.PARTIALLY_CORRECT]: { text: 'Partly correct', className: 'bg-warning/20 text-warning-foreground' },
  [Marking.UNATTEMPTED]: { text: 'Not attempted', className: 'bg-muted text-muted-foreground' },
};

/** One question: number, marks, body, then options, an answer box or ruled lines. */
export const PrintQuestion = ({ question, number, marksLabel, withAnswers, solutions, response }: IProps) => {
  const kind = getQuestionKind(question.questionType);
  const isWritten = kind.response === 'lines';
  const hasSolution = withAnswers && solutions === 'shown';

  let answer = null;
  if (kind.response === 'choices') {
    answer = <Options question={question} withAnswers={withAnswers} response={response} />;
  } else if (kind.response === 'box') {
    answer = <AnswerBox question={question} withAnswers={withAnswers} response={response} />;
  } else if (response) {
    answer = <WrittenAnswer text={response.given[0]?.trim() ?? ''} />;
  } else if (!hasSolution) {
    // Once the model answer is printed beneath, empty lines would only push it down the page.
    answer = <AnswerLines count={getAnswerLineCount(question.markings?.correct ?? 1)} />;
  }

  const badge = response ? RESULT_BADGES[response.result] : null;
  return (
    <div className="grid grid-cols-[8mm_1fr] gap-x-3.5 border-b border-dashed border-border pb-5 mb-5 break-inside-avoid last:mb-0 last:border-b-0 last:pb-0">
      <span className="mt-0.5 flex h-[8mm] w-[8mm] items-center justify-center rounded-full border-[1.5px] border-primary text-[9.5pt] font-extrabold text-primary">
        {number}
      </span>
      <div className="min-w-0">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="mb-1 text-[7.5pt] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
              {kind.label}
            </p>
            <RichTextView value={question.body} className={PRINT_TEXT} />
          </div>
          <span className="flex shrink-0 flex-col items-end gap-1">
            <span className="whitespace-nowrap rounded-full bg-muted px-2.5 py-0.5 text-[7.8pt] font-bold text-muted-foreground">
              {marksLabel}
            </span>
            {badge ? (
              <span
                className={cn('whitespace-nowrap rounded-full px-2.5 py-0.5 text-[7.8pt] font-bold', badge.className)}
              >
                {badge.text}
              </span>
            ) : null}
          </span>
        </div>
        {answer}
        {hasSolution ? <Solution question={question} isWritten={isWritten} /> : null}
      </div>
    </div>
  );
};
