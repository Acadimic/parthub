import { formatFileSize, getFileExtension, MAX_UPLOAD_BYTES } from '@repo/shared/utils';
import { CloudArrowUpIcon, FileIcon, FilePdfIcon, ImagesIcon, XIcon } from '@phosphor-icons/react';
import { Button } from '@repo/ui/app';
import { cn } from '@repo/ui/lib';
import { FileExtension } from '@enums';
import { type UploadProgress } from '@hooks/attachment.hook';
import { useEffect, useMemo } from 'react';
import { FileDropZone, type IFileUploadProps } from '../selects';

interface IProps extends IFileUploadProps {
  /** Per-file progress while the form is saving; a row with a value shows a bar. */
  progress?: UploadProgress;
  isUploading?: boolean;
}

const IMAGE_EXTENSIONS: FileExtension[] = [FileExtension.PNG, FileExtension.JPG, FileExtension.JPEG];

const acceptedLabel = ({ isPdf, isImage, isVideo }: IFileUploadProps) => {
  const kinds = [isPdf && 'PDF', isImage && 'PNG, JPG or GIF', isVideo && 'MP4'].filter(Boolean);
  return kinds.length ? kinds.join(', ') : 'any file';
};

const glyphIcon = (isPdf: boolean, isImage: boolean) => {
  if (isPdf) return FilePdfIcon;
  return isImage ? ImagesIcon : FileIcon;
};

const FileGlyph = ({ file, thumbnail }: { file: File; thumbnail?: string }) => {
  const extension = getFileExtension(file.name);
  if (thumbnail) return <img src={thumbnail} alt="" className="h-10 w-10 rounded-md object-cover" />;
  const isPdf = extension === FileExtension.PDF;
  const isImage = IMAGE_EXTENSIONS.includes(extension);
  const Icon = glyphIcon(isPdf, isImage);
  return (
    <span className="flex h-10 w-10 items-center justify-center rounded-md bg-muted text-muted-foreground">
      <Icon weight="fill" className={cn('h-5 w-5', isPdf && 'text-destructive')} />
    </span>
  );
};

const statusLabel = (percent: number | undefined) => {
  if (percent === undefined) return 'uploads when you save';
  if (percent < 100) return `uploading ${percent}%`;
  return 'uploaded';
};

/**
 * The files a form will upload when it saves, and the dropzone that adds to them.
 *
 * Nothing is transferred on pick: a picked-then-abandoned file would otherwise sit in the bucket
 * with no record pointing at it. Each row shows the name, size and, for an image, a thumbnail;
 * while the form saves, the row carries that file's own progress bar.
 */
export const UploadFiles = ({ progress, isUploading, ...props }: IProps) => {
  const { selectedFiles, removeFile, maxFiles } = props;
  const maxFileCount = maxFiles || 1;
  const thumbnails = useMemo(
    () => selectedFiles.map((file) => (file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined)),
    [selectedFiles],
  );
  useEffect(() => () => thumbnails.forEach((url) => url && URL.revokeObjectURL(url)), [thumbnails]);
  const canAddMore = selectedFiles.length < maxFileCount;

  return (
    <div className="flex flex-col gap-2">
      {canAddMore ? (
        <FileDropZone {...props} hidePreview>
          <div className="flex w-full cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-border px-4 py-5 text-center transition-colors hover:border-primary/50 hover:bg-accent/40">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
              <CloudArrowUpIcon weight="bold" className="h-5 w-5" />
            </span>
            <p className="text-sm font-medium text-foreground">
              Drop {maxFileCount > 1 ? 'files' : 'a file'} here, or <span className="text-primary">browse</span>
            </p>
            <p className="text-xs text-muted-foreground">
              {acceptedLabel(props)} · up to {formatFileSize(MAX_UPLOAD_BYTES)} each
              {maxFileCount > 1 ? ` · ${maxFileCount} files at most` : ''}
            </p>
          </div>
        </FileDropZone>
      ) : null}
      {selectedFiles.length ? (
        <ul className="flex flex-col gap-1.5">
          {selectedFiles.map((file, index) => {
            const percent = progress?.[index];
            return (
              <li
                key={`${file.name}-${file.size}-${index}`}
                className="flex items-center gap-3 rounded-lg border border-border bg-background px-3 py-2"
              >
                <FileGlyph file={file} thumbnail={thumbnails[index]} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-foreground">{file.name}</span>
                  <span className="block text-xs text-muted-foreground">
                    {formatFileSize(file.size)} · {statusLabel(percent)}
                  </span>
                  {percent !== undefined ? (
                    <span
                      className="mt-1 block h-1 w-full overflow-hidden rounded-full bg-muted"
                      role="progressbar"
                      aria-valuenow={percent}
                      aria-valuemin={0}
                      aria-valuemax={100}
                    >
                      <span
                        className={cn(
                          'block h-full rounded-full transition-all',
                          percent < 100 ? 'bg-primary' : 'bg-success',
                        )}
                        style={{ width: `${percent}%` }}
                      />
                    </span>
                  ) : null}
                </span>
                {removeFile ? (
                  <Button
                    isSubtle
                    className="px-1.5 py-1.5"
                    title={`Remove ${file.name}`}
                    onClick={() => removeFile(index)}
                    disabled={isUploading}
                  >
                    <XIcon weight="bold" className="h-4 w-4" />
                  </Button>
                ) : null}
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
};
