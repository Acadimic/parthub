import { BaseSchema } from '@database/base.schema';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { CurrencyType, PeriodType } from '@repo/shared/enums';
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

  @Prop({ type: Number, required: true })
  realAmount: number;

  @Prop({ type: String, enum: CurrencyType, required: true })
  currency: CurrencyType;

  @Prop({ type: Number, required: true })
  interval: number;

  @Prop({ type: String, enum: PeriodType, required: true })
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
// PlanService.getPlansByCourseId: whether a course is paid, asked on every learner content call.
PlanSchema.index({ org: 1, courses: 1, order: 1 });
