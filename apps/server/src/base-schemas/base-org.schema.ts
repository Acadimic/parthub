import { Prop, Schema } from '@nestjs/mongoose';
import { Schema as MongooseSchema } from 'mongoose';
import { BaseDeleteSchema } from './base-delete.schema';

@Schema()
export class BaseOrgSchema extends BaseDeleteSchema {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Org', required: true })
  org: string;
}
