import { BaseSchema } from '@database/base.schema';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema } from 'mongoose';

export type UserBatchMappingDocument = HydratedDocument<UserBatchMapping>;

@Schema({ timestamps: true })
export class UserBatchMapping extends BaseSchema {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  user: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Batch', required: true })
  batch: string;
}

export const UserBatchMappingSchema = SchemaFactory.createForClass(UserBatchMapping);

UserBatchMappingSchema.index({ user: 1, batch: 1, org: 1 }, { unique: true });
UserBatchMappingSchema.index({ org: 1, _deleted: 1 });
