import { RichTextView } from '@repo/ui/content';
import { isRichTextEmpty } from '@repo/shared/utils';
import { ClockIcon, ListNumbersIcon, MedalIcon, StackIcon } from '@phosphor-icons/react';
import { useTestPaperLookups } from '@stores';
import { getPlural } from '@utils/helpers';

/** What the learner is signing up for: the paper's shape at a glance, then its own instructions. */
export const Instruction = () => {
  const testPaperStore = useTestPaperLookups();
  const { exam } = testPaperStore;
  if (!exam) return null;
  const { maxMarks, durationMins, numberOfQuestions, sections, title, instruction, isPractice } = exam;

  const facts = [
    { icon: ListNumbersIcon, value: numberOfQuestions, label: getPlural(numberOfQuestions, 'question') },
    { icon: ClockIcon, value: durationMins, label: getPlural(durationMins, 'minute') },
    { icon: MedalIcon, value: maxMarks, label: getPlural(maxMarks, 'mark') },
    { icon: StackIcon, value: sections.length, label: getPlural(sections.length, 'section') },
  ];

  return (
    <div className="flex flex-col gap-5 py-2">
      <div className="text-center text-base font-semibold">{title}</div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {facts.map((fact) => (
          <div
            key={fact.label}
            className="flex flex-col items-center gap-1 rounded-lg border border-border bg-muted/40 px-2 py-3"
          >
            <fact.icon weight="bold" className="h-5 w-5 text-primary" />
            <span className="font-mono text-lg font-semibold leading-none">{fact.value}</span>
            <span className="text-xs text-muted-foreground">{fact.label}</span>
          </div>
        ))}
      </div>
      <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
        {isPractice ? (
          <>
            <li>There is no clock. Each question is marked as soon as you answer it.</li>
            <li>The answer and solution appear under the question once it is marked.</li>
          </>
        ) : (
          <>
            <li>The clock starts when you press Start and the test is handed in when it runs out.</li>
            <li>You can mark a question for review and come back to it from the palette.</li>
            <li>Answers and solutions are shown after you submit.</li>
          </>
        )}
      </ul>
      {isRichTextEmpty(instruction) ? null : (
        <div className="rounded-lg border border-border p-4 text-sm">
          <RichTextView value={instruction} prefix="Paper instructions:" />
        </div>
      )}
    </div>
  );
};
