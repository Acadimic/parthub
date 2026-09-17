import { IsBoolean, IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { DocumentType, FileExtension, LinkType } from '../../enums';

/** The single field list for a file or link attached to a course, material or question. */
export class AttachmentDto {
  /**
   * A client-generated identity for this attachment, unique within its material.
   *
   * An attachment is a subdocument with no `_id`, and neither of the obvious stand-ins works: a
   * position shifts when an earlier entry is removed, and `url` is blank on a link the author has
   * only just added and not yet filled in. The key is minted when the attachment is created and
   * never changes, so it survives both.
   */
  @IsNotEmpty()
  @IsString()
  key: string;

  @IsString()
  fileName: string;

  @IsString()
  url: string;

  @IsEnum(DocumentType)
  documentType: DocumentType;

  @IsString()
  fileType: string;

  @IsEnum(FileExtension)
  fileExtension: FileExtension;

  @IsOptional()
  @IsEnum(LinkType)
  linkType?: LinkType | null;

  @IsOptional()
  @IsString()
  reference?: string;

  @IsOptional()
  @IsString()
  tag?: string;

  @IsOptional()
  @IsBoolean()
  isUploaded?: boolean;
}
