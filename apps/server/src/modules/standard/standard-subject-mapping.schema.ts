import { BaseSchema } from '@database/base.schema';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema } from 'mongoose';

export type StandardSubjectMappingDocument = HydratedDocument<StandardSubjectMapping>;

@Schema({ timestamps: true })
export class StandardSubjectMapping extends BaseSchema {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Subject', required: true })
  subject: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Standard', required: true })
  standard: string;

  @Prop({ type: Number })
  order: number;

  @Prop([{ type: MongooseSchema.Types.ObjectId, ref: 'Standard' }])
  referenceStandards: string[];
}

export const StandardSubjectMappingSchema = SchemaFactory.createForClass(StandardSubjectMapping);

// Unique among live rows only: unticking a subject soft-deletes its mapping, and ticking it again
// creates a new row for the same pair. See the note on StandardSchema's indexes.
StandardSubjectMappingSchema.index(
  { subject: 1, standard: 1 },
  { unique: true, partialFilterExpression: { _deleted: false } },
);
