import { BaseSchema } from '@database/base.schema';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { PermissionItem } from '@parthhub/shared';
import { AccountType } from '@parthhub/shared';
import { HydratedDocument, Schema as MongooseSchema } from 'mongoose';

export type UserDocument = HydratedDocument<User> & { avatarPresignedUrl?: string };

@Schema({ timestamps: true, virtuals: true })
export class User extends BaseSchema {
  @Prop({ type: String, trim: true })
  name: string;

  @Prop({ type: String, required: true, lowercase: true, trim: true })
  email: string;

  @Prop({ type: String, required: true, trim: true })
  uid: string;

  @Prop({ type: String, trim: true })
  phoneNumber: string;

  @Prop({ type: String, trim: true })
  avatar: string;

  @Prop({ type: Boolean, default: false })
  isUpdated: boolean;

  @Prop({ type: Boolean, default: false })
  isHideOnboarding: boolean;

  @Prop({ type: MongooseSchema.Types.Mixed })
  address: object;

  @Prop({ type: Date })
  lastActive: Date;

  @Prop({ type: String, trim: true, required: true })
  timezone: string;

  @Prop({ type: Boolean, default: false })
  isInactive: boolean;

  @Prop({ type: [{ type: String, enum: PermissionItem }] })
  removedPermissions: PermissionItem[];

  @Prop({ type: String, enum: AccountType, required: true })
  accountType: AccountType;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User' })
  invitedBy: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Invite' })
  invite: MongooseSchema.Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Role', required: true })
  role: MongooseSchema.Types.ObjectId;
}

export const UserSchema = SchemaFactory.createForClass(User);

UserSchema.index({ uid: 1, orgId: 1 }, { unique: true });
UserSchema.index({ email: 1 });
UserSchema.index({ orgId: 1 });
UserSchema.index({ uid: 1 });
UserSchema.index({ email: 1, orgId: 1 });
