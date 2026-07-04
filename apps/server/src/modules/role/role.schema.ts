import { BaseSchema } from '@database/base.schema';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { PermissionItem } from '@parthhub/shared';
import { HydratedDocument } from 'mongoose';

@Schema({ timestamps: true, virtuals: true })
export class Role extends BaseSchema {
  @Prop({ type: String, required: true, trim: true, lowercase: true })
  role: string;

  @Prop([{ type: String, enum: PermissionItem }])
  permissions: PermissionItem[];

  @Prop({ type: Boolean, default: false })
  isAdmin: boolean;
}

export type RoleDocument = HydratedDocument<Role>;
export const RoleSchema = SchemaFactory.createForClass(Role);

RoleSchema.index({ orgId: 1, updatedAt: 1 });
RoleSchema.index({ role: 1, orgId: 1 }, { unique: true });
