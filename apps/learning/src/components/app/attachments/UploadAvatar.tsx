import { CameraIcon, PlusIcon, XIcon } from '@phosphor-icons/react';
import { useState } from 'react';
import { Button, SoftConfirmModal } from '@repo/ui/app';
import { FileDropZone } from '../selects';
import { PresignedImage } from './PresignedImage';

interface IProps {
  file?: File;
  url?: string | null;
  setFile: (file: File) => void;
  removeFile: () => void;
}

export const UploadAvatar = ({ file, url, setFile, removeFile }: IProps) => {
  const fileUrl = file ? URL.createObjectURL(file) : url;
  const [isOpenConfirmation, setIsOpenConfirmation] = useState(false);

  const setSelectedFiles = (files: File[]) => {
    if (files.length === 0) return;
    const file = files[0];
    if (file) setFile(file);
  };

  const handleCancel = () => {
    setIsOpenConfirmation(false);
  };

  const handleRemoveFile = () => {
    removeFile();
    handleCancel();
  };

  const buttonComponent = (
    <Button
      isSubtle
      leftsection={
        fileUrl ? <XIcon weight="bold" className="w-4 h-4" /> : <PlusIcon weight="bold" className="w-4 h-4" />
      }
      text={fileUrl ? 'Remove' : 'Upload'}
      className="text-xs px-2 font-medium w-full"
      onClick={fileUrl ? () => setIsOpenConfirmation(true) : undefined}
    />
  );

  return (
    <div className="flex flex-col justify-center items-center w-full">
      <div className="relative w-24 h-24 border border-color-border rounded-full border-dashed">
        <div className="flex justify-center items-center w-full h-full p-0">
          {fileUrl ? (
            <PresignedImage isStatic={url ? false : true} url={fileUrl} className="w-full h-full rounded-full" />
          ) : (
            <CameraIcon className="w-12 h-12 text-color-secondary" />
          )}
        </div>
        <div className="absolute rounded-full bg-background-primary -bottom-3 w-full border border-color-border">
          {fileUrl ? (
            <>{buttonComponent}</>
          ) : (
            <FileDropZone selectedFiles={[]} setSelectedFiles={setSelectedFiles} hidePreview isImage>
              {buttonComponent}
            </FileDropZone>
          )}
        </div>
      </div>
      <SoftConfirmModal
        confirmText="Remove"
        isOpen={isOpenConfirmation}
        onConfirm={handleRemoveFile}
        onCancel={handleCancel}
        title="Remove Avatar"
        description="Are you sure you want to remove this avatar?"
      />
    </div>
  );
};
