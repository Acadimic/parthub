import { BaseOwnerSchema } from '@base-schemas';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type UserDocument = User & Document;

@Schema({ timestamps: true })
export class User extends BaseOwnerSchema {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  email: string;

  @Prop()
  uid: string;

  @Prop()
  phone: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Org' })
  org: string;

  @Prop()
  permission: string;

  @Prop()
  lastActive: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);
