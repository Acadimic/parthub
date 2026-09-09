import { BaseSchema } from '@database/base.schema';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { OrgType, PermissionItem, SpecialPermissions } from '@repo/shared/enums';
import { HydratedDocument } from 'mongoose';

@Schema({ timestamps: true })
export class Org extends BaseSchema {
  @Prop({ type: String, trim: true })
  name: string;

  @Prop({ type: String })
  logo: string;

  @Prop({ type: String })
  displayId: string;

  @Prop({ type: String, enum: OrgType, default: OrgType.INDIVIDUAL })
  orgType: OrgType;

  @Prop({ type: [{ type: String, enum: SpecialPermissions }] })
  specialPermissions: SpecialPermissions[];

  @Prop({ type: [{ type: String, enum: PermissionItem }] })
  removedPermissions: PermissionItem[];
}

export type OrgDocument = HydratedDocument<Org>;
export const OrgSchema = SchemaFactory.createForClass(Org);

OrgSchema.index({ name: 1 });
OrgSchema.index({ displayId: 1 });
