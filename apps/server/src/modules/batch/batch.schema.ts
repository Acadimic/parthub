import { BaseSchema } from '@database/base.schema';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema } from 'mongoose';

export type BatchDocument = HydratedDocument<Batch>;

@Schema({ timestamps: true })
export class Batch extends BaseSchema {
  @Prop({ type: String, trim: true, required: true })
  name: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Standard' })
  standard: string;

  @Prop({ type: Number, required: true })
  year: number;
}

export const BatchSchema = SchemaFactory.createForClass(Batch);

BatchSchema.index({ org: 1, _deleted: 1 });
