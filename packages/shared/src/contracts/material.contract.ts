import { DocumentType, FileExtension, LinkType } from '../enums';

/** A file or link attached to a course, material or question. */
export interface AttachmentDto {
  _id: string;
  fileName: string;
  url: string;
  documentType: DocumentType;
  fileType: string;
  fileExtension: FileExtension;
  linkType?: LinkType | null;
  reference?: string;
  tag?: string;
  isUploaded?: boolean;
}
