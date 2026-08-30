import { FileExtension, LinkType } from '@enums';
import { FilePdf, Images, LinkSimple, X, YoutubeLogo } from '@phosphor-icons/react';
import { Tooltip } from '../tooltips';

export interface IAttachmentProps {
  fileName: string;
  url?: string;
  extension: FileExtension;
  onRemove?: (index: number) => void;
  index: number;
  isStatic?: boolean;
  className?: string;
}

export const Attachment = ({ fileName, extension, index, onRemove, url, className }: IAttachmentProps) => {
  return (
    <div
      className={`border border-color-border px-2 py-1 flex items-center justify-start gap-1 text-xs font-medium rounded-full ${className ? className : ''}`}
    >
      {extension === FileExtension.PDF ? (
        <FilePdf weight="fill" className="w-5 h-5 text-red-primary" />
      ) : [FileExtension.JPEG, FileExtension.PNG, FileExtension.JPG].includes(extension) ? (
        <Images weight="bold" className="w-5 h-5 text-inherit" />
      ) : url?.includes(LinkType.YOUTUBE) ? (
        <YoutubeLogo weight="fill" className="w-5 h-5 text-red-primary" />
      ) : (
        <LinkSimple weight="bold" className="w-5 h-5 text-inherit rotate-45" />
      )}
      <div
        className={`flex-1 flex justify-center items-center font-medium relative ${url ? 'cursor-pointer hover:text-blue-primary' : ''}`}
      >
        <Tooltip title={fileName}>
          <p className="truncate max-w-[200px]">{fileName}</p>
        </Tooltip>
      </div>
      <div className="h-full">
        {onRemove && <X weight="bold" className="w-4 h-4 cursor-pointer" onClick={() => onRemove(index)} />}
      </div>
    </div>
  );
};
