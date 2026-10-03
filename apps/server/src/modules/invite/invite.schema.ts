import { BaseSchema } from '@database/base.schema';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { DefaultRole, InviteStatus } from '@repo/shared/enums';
import { HydratedDocument, Schema as MongooseSchema } from 'mongoose';

@Schema({ timestamps: true, virtuals: true })
export class Invite extends BaseSchema {
  @Prop({ type: String, trim: true })
  name: string;

  @Prop({ type: String, required: true, trim: true, lowercase: true })
  email: string;

  @Prop({ type: String, enum: DefaultRole, required: true })
  permission: DefaultRole;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  invitedBy: MongooseSchema.Types.ObjectId;

  @Prop({ type: String, required: true })
  status: InviteStatus;

  @Prop({ type: Date })
  acceptedDate: Date;
}

export type InviteDocument = HydratedDocument<Invite>;
export const InviteSchema = SchemaFactory.createForClass(Invite);

InviteSchema.index({ org: 1, updatedAt: 1 });
// Also serves the lookup by `email` alone, such as the pending invite at sign-up.
InviteSchema.index({ email: 1, org: 1 }, { unique: true });
