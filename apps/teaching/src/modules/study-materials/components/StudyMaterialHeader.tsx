import { type StandardDto, type SubjectDto } from '@repo/shared/contracts';
import { BooksIcon, ClockIcon, PaperclipIcon, PlusIcon } from '@phosphor-icons/react';
import { Button, StatTile } from '@repo/ui/app';
import { Badge } from '@repo/ui/core';
import { getStringFormattedDate } from '@utils/helpers';

interface IProps {
  standard: StandardDto;
  subject: SubjectDto;
  contentCount: number;
  durationMins: number;
  attachmentCount: number;
  lastUpdatedAt?: string;
  onAddContent: () => void;
}

/**
 * The head of a subject's material page: which standard and subject this is, how much is here,
 * and the one action that matters. The old card centred the two names over a "Number of contents"
 * line, which read as a form rather than a page.
 */
export const StudyMaterialHeader = ({
  standard,
  subject,
  contentCount,
  durationMins,
  attachmentCount,
  lastUpdatedAt,
  onAddContent,
}: IProps) => (
  <div className="flex flex-col gap-5">
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0 flex-1">
        <p className="text-xxs font-semibold uppercase tracking-caps text-muted-foreground">Study material</p>
        <div className="mt-1 flex flex-wrap items-center gap-2">
          <h1 className="break-words text-xl font-semibold text-foreground sm:truncate">{standard.name}</h1>
          <Badge tone="neutral" appearance="soft">
            {subject.name}
          </Badge>
        </div>
        <p className="mt-1.5 text-sm text-muted-foreground">
          {lastUpdatedAt ? `Last updated ${getStringFormattedDate(lastUpdatedAt)}` : 'Nothing added yet'}
        </p>
      </div>
      <Button leftsection={<PlusIcon weight="bold" className="h-4 w-4" />} text="Add content" onClick={onAddContent} />
    </div>
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
      <StatTile icon={BooksIcon} value={contentCount} label={contentCount === 1 ? 'content' : 'contents'} />
      <StatTile icon={ClockIcon} value={durationMins} label="minutes" />
      <StatTile
        icon={PaperclipIcon}
        value={attachmentCount}
        label={attachmentCount === 1 ? 'attachment' : 'attachments'}
      />
    </div>
  </div>
);
