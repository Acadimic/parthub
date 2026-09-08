import { type FileExtension } from '@enums';
import { errorToast } from '@utils/helpers';
import Dropzone, { type DropEvent, type FileRejection } from 'react-dropzone';
import { Attachment } from '../attachments';

export interface IFileUploadProps {
  setSelectedFiles: (files: File[]) => void;
  selectedFiles: File[];
  removeFile?: (index: number) => void;
  maxFiles?: number;
  hidePreview?: boolean;
  isPdf?: boolean;
  isImage?: boolean;
  isVideo?: boolean;
  children?: React.ReactNode;
}

export const FileDropZone = ({
  selectedFiles,
  setSelectedFiles,
  removeFile,
  maxFiles,
  hidePreview,
  isPdf,
  isImage,
  isVideo,
  children,
}: IFileUploadProps) => {
  const handleFilesChange = (files: File[]) => {
    console.log('#####files: ', files.length);
    setSelectedFiles(files);
  };

  const onDropRejected = (fileRejections: FileRejection[], event: DropEvent) => {
    if (fileRejections.length > 0) {
      const errorMessages = fileRejections
        .map((rejection) => {
          return rejection.errors.map((error) => error.message).join(', ');
        })
        .join('; ');
      errorToast({
        message: `${errorMessages}`,
        description: 'Please check the max allowed files and size.',
      });
    }
  };

  const maxFileCount = maxFiles || 1;
  const acceptedFileTypes: { [key: string]: [] } = {};
  if (isPdf) {
    acceptedFileTypes['application/pdf'] = [];
  }
  if (isImage) {
    acceptedFileTypes['image/png'] = [];
    acceptedFileTypes['image/jpeg'] = [];
    acceptedFileTypes['image/jpg'] = [];
    acceptedFileTypes['image/gif'] = [];
  }
  if (isVideo) {
    acceptedFileTypes['video/mp4'] = [];
  }

  return (
    <div className="w-full h-full flex flex-col gap-2">
      <Dropzone
        onDrop={handleFilesChange}
        maxFiles={maxFileCount}
        maxSize={50000000}
        accept={acceptedFileTypes}
        onDropRejected={onDropRejected}
        multiple={maxFileCount > 1}
      >
        {({ getRootProps, getInputProps }) => (
          <div {...getRootProps()} className="w-full h-full">
            <input {...getInputProps()} />
            {children}
          </div>
        )}
      </Dropzone>
      {hidePreview || selectedFiles.length === 0 ? null : (
        <div className="flex w-full items-center justify-start gap-1.5 flex-wrap max-w-full">
          {selectedFiles.map((file: File, index: number) => {
            return (
              <Attachment
                key={index}
                fileName={file.name}
                extension={file.name.split('.').pop() as FileExtension}
                index={index}
                onRemove={removeFile}
                url={URL.createObjectURL(file)}
                isStatic={true}
              />
            );
          })}
        </div>
      )}
    </div>
  );
};
