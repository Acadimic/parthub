import { BaseSchema } from '@database/base.schema';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema } from 'mongoose';

export type OptionDocument = HydratedDocument<Option>;

@Schema({ timestamps: true })
export class Option extends BaseSchema {
  @Prop({ type: String, trim: true, required: true })
  option: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Question', required: true })
  question: string;

  @Prop({ type: Boolean, required: true })
  isCorrect: boolean;
}

export const OptionSchema = SchemaFactory.createForClass(Option);

OptionSchema.index({ question: 1 });
OptionSchema.index({ org: 1, _deleted: 1 });
OptionSchema.index({ question: 1, _deleted: 1 });
