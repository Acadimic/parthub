import { BaseSchema } from '@database/base.schema';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type OtpDocument = HydratedDocument<Otp>;

@Schema({ timestamps: true })
export class Otp extends BaseSchema {
  @Prop({ type: String, required: true, immutable: true })
  code: string;

  @Prop({ type: Boolean, default: false })
  isVerified: boolean;

  @Prop({ type: String, trim: true })
  email: string;

  @Prop({ type: String, trim: true })
  phoneNumber: string;
}

export const OtpSchema = SchemaFactory.createForClass(Otp);
