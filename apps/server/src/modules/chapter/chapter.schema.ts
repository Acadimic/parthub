import { BaseSchema } from '@database/base.schema';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema } from 'mongoose';

export type ChapterDocument = HydratedDocument<Chapter>;

@Schema({ timestamps: true })
export class Chapter extends BaseSchema {
  @Prop({ type: String, trim: true, required: true })
  name: string;

  @Prop({ type: Number, default: 0 })
  order: number;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Standard' })
  standard: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Subject' })
  subject: string;
}

export const ChapterSchema = SchemaFactory.createForClass(Chapter);

// Unique among live rows only: a deleted chapter's name must be reusable. See `MaterialSchema`
// for why this is a partial index rather than a sparse one.
ChapterSchema.index(
  { name: 1, standard: 1, subject: 1, org: 1 },
  { unique: true, partialFilterExpression: { _deleted: false } },
);
