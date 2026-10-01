import { CameraIcon, TrashIcon } from '@phosphor-icons/react';
import { Button, SoftConfirmModal, Spinner } from '@repo/ui/app';
import { cn } from '@repo/ui/lib';
import { getRandomColor } from '@utils/helpers';
import { useState } from 'react';
import { FileDropZone } from '../selects';
import { PresignedImage } from './PresignedImage';

interface IProps {
  /** Seeds the fallback colour, so the initials tile matches this person's avatar elsewhere. */
  id: string;
  name: string;
  file?: File;
  url?: string | null;
  isUploading?: boolean;
  setFile: (file: File) => void;
  removeFile: () => void;
}

const getInitials = (name: string) => {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? '';
  const last = parts.length > 1 ? (parts[parts.length - 1][0] ?? '') : '';
  return `${first}${last}`.toUpperCase() || '?';
};

/**
 * The profile photo with its controls: a camera button on the edge of the circle opens the picker
 * (or take a drop), and a text button underneath removes the current photo after confirming.
 */
export const UploadAvatar = ({ id, name, file, url, isUploading, setFile, removeFile }: IProps) => {
  const fileUrl = file ? URL.createObjectURL(file) : url;
  const [isOpenConfirmation, setIsOpenConfirmation] = useState(false);
  const { bg, color } = getRandomColor(id);

  const setSelectedFiles = (files: File[]) => {
    if (files[0]) setFile(files[0]);
  };

  const handleRemoveFile = () => {
    removeFile();
    setIsOpenConfirmation(false);
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <FileDropZone selectedFiles={[]} setSelectedFiles={setSelectedFiles} hidePreview isImage>
        <div className={cn('group relative mx-auto h-24 w-24', isUploading ? 'pointer-events-none' : 'cursor-pointer')}>
          <div
            className={cn(
              'flex h-full w-full items-center justify-center overflow-hidden rounded-full ring-4 ring-background shadow-md',
              'text-2xl font-semibold uppercase',
            )}
            style={fileUrl ? undefined : { backgroundColor: bg, color }}
          >
            {fileUrl ? (
              <PresignedImage isStatic={Boolean(file)} url={fileUrl} noOpen className="object-cover" />
            ) : (
              getInitials(name)
            )}
          </div>
          {isUploading ? (
            <div
              role="status"
              aria-label="Uploading photo"
              className="absolute inset-0 flex items-center justify-center rounded-full bg-background/70 backdrop-blur-[1px]"
            >
              <Spinner className="h-8 w-8 border-[3px] border-primary border-t-transparent" />
            </div>
          ) : (
            <span
              role="button"
              aria-label={fileUrl ? 'Change photo' : 'Add photo'}
              className={cn(
                'absolute -bottom-0.5 -right-0.5 flex h-8 w-8 items-center justify-center rounded-full',
                'border-2 border-background bg-primary text-primary-foreground shadow-sm transition-colors',
                'group-hover:bg-primary/90',
              )}
            >
              <CameraIcon weight="fill" className="h-4 w-4" />
            </span>
          )}
        </div>
      </FileDropZone>
      {fileUrl && !isUploading ? (
        <Button
          isSubtle
          className="px-2 py-0.5 text-xs font-medium text-muted-foreground hover:text-destructive"
          text="Remove photo"
          leftsection={<TrashIcon className="h-3.5 w-3.5" />}
          onClick={() => setIsOpenConfirmation(true)}
        />
      ) : null}
      <SoftConfirmModal
        confirmText="Remove"
        isOpen={isOpenConfirmation}
        onConfirm={handleRemoveFile}
        onCancel={() => setIsOpenConfirmation(false)}
        title="Remove photo"
        description="Your initials will show in place of the photo."
      />
    </div>
  );
};
