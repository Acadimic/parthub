import { FileExtension, LinkType } from '@enums';
import { useAttachment } from '@hooks/attachment.hook';
import { FilePdfIcon, ImagesIcon, LinkSimpleIcon, XIcon, YoutubeLogoIcon } from '@phosphor-icons/react';
import { Spinner } from '../loaders';
import { Tooltip } from '../tooltips';

interface IProps {
  fileName: string;
  url?: string;
  extension: FileExtension;
  onRemove?: (index: number) => void;
  index: number;
  isStatic?: boolean;
  className?: string;
}

export const Attachment = ({ fileName, extension, index, onRemove, url, className, isStatic }: IProps) => {
  const { isLoadingAttachment } = useAttachment();

  return (
    <div
      className={`border border-color-border px-2 py-1 flex items-center justify-start gap-1 text-xs font-medium rounded-full ${className ? className : ''}`}
    >
      {extension === FileExtension.PDF ? (
        <FilePdfIcon weight="fill" className="w-5 h-5 text-red-primary" />
      ) : [FileExtension.JPEG, FileExtension.PNG, FileExtension.JPG].includes(extension) ? (
        <ImagesIcon weight="bold" className="w-5 h-5 text-inherit" />
      ) : url?.includes(LinkType.YOUTUBE) ? (
        <YoutubeLogoIcon weight="fill" className="w-5 h-5 text-red-primary" />
      ) : (
        <LinkSimpleIcon weight="bold" className="w-5 h-5 text-inherit rotate-45" />
      )}
      <div
        className={`flex-1 flex justify-center items-center font-medium relative ${url ? 'cursor-pointer hover:text-blue-primary' : ''}`}
        // onClick={() => handleClickAttachment(url, isStatic)}
      >
        <Tooltip title={fileName}>
          <p className={`truncate max-w-[200px] ${isLoadingAttachment ? 'opacity-0' : ''}`}>{fileName}</p>
        </Tooltip>
        {isLoadingAttachment && (
          <div className="absolute inset-0 flex justify-center items-center">
            <Spinner className="w-4 h-4" />
          </div>
        )}
      </div>
      <div className="h-full">
        {onRemove && <XIcon weight="bold" className="w-4 h-4 cursor-pointer" onClick={() => onRemove(index)} />}
      </div>
    </div>
  );
};
