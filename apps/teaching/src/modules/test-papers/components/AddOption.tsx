import { RichTextEditor } from '@repo/ui/editor';
import { TrashIcon } from '@phosphor-icons/react';
import { type OptionDto } from '@repo/shared/contracts';
import { Tooltip } from '@repo/ui/core';
import { useQuestionStore } from '@stores';
import { memo } from 'react';
import { optionLetter } from './question-types';

interface IProps {
  questionId: string;
  option: OptionDto;
  index: number;
  canRemove: boolean;
  /** The course's spoken language, for pronunciation marks. */
  speechLocale: string;
}

/**
 * One option being written: its letter, its editor, and a remove control when there are spares.
 *
 * Memoised, and holding only the actions it calls: each option carries a Tiptap editor, and the
 * store's lookups re-rendered all of them on every character typed into the question above.
 */
export const AddOption = memo(function AddOption({ questionId, option, index, canRemove, speechLocale }: IProps) {
  const patchOption = useQuestionStore((state) => state.patchOption);
  const removeOption = useQuestionStore((state) => state.removeOption);
  const letter = optionLetter(index);

  return (
    <div className="flex items-start gap-3">
      <span
        className="mt-9 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold text-muted-foreground"
        aria-hidden="true"
      >
        {letter}
      </span>
      <div className="min-w-0 flex-1">
        <RichTextEditor
          label={`Option ${letter}`}
          value={option.body}
          onChange={(body) => patchOption(questionId, option._id, { body })}
          placeholder="Write the option"
          defaultLanguage={speechLocale}
          editorClassName="min-h-[5.5rem] rounded-lg"
        />
      </div>
      <Tooltip title={canRemove ? `Remove option ${letter}` : 'A question needs at least two options'}>
        <button
          type="button"
          aria-label={`Remove option ${letter}`}
          disabled={!canRemove}
          onClick={() => removeOption(questionId, option._id)}
          className="mt-8 flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-muted-foreground"
        >
          <TrashIcon className="h-4 w-4" />
        </button>
      </Tooltip>
    </div>
  );
});
