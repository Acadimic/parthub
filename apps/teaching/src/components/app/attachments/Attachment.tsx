import { FileExtension, LinkType } from '@enums';
import {
  EyeIcon,
  FilePdfIcon,
  ImagesIcon,
  LinkSimpleIcon,
  PencilSimpleIcon,
  XIcon,
  YoutubeLogoIcon,
} from '@phosphor-icons/react';
import { Tooltip } from '@repo/ui/app';
import { cn } from '@repo/ui/lib';

export interface IAttachmentProps {
  fileName: string;
  url?: string;
  extension: FileExtension;
  onRemove?: (index: number) => void;
  /** For a link: opens its editor. */
  onEdit?: () => void;
  /** Opens the attachment in the viewer. Absent, the chip is not clickable. */
  onPreview?: () => void;
  index: number;
  isStatic?: boolean;
  className?: string;
}

const getFileIcon = (extension: FileExtension, url?: string) => {
  if (extension === FileExtension.PDF) return <FilePdfIcon weight="fill" className="h-4 w-4 text-destructive" />;
  if ([FileExtension.JPEG, FileExtension.PNG, FileExtension.JPG].includes(extension)) {
    return <ImagesIcon weight="bold" className="h-4 w-4" />;
  }
  if (url?.includes(LinkType.YOUTUBE)) return <YoutubeLogoIcon weight="fill" className="h-4 w-4 text-destructive" />;
  return <LinkSimpleIcon weight="bold" className="h-4 w-4 rotate-45" />;
};

const ACTION_CLASS =
  'flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';

/** One attachment as a chip: its kind, its name, and preview, edit and remove where they apply. */
export const Attachment = ({
  fileName,
  extension,
  index,
  onRemove,
  onEdit,
  onPreview,
  url,
  className,
}: IAttachmentProps) => (
  <div
    className={cn(
      'inline-flex max-w-full items-center gap-1.5 rounded-full border border-border bg-background py-1 pl-2.5 pr-1.5 text-xs font-medium',
      className,
    )}
  >
    <span className="shrink-0 text-muted-foreground">{getFileIcon(extension, url)}</span>
    {onPreview ? (
      <button
        type="button"
        onClick={onPreview}
        title={`Open ${fileName}`}
        className="min-w-0 truncate text-left text-foreground transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <span className="block max-w-[220px] truncate">{fileName}</span>
      </button>
    ) : (
      <Tooltip title={fileName}>
        <span className="block max-w-[220px] truncate">{fileName}</span>
      </Tooltip>
    )}
    {onPreview ? (
      <button type="button" onClick={onPreview} className={ACTION_CLASS} title="Preview">
        <EyeIcon weight="bold" className="h-3.5 w-3.5" />
      </button>
    ) : null}
    {onEdit ? (
      <button type="button" onClick={onEdit} className={ACTION_CLASS} title="Edit link">
        <PencilSimpleIcon weight="bold" className="h-3.5 w-3.5" />
      </button>
    ) : null}
    {onRemove ? (
      <button
        type="button"
        onClick={() => onRemove(index)}
        className={cn(ACTION_CLASS, 'hover:text-destructive')}
        title={`Remove ${fileName}`}
      >
        <XIcon weight="bold" className="h-3.5 w-3.5" />
      </button>
    ) : null}
  </div>
);
