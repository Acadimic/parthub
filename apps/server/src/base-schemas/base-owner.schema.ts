import { Prop, Schema } from '@nestjs/mongoose';
import { Schema as MongooseSchema } from 'mongoose';
import { BaseDeleteSchema } from './base-delete.schema';

@Schema()
export class BaseOwnerSchema extends BaseDeleteSchema {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true, immutable: true })
  createdBy: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  updatedBy: string;
}
