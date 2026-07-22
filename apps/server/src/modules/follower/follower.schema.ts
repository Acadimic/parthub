import { BaseSchema } from '@database/base.schema';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema } from 'mongoose';

export type FollowerDocument = HydratedDocument<Follower>;

@Schema({ timestamps: true })
export class Follower extends BaseSchema {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  follower: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  following: string;
}

export const FollowerSchema = SchemaFactory.createForClass(Follower);

FollowerSchema.index({ follower: 1, following: 1 }, { unique: true });
FollowerSchema.index({ orgId: 1, _deleted: 1 });
