import { IsBoolean, IsEnum, IsMongoId, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { DocumentType, FileExtension, LinkType } from '../../enums';

/** The single field list for a file or link attached to a course, material or question. */
export class AttachmentDto {
  @IsNotEmpty()
  @IsMongoId()
  _id: string;

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
