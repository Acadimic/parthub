import { type QuestionDto } from '@repo/shared/contracts';
import { BlankState } from '@components/others';
import { ArrowsInLineVerticalIcon, ArrowsOutLineVerticalIcon, PlusIcon, SparkleIcon } from '@phosphor-icons/react';
import { Button, Menu, SplitButton } from '@repo/ui/app';
import { Badge } from '@repo/ui/core';
import { type IMenuItem } from '@interfaces';
import { type ITestPaperSection } from '@stores';
import { useState } from 'react';
import { QuestionCard } from './QuestionCard';

interface IProps {
  section: ITestPaperSection;
  questions: QuestionDto[];
  onAddQuestion: () => void;
  onGenerateQuestions: () => void;
  sectionMenuItems: IMenuItem[];
  onEditQuestion: (question: QuestionDto) => void;
  onDeleteQuestion: (question: QuestionDto) => void;
}

/**
 * One section of the paper: its name and count, its actions, and its questions as cards.
 *
 * Questions start collapsed so a long section scans as a list of stems; "Expand all" is there
 * for a review pass. The empty state carries the same two actions as the header, so the first
 * question is one click from the message that says there are none.
 */
export const SectionCard = ({
  section,
  questions,
  onAddQuestion,
  onGenerateQuestions,
  sectionMenuItems,
  onEditQuestion,
  onDeleteQuestion,
}: IProps) => {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const allExpanded = questions.length > 0 && questions.every((question) => expanded.has(question._id));

  const toggle = (id: string) =>
    setExpanded((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const toggleAll = () => setExpanded(allExpanded ? new Set() : new Set(questions.map((question) => question._id)));

  const addItems: IMenuItem[] = [
    { label: 'Add question', onClick: onAddQuestion, icon: <PlusIcon weight="bold" className="h-4 w-4" /> },
    {
      label: 'Generate questions',
      onClick: onGenerateQuestions,
      icon: <SparkleIcon weight="bold" className="h-4 w-4" />,
    },
  ];

  return (
    <section className="rounded-lg border border-border bg-background">
      <header className="flex flex-wrap items-center gap-3 border-b border-border px-4 py-3">
        {/* A floor on the title's width, so when the row is tight the actions wrap under it instead of the
            name being squeezed to a few letters beside a badge that has itself broken onto two lines. */}
        <div className="flex min-w-[14rem] flex-1 items-center gap-2">
          <h2 className="truncate text-sm font-semibold text-foreground">{section.name}</h2>
          <Badge tone="neutral" appearance="soft" className="whitespace-nowrap px-1.5 py-0 text-xxs">
            {questions.length} {questions.length === 1 ? 'question' : 'questions'}
          </Badge>
        </div>
        <div className="ml-auto flex items-center gap-2">
          {questions.length > 1 ? (
            <Button
              isSubtle
              leftsection={
                allExpanded ? (
                  <ArrowsInLineVerticalIcon className="h-4 w-4" />
                ) : (
                  <ArrowsOutLineVerticalIcon className="h-4 w-4" />
                )
              }
              text={allExpanded ? 'Collapse all' : 'Expand all'}
              onClick={toggleAll}
            />
          ) : null}
          <SplitButton menuItems={addItems} text="Add question" onClick={onAddQuestion} />
          <Menu menuItems={sectionMenuItems} className="px-1" />
        </div>
      </header>

      <div className="flex flex-col gap-2 p-3">
        {questions.length ? (
          questions.map((question, index) => (
            <QuestionCard
              key={question._id}
              question={question}
              number={index + 1}
              isExpanded={expanded.has(question._id)}
              onToggle={() => toggle(question._id)}
              onEdit={() => onEditQuestion(question)}
              onDelete={() => onDeleteQuestion(question)}
            />
          ))
        ) : (
          <BlankState
            label="No questions in this section"
            description="Write one at a time, or generate a batch from a document."
            className="py-8"
            action={
              <div className="flex flex-wrap justify-center gap-2">
                <Button
                  text="Add question"
                  leftsection={<PlusIcon weight="bold" className="h-4 w-4" />}
                  onClick={onAddQuestion}
                />
                <Button
                  isSecondary
                  text="Generate questions"
                  leftsection={<SparkleIcon weight="bold" className="h-4 w-4" />}
                  onClick={onGenerateQuestions}
                />
              </div>
            }
          />
        )}
      </div>
    </section>
  );
};
