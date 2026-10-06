import { FileExtension } from '../enums/material.enum';

/** Limits on a course comment or review, checked by the server and shown by the composer. */
export const DISCUSSION_LIMITS = {
  MAX_BODY_LENGTH: 2000,
  MAX_ATTACHMENTS: 5,
  MAX_ATTACHMENT_BYTES: 10 * 1024 * 1024,
  /** Top-level comments or reviews per page. */
  PAGE_SIZE: 20,
} as const;

/** The files a comment may carry: images, shown inline, and PDFs, shown as a file chip. */
export const DISCUSSION_FILE_EXTENSIONS: FileExtension[] = [
  FileExtension.PNG,
  FileExtension.JPG,
  FileExtension.JPEG,
  FileExtension.PDF,
];

export const isDiscussionImage = (extension: FileExtension): boolean => extension !== FileExtension.PDF;
