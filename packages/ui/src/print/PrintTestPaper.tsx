import { Marking } from '@repo/shared/enums';
import { RichTextView } from '../content/RichTextView';
import { cn } from '../lib/cn';
import { PrintDocHeader } from './PrintDocHeader';
import { formatMarks, PRINT_TEXT, PrintQuestion } from './PrintQuestion';
import { getQuestionKind, OPTION_LETTERS } from './question-kind';
import type {
  IPrintPaper,
  IPrintQuestion,
  IPrintResponse,
  IPrintSection,
  IPrintSitting,
  PrintSolutions,
  PrintVersion,
} from './types';

/** A question the sitting has no row for was never answered. */
const NOT_ATTEMPTED: IPrintResponse = { given: [], result: Marking.UNATTEMPTED };

interface ISectionGroup {
  section: IPrintSection;
  questions: IPrintQuestion[];
  /** The marking every question in the section shares, or null when they differ. */
  marking: { correct: number; incorrect: number } | null;
}

const markingOf = (question: IPrintQuestion) => ({
  correct: question.markings?.correct ?? 0,
  incorrect: Math.abs(question.markings?.incorrect ?? 0),
});

/** Sections in paper order, each with its questions in order; empty sections are dropped. */
export const groupBySection = ({ sections, questions }: IPrintPaper): ISectionGroup[] =>
  sections
    .map((section) => {
      const rows = questions.filter((question) => question.section === section._id).sort((a, b) => a.order - b.order);
      const first = rows[0] ? markingOf(rows[0]) : null;
      const isShared =
        !!first &&
        rows.every((row) => {
          const marking = markingOf(row);
          return marking.correct === first.correct && marking.incorrect === first.incorrect;
        });
      return { section, questions: rows, marking: isShared ? first : null };
    })
    .filter((group) => group.questions.length > 0);

const sumMarks = (questions: IPrintQuestion[]) => questions.reduce((sum, row) => sum + markingOf(row).correct, 0);

const marksLabelFor = (question: IPrintQuestion, isShared: boolean) => {
  const { correct, incorrect } = markingOf(question);
  return incorrect && !isShared ? `+${correct} / −${incorrect}` : formatMarks(correct);
};

const Chip = ({ children }: { children: string }) => (
  <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-[7.8pt] font-semibold text-primary">{children}</span>
);

const SectionHead = ({ group, index }: { group: ISectionGroup; index: number }) => {
  const { marking } = group;
  let chips: string[] = [];
  if (marking) {
    chips = marking.incorrect
      ? [`+${marking.correct} correct`, `−${marking.incorrect} wrong`]
      : ['No negative marking'];
  }
  return (
    <div className="break-after-avoid">
      <div className="mb-4 mt-7 flex items-center gap-4 max-sm:flex-wrap max-sm:gap-2">
        <span className="shrink-0 rounded-md bg-primary px-3 py-1 text-[9pt] font-extrabold tracking-[0.08em] text-primary-foreground">
          {OPTION_LETTERS[index]}
        </span>
        <h3 className="text-[13pt] font-extrabold">{group.section.name}</h3>
        <span className="h-px flex-1 bg-border max-sm:hidden" />
        <span className="flex gap-1.5">
          {chips.map((chip) => (
            <Chip key={chip}>{chip}</Chip>
          ))}
        </span>
      </div>
      {group.section.instruction?.text.trim() ? (
        <RichTextView
          value={group.section.instruction}
          className={cn(PRINT_TEXT, '-mt-1 mb-5 text-[9pt] text-muted-foreground')}
        />
      ) : null}
    </div>
  );
};

/** The written-out answer to one question, for the key. */
const keyAnswer = (question: IPrintQuestion): string => {
  const options = question.options ?? [];
  const response = getQuestionKind(question.questionType).response;
  if (response === 'lines') return 'Written: see model answer';
  if (response === 'box') return options[0]?.body?.text.trim() || '—';
  const letters = options.flatMap((option, index) => (option.isCorrect ? [OPTION_LETTERS[index]] : []));
  return letters.join(', ') || '—';
};

const KeyTable = ({ rows }: { rows: { number: number; question: IPrintQuestion }[] }) => (
  <table className="w-full border-separate border-spacing-0 overflow-hidden rounded-xl border border-border text-[10pt]">
    <thead>
      <tr className="bg-primary text-left text-[8pt] uppercase tracking-[0.1em] text-primary-foreground">
        <th className="px-3 py-2.5">Q</th>
        <th className="px-3 py-2.5">Answer</th>
        <th className="px-3 py-2.5">Marks</th>
      </tr>
    </thead>
    <tbody>
      {rows.map(({ number, question }) => (
        <tr key={question._id} className="break-inside-avoid even:bg-muted/40">
          <td className="w-[12mm] border-t border-border px-3 py-2.5 font-extrabold text-primary">{number}</td>
          <td className="border-t border-border px-3 py-2.5 font-bold">{keyAnswer(question)}</td>
          <td className="border-t border-border px-3 py-2.5 text-[9pt] text-muted-foreground">
            {marksLabelFor(question, false)}
          </td>
        </tr>
      ))}
    </tbody>
  </table>
);

const AnswerKey = ({ groups }: { groups: ISectionGroup[] }) => {
  const rows = groups.flatMap((group) => group.questions).map((question, index) => ({ number: index + 1, question }));
  const half = Math.ceil(rows.length / 2);
  return (
    <div className="grid grid-cols-2 items-start gap-6 max-sm:grid-cols-1 max-sm:gap-0">
      <KeyTable rows={rows.slice(0, half)} />
      {rows.length > half ? <KeyTable rows={rows.slice(half)} /> : null}
    </div>
  );
};

export interface IPrintTestPaperProps {
  paper: IPrintPaper;
  version: PrintVersion;
  solutions: PrintSolutions;
  /** The small line above the title: "Unit test · Class 11 · Physics". */
  eyebrow: string;
  /** `embedded` inside a course: a smaller heading. */
  placement: 'standalone' | 'embedded';
  /** A submitted sitting to print the learner's answers from, or null for the paper itself. */
  sitting: IPrintSitting | null;
}

/** The header figures: the paper's size, or for a sitting the score and how it split. */
const headerStats = (paper: IPrintPaper, questions: IPrintQuestion[], sitting: IPrintSitting | null) => {
  if (!sitting) {
    return [
      { value: questions.length, label: 'Questions' },
      { value: paper.paper.maxMarks || sumMarks(questions), label: 'Marks' },
      ...(paper.paper.durationMins ? [{ value: paper.paper.durationMins, label: 'Minutes' }] : []),
    ];
  }
  const count = (result: Marking) =>
    questions.filter((question) => (sitting.responses[question._id]?.result ?? Marking.UNATTEMPTED) === result).length;
  return [
    { value: `${sitting.marksObtained}/${sitting.maxMarks}`, label: 'Score' },
    { value: count(Marking.CORRECT) + count(Marking.PARTIALLY_CORRECT), label: 'Right' },
    { value: count(Marking.INCORRECT), label: 'Wrong' },
    { value: count(Marking.UNATTEMPTED), label: 'Skipped' },
  ];
};

/** A test paper in any of its three versions, on its own or as a quiz inside a course. */
export const PrintTestPaper = ({ paper, version, solutions, eyebrow, placement, sitting }: IPrintTestPaperProps) => {
  const groups = groupBySection(paper);
  const questions = groups.flatMap((group) => group.questions);
  const isEmbedded = placement === 'embedded';
  const withAnswers = version === 'answers';
  let number = 0;

  return (
    <div>
      <PrintDocHeader
        eyebrow={eyebrow}
        title={paper.paper.name}
        stats={headerStats(paper, questions, sitting)}
        size={isEmbedded ? 'small' : 'large'}
      />

      {version !== 'key' && paper.paper.instruction?.text.trim() ? (
        <div className="my-6 rounded-xl border border-border bg-muted/30 px-5 py-4 break-inside-avoid">
          <p className="text-[8pt] font-bold uppercase tracking-[0.1em] text-muted-foreground">Instructions</p>
          <RichTextView value={paper.paper.instruction} className={cn(PRINT_TEXT, 'mt-1.5 text-[9.5pt]')} />
        </div>
      ) : null}

      {version === 'key' ? (
        <div className="mt-6">
          <AnswerKey groups={groups} />
        </div>
      ) : (
        groups.map((group, index) => (
          <div key={group.section._id}>
            <SectionHead group={group} index={index} />
            {group.questions.map((question) => {
              number += 1;
              return (
                <PrintQuestion
                  key={question._id}
                  question={question}
                  number={number}
                  marksLabel={marksLabelFor(question, !!group.marking)}
                  withAnswers={withAnswers}
                  solutions={solutions}
                  response={sitting ? (sitting.responses[question._id] ?? NOT_ATTEMPTED) : null}
                />
              );
            })}
          </div>
        ))
      )}
    </div>
  );
};
