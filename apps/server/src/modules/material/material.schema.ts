import { BaseSchema } from '@database/base.schema';
import { RichText, RichTextSchemaDefinition } from '@database/rich-text.schema';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { DocumentType, FileExtension, LevelType, LinkType } from '@repo/shared/enums';
import { HydratedDocument, Schema as MongooseSchema } from 'mongoose';

export type AttachmentDocument = HydratedDocument<Attachment>;

@Schema({ _id: false })
export class Attachment {
  /** Client-generated identity for the subdocument; see `AttachmentDto.key`. */
  @Prop({ type: String })
  key: string;

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

  @Prop({ type: RichTextSchemaDefinition })
  content: RichText;

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

MaterialSchema.index({ org: 1, _deleted: 1 });
// MaterialService.getStandardAndSubjectMaterials ({ org, standard, subject } by order), and the
// `standard: { $in }` list through its prefix. The unique index below is partial, so no read can use it.
MaterialSchema.index({ org: 1, standard: 1, subject: 1, order: 1 });
// MaterialService.findByCourse.
MaterialSchema.index({ org: 1, course: 1 });
// Unique among live rows only. A delete is a soft delete, and with the plain unique index the
// deleted row kept its `order`, so the next content added to the chapter — given that same next
// order — failed with a duplicate key. `_deleted` always exists (the base schema defaults it), so
// a partial index on `_deleted: false` is the exact condition.
MaterialSchema.index(
  { standard: 1, subject: 1, chapter: 1, order: 1, org: 1 },
  { unique: true, partialFilterExpression: { _deleted: false } },
);
