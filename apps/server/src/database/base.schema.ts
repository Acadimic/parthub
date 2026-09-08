import { Prop, Schema } from '@nestjs/mongoose';
import { Types } from 'mongoose';

@Schema()
export abstract class BaseSchema {
  @Prop({ type: Boolean, default: false, required: true })
  isDeleted: boolean;

  @Prop({ type: Types.ObjectId, ref: 'Org', required: true, immutable: true })
  org: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true, immutable: true })
  createdBy: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  updatedBy: Types.ObjectId;

  @Prop({ type: Date, required: true })
  createdAt: Date;

  @Prop({ type: Date, required: true })
  updatedAt: Date;
}
