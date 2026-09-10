import { FileExtension, LinkType } from '@enums';
import { FilePdfIcon, ImagesIcon, LinkSimpleIcon, XIcon, YoutubeLogoIcon } from '@phosphor-icons/react';
import { Tooltip } from '@repo/ui/app';

export interface IAttachmentProps {
  fileName: string;
  url?: string;
  extension: FileExtension;
  onRemove?: (index: number) => void;
  index: number;
  isStatic?: boolean;
  className?: string;
}

const getFileIcon = (extension: FileExtension, url?: string) => {
  if (extension === FileExtension.PDF) return <FilePdfIcon weight="fill" className="w-5 h-5 text-destructive" />;
  if ([FileExtension.JPEG, FileExtension.PNG, FileExtension.JPG].includes(extension)) {
    return <ImagesIcon weight="bold" className="w-5 h-5 text-inherit" />;
  }
  if (url?.includes(LinkType.YOUTUBE)) return <YoutubeLogoIcon weight="fill" className="w-5 h-5 text-destructive" />;
  return <LinkSimpleIcon weight="bold" className="w-5 h-5 text-inherit rotate-45" />;
};

export const Attachment = ({ fileName, extension, index, onRemove, url, className }: IAttachmentProps) => {
  return (
    <div
      className={`border border-border px-2 py-1 flex items-center justify-start gap-1 text-xs font-medium rounded-full ${className ? className : ''}`}
    >
      {getFileIcon(extension, url)}
      <div
        className={`flex-1 flex justify-center items-center font-medium relative ${url ? 'cursor-pointer hover:text-primary' : ''}`}
      >
        <Tooltip title={fileName}>
          <p className="truncate max-w-[200px]">{fileName}</p>
        </Tooltip>
      </div>
      <div className="h-full">
        {onRemove && <XIcon weight="bold" className="w-4 h-4 cursor-pointer" onClick={() => onRemove(index)} />}
      </div>
    </div>
  );
};
