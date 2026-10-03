import { BaseSchema } from '@database/base.schema';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { StandardGroup } from '@repo/shared/enums';
import { HydratedDocument } from 'mongoose';

export type StandardDocument = HydratedDocument<Standard>;

@Schema({ timestamps: true })
export class Standard extends BaseSchema {
  @Prop({ type: String, trim: true, required: true })
  name: string;

  @Prop({ type: String, trim: true })
  slug: string;

  @Prop({ type: String, trim: true })
  description: string;

  @Prop({ type: String, trim: true })
  logo: string;

  @Prop({ type: Number })
  order: number;

  @Prop({ type: String, enum: StandardGroup })
  group: StandardGroup;

  @Prop({ type: String, trim: true })
  alias: string;

  @Prop({ type: String, trim: true })
  locale: string;
}

export const StandardSchema = SchemaFactory.createForClass(Standard);

// Unique among live rows only. Deletes are soft, and a plain unique index counted the deleted
// rows too, so re-creating a standard with a deleted one's name or order failed with a duplicate
// key. `_deleted` always exists (the base schema defaults it); `$exists` keeps rows without a slug
// or order out of those two indexes, which is what `sparse` did before.
const live = { _deleted: false };
StandardSchema.index({ name: 1 }, { unique: true, partialFilterExpression: live });
StandardSchema.index({ slug: 1 }, { unique: true, partialFilterExpression: { ...live, slug: { $exists: true } } });
StandardSchema.index({ order: 1 }, { unique: true, partialFilterExpression: { ...live, order: { $exists: true } } });
