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
