import { BaseSchema } from '@database/base.schema';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { DocumentType, FileExtension, LevelType, LinkType } from '@parthhub/shared';
import { HydratedDocument, Schema as MongooseSchema } from 'mongoose';

export type AttachmentDocument = HydratedDocument<Attachment>;

@Schema({ _id: false })
export class Attachment {
  @Prop({ type: String, trim: true })
  fileName: string;

  @Prop({ type: String, trim: true })
  url: string;

  @Prop({ type: String, enum: DocumentType })
  documentType: DocumentType;

  @Prop({ type: String })
  fileType: string;

  @Prop({ type: String, enum: FileExtension })
  fileExtension: FileExtension;

  @Prop({ type: String, enum: LinkType })
  linkType: LinkType;

  @Prop({ type: Boolean, default: false })
  isUploaded: boolean;

  @Prop({ type: String, trim: true })
  reference: string;

  @Prop({ type: String, trim: true })
  tag: string;
}

export const AttachmentSchema = SchemaFactory.createForClass(Attachment);

export type MaterialDocument = HydratedDocument<Material>;

@Schema({ timestamps: true })
export class Material extends BaseSchema {
  @Prop({ type: String, trim: true, required: true })
  name: string;

  @Prop({ type: String, trim: true })
  slug: string;

  @Prop({ type: String })
  content: string;

  @Prop({ type: Number })
  order: number;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Standard' })
  standard: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Subject' })
  subject: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Chapter' })
  chapter: string;

  @Prop({ type: [AttachmentSchema], default: [] })
  attachments: Attachment[];

  @Prop({ type: String, enum: LevelType })
  level: LevelType;

  @Prop({ type: String, trim: true })
  tag: string;

  @Prop({ type: Number })
  durationMins: number;

  @Prop()
  type: string;

  @Prop()
  url: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Course' })
  course: string;
}

export const MaterialSchema = SchemaFactory.createForClass(Material);

MaterialSchema.index({ orgId: 1, _deleted: 1 });
MaterialSchema.index({ standard: 1, subject: 1, chapter: 1, order: 1, orgId: 1 }, { unique: true, sparse: true });
