import { XIcon } from '@phosphor-icons/react';
import { type OptionDto } from '@repo/shared/contracts';
import { RichTextEditor } from '@repo/ui/app';
import { Tooltip } from '@repo/ui/core';
import { useQuestionLookups } from '@stores';

interface IProps {
  questionId: string;
  option: OptionDto;
  index: number;
  onRemove: (optionId: string) => void;
  canRemove: boolean;
}

export const AddOption = ({ questionId, option, index, onRemove, canRemove }: IProps) => {
  const { patchOption } = useQuestionLookups();

  return (
    <div className="flex items-start gap-1.5">
      <div className="min-w-0 flex-1">
        <RichTextEditor
          label={`Option ${index + 1}`}
          value={option.body}
          onChange={(body) => patchOption(questionId, option._id, { body })}
          editorClassName="min-h-[6rem]"
        />
      </div>
      {canRemove ? (
        <Tooltip title="Remove this option">
          <button
            type="button"
            aria-label={`Remove option ${index + 1}`}
            onClick={() => onRemove(option._id)}
            className="mt-7 flex h-8 w-8 items-center justify-center text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <XIcon weight="bold" className="h-4 w-4" />
          </button>
        </Tooltip>
      ) : null}
    </div>
  );
};
