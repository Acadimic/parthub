import { DrawerSection } from '@repo/ui/app';
import { RichTextEditor } from '@repo/ui/editor';
import { PlusIcon } from '@phosphor-icons/react';
import { QuestionType } from '@enums';
import { Badge } from '@repo/ui/core';
import { useQuestionLookups, useSelectedQuestion, useSelectedTestPaper } from '@stores';
import { useSpeechLocale } from '@hooks/speech-locale.hook';
import { AddOption } from './AddOption';
import { getQuestionTypeMeta } from './question-types';
import { QuestionTypePicker } from './QuestionTypePicker';

/** Fewer than this and the author cannot remove one; more is the author's call. */
const MIN_OPTIONS = 2;

/**
 * Step one of the question drawer: what kind of question, the question itself, and its options.
 *
 * The answer, marks and classification wait for step two, so this screen is only the content a
 * student will read — the thing the author has in their head when they open the drawer.
 */
export const AddQuestion = () => {
  const { patchQuestion, addOption } = useQuestionLookups();
  const selectedQuestion = useSelectedQuestion();
  const selectedTestPaper = useSelectedTestPaper();
  const speechLocale = useSpeechLocale([selectedQuestion?.standard, ...(selectedTestPaper?.standards ?? [])]);

  if (!selectedQuestion) return null;

  const options = selectedQuestion.options ?? [];
  const meta = getQuestionTypeMeta(selectedQuestion.questionType);
  // True/false options are the store's, not the author's: shown, not edited.
  const isBoolean = selectedQuestion.questionType === QuestionType.BOOLEAN;

  return (
    <div className="flex flex-col gap-6">
      <DrawerSection
        title="Question type"
        hint={selectedQuestion.isNew ? undefined : 'The type is fixed once a question is saved.'}
      >
        <QuestionTypePicker />
      </DrawerSection>

      <DrawerSection title="Question" isRequired>
        <RichTextEditor
          value={selectedQuestion.body}
          onChange={(body) => patchQuestion(selectedQuestion._id, { body })}
          defaultLanguage={speechLocale}
          placeholder="Write the question. Ctrl/⌘ + E adds an equation."
          editorClassName="min-h-[10rem] rounded-lg"
        />
      </DrawerSection>

      {meta.hasChoices && !isBoolean ? (
        <DrawerSection
          title="Options"
          isRequired
          hint="Write every option here; which ones are correct is chosen on the next step."
          action={
            <button
              type="button"
              onClick={() => addOption(selectedQuestion._id)}
              className="flex h-7 items-center gap-1 rounded-md px-2 text-xs font-semibold text-primary transition-colors hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <PlusIcon className="h-3.5 w-3.5" weight="bold" />
              Add option
            </button>
          }
        >
          <div className="flex flex-col gap-3">
            {options.map((option, index) => (
              <AddOption
                key={option._id}
                questionId={selectedQuestion._id}
                option={option}
                index={index}
                canRemove={options.length > MIN_OPTIONS}
                speechLocale={speechLocale}
              />
            ))}
          </div>
        </DrawerSection>
      ) : null}

      {isBoolean ? (
        <DrawerSection
          title="Options"
          hint="The two options are fixed for a true/false question; the correct one is chosen next."
        >
          <div className="flex gap-2">
            {options.map((option) => (
              <Badge key={option._id} tone="neutral" appearance="outline" className="px-3 py-1 text-sm">
                {option.body.text}
              </Badge>
            ))}
          </div>
        </DrawerSection>
      ) : null}

      {!meta.hasChoices ? (
        <p className="rounded-lg border border-dashed border-border bg-muted/30 px-3 py-2.5 text-xs text-muted-foreground">
          {meta.description}. The answer is entered on the next step.
        </p>
      ) : null}
    </div>
  );
};
