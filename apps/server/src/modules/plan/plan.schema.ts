import { BaseSchema } from '@database/base.schema';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { CurrencyType, PeriodType } from '@repo/shared';
import { HydratedDocument, Schema as MongooseSchema } from 'mongoose';

export type PlanDocument = HydratedDocument<Plan>;

@Schema({ timestamps: true })
export class Plan extends BaseSchema {
  @Prop({ type: String, trim: true, required: true })
  name: string;

  @Prop({ type: String })
  description: string;

  @Prop([{ type: MongooseSchema.Types.ObjectId, ref: 'Course' }])
  courses: string[];

  @Prop([{ type: MongooseSchema.Types.ObjectId, ref: 'Meet' }])
  meets: string[];

  @Prop({ type: Number, required: true })
  amount: number;

  @Prop({ type: Number })
  realAmount: number;

  @Prop({ type: String, enum: CurrencyType, default: CurrencyType.INR })
  currency: CurrencyType;

  @Prop({ type: Number, default: 1 })
  interval: number;

  @Prop({ type: String, enum: PeriodType })
  period: PeriodType;

  @Prop({ type: String })
  regionId: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User' })
  user: string;

  @Prop({ type: Number })
  order: number;

  @Prop({ type: String, trim: true })
  tag: string;

  @Prop({ type: Boolean, default: false })
  isRecommended: boolean;
}

export const PlanSchema = SchemaFactory.createForClass(Plan);

PlanSchema.index({ org: 1, _deleted: 1 });
