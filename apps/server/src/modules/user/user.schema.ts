import { BaseSchema } from '@database/base.schema';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { AccountType, Gender, PermissionItem } from '@repo/shared';
import { HydratedDocument, Schema as MongooseSchema } from 'mongoose';

export type UserDocument = HydratedDocument<User> & { avatarPresignedUrl?: string };

@Schema({ timestamps: true, virtuals: true })
export class User extends BaseSchema {
  @Prop({ type: String, trim: true })
  name: string;

  @Prop({ type: String, trim: true })
  firstName: string;

  @Prop({ type: String, trim: true })
  lastName: string;

  @Prop({ type: String, enum: Gender })
  gender: Gender;

  @Prop({ type: Date })
  dob: Date;

  @Prop({ type: String, trim: true })
  countryCode: string;

  /** Free-text title shown on the profile (e.g. "Physics Teacher", "Class 10 Student"). */
  @Prop({ type: String, trim: true })
  designation: string;

  @Prop({ type: String, trim: true })
  pinCode: string;

  /** Standards a learner studies; used by self-registered learners who have no teacher org mappings. */
  @Prop({ type: [{ type: MongooseSchema.Types.ObjectId, ref: 'Standard' }], default: [] })
  standards: MongooseSchema.Types.ObjectId[];

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

UserSchema.index({ uid: 1, org: 1 }, { unique: true });
UserSchema.index({ email: 1 });
UserSchema.index({ org: 1 });
UserSchema.index({ uid: 1 });
UserSchema.index({ email: 1, org: 1 });
