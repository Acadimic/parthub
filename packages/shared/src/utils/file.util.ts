import { FileExtension } from '../enums/material.enum';

/**
 * The file's extension as the enum the API accepts.
 *
 * `AttachmentDto.fileExtension` is a required `FileExtension`, while `fileName.split('.').pop()` is
 * `string | undefined` and unvalidated — so the apps used to cast the whole attachment object to
 * silence it, which also silenced every other field. Anything unrecognised becomes `OTHER`, which
 * is what the enum has that member for.
 */
export const getFileExtension = (fileName: string): FileExtension => {
  const extension = fileName.split('.').pop()?.toLowerCase();
  return Object.values(FileExtension).find((value) => value === extension) ?? FileExtension.OTHER;
};

/**
 * The largest file the apps upload and the server signs for, 50 MB. One number for the dropzone's
 * client-side check and the server's refusal to sign a larger declared size, so the two never
 * disagree. A presigned PUT itself cannot cap the body, which is why the size is declared first.
 */
export const MAX_UPLOAD_BYTES = 50 * 1024 * 1024;

/** "1.2 MB" style sizes for file lists. */
export const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};
