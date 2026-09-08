import { CloudArrowUpIcon } from '@phosphor-icons/react';
import { getPlural } from '@utils/helpers';
import { Button } from '@repo/ui/app';
import { FileDropZone, IFileUploadProps } from '../selects';

export const UploadFiles = ({ ...props }: IFileUploadProps) => {
  const maxFileCount = props.maxFiles || 1;

  return (
    <FileDropZone {...props}>
      <div className="flex flex-col justify-center items-center gap w-full cursor-pointer py-2">
        <div className="flex justify-center items-center w-full gap-2">
          <div></div>
          <div className="text-sm font-medium">
            Drag and Drop Files{' '}
            <span className="text-xs text-color-secondary italic">
              ({`max ${maxFileCount} ${getPlural(maxFileCount, 'file')}`})
            </span>
          </div>
        </div>
        <div className="text-xs text-color-secondary font-medium">or</div>
        <div className="mt-2 flex flex-col items-center">
          <Button text="Browse Files" leftsection={<CloudArrowUpIcon weight="regular" className="w-5 h-5" />} />
        </div>
      </div>
    </FileDropZone>
  );
};
