import { BaseSchema } from '@database/base.schema';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema } from 'mongoose';

export type SolutionDocument = HydratedDocument<Solution>;

@Schema({ timestamps: true })
export class Solution extends BaseSchema {
  @Prop({ type: String, trim: true, required: true })
  solution: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Question', required: true })
  question: string;
}

export const SolutionSchema = SchemaFactory.createForClass(Solution);

SolutionSchema.index({ question: 1 });
SolutionSchema.index({ org: 1, isDeleted: 1 });
SolutionSchema.index({ question: 1, isDeleted: 1 });
