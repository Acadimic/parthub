import { BaseSchema } from '@database/base.schema';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ColorType, MeetFrequency, MeetStatus } from '@repo/shared/enums';
import { HydratedDocument, Schema as MongooseSchema } from 'mongoose';

export type MeetDocument = HydratedDocument<Meet>;

@Schema({ timestamps: true })
export class Meet extends BaseSchema {
  @Prop({ type: String, trim: true, required: true })
  title: string;

  @Prop({ type: String, enum: ColorType })
  color: ColorType;

  @Prop({ type: String })
  description: string;

  @Prop({ type: String })
  timezone: string;

  @Prop({ type: String })
  timezoneOffset: string;

  @Prop({ type: Date })
  startTime: Date;

  @Prop({ type: Date })
  endTime: Date;

  @Prop({ type: Number })
  durationMins: number;

  @Prop({ type: String, enum: MeetStatus, default: MeetStatus.SCHEDULED })
  status: MeetStatus;

  @Prop([{ type: MongooseSchema.Types.ObjectId, ref: 'Standard' }])
  standards: string[];

  @Prop([{ type: MongooseSchema.Types.ObjectId, ref: 'Batch' }])
  batches: string[];

  @Prop([{ type: MongooseSchema.Types.ObjectId, ref: 'User' }])
  attendees: string[];

  @Prop({ type: String })
  meetingLink: string;

  @Prop({ type: String })
  meetingId: string;

  @Prop({ type: [Number] })
  weekDays: number[];

  @Prop({ type: String, enum: MeetFrequency })
  frequency: MeetFrequency;

  @Prop({ type: [Date], default: [] })
  cancelledDates: Date[];
}

export const MeetSchema = SchemaFactory.createForClass(Meet);

MeetSchema.index({ org: 1, _deleted: 1 });
MeetSchema.index({ meetingId: 1 }, { unique: true, sparse: true });
