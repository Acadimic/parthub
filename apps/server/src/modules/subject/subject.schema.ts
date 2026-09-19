import { BaseSchema } from '@database/base.schema';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type SubjectDocument = HydratedDocument<Subject>;

@Schema({ timestamps: true })
export class Subject extends BaseSchema {
  @Prop({ type: String, trim: true, required: true })
  name: string;

  @Prop({ type: String, trim: true })
  slug: string;

  @Prop({ type: String, trim: true })
  description: string;

  @Prop({ type: String, trim: true })
  logo: string;
}

export const SubjectSchema = SchemaFactory.createForClass(Subject);

// Unique among live rows only — see the note on StandardSchema's indexes.
const live = { _deleted: false };
SubjectSchema.index({ name: 1 }, { unique: true, partialFilterExpression: live });
SubjectSchema.index({ slug: 1 }, { unique: true, partialFilterExpression: { ...live, slug: { $exists: true } } });
