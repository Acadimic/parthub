import { BaseSchema } from '@database/base.schema';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { AccessType, ActivityAction } from '@parthhub/shared';
import { HydratedDocument, Types } from 'mongoose';

export type ActivityLogDocument = HydratedDocument<ActivityLog>;

@Schema({ timestamps: true })
export class ActivityLog extends BaseSchema {
  @Prop({ type: String, required: true })
  entityType: string;

  @Prop({ type: Types.ObjectId, required: true })
  entityId: Types.ObjectId;

  @Prop({ type: String, enum: ActivityAction, required: true })
  action: ActivityAction;

  @Prop({ type: Object, required: true, default: {} })
  previousState: Record<string, unknown>;

  @Prop({ type: Object, required: true, default: {} })
  newState: Record<string, unknown>;

  @Prop({ type: Object, required: true, default: {} })
  changes: Record<string, { previous: unknown; new: unknown }>;

  @Prop({ type: String, required: true })
  apiRoute: string;

  @Prop({ type: String, enum: AccessType, required: true })
  accessType: AccessType;
}

export const ActivityLogSchema = SchemaFactory.createForClass(ActivityLog);

ActivityLogSchema.index({ entityType: 1, entityId: 1 });
ActivityLogSchema.index({ orgId: 1 });
ActivityLogSchema.index({ createdAt: -1 });
ActivityLogSchema.index({ apiRoute: 1 });
ActivityLogSchema.index({ accessType: 1 });
