import { BaseSchema } from '@database/base.schema';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { StandardGroup } from '@parthhub/shared';
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
}

export const StandardSchema = SchemaFactory.createForClass(Standard);

StandardSchema.index({ name: 1 }, { unique: true });
StandardSchema.index({ slug: 1 }, { unique: true, sparse: true });
StandardSchema.index({ order: 1 }, { unique: true, sparse: true });
