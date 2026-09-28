import { BaseSchema } from '@database/base.schema';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { CurrencyType, EnrollmentStatus } from '@repo/shared/enums';
import { HydratedDocument, Schema as MongooseSchema } from 'mongoose';

export type EnrollmentDocument = HydratedDocument<Enrollment>;

/**
 * A learner's seat in a course. Stamped like every other row — `org` and `createdBy` are the
 * learner and their organization — and `providerOrg` names the organization that provides what the
 * seat is in (the course, its plan, its sessions), which is the key that side reads seats by.
 */
@Schema({ timestamps: true })
export class Enrollment extends BaseSchema {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Course', required: true })
  course: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Org', required: true })
  providerOrg: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Plan', required: true })
  plan: string;

  @Prop({ type: String, enum: EnrollmentStatus, required: true, default: EnrollmentStatus.PENDING })
  status: EnrollmentStatus;

  @Prop({ type: Number, required: true, default: 0 })
  amount: number;

  @Prop({ type: String, enum: CurrencyType, required: true, default: CurrencyType.INR })
  currency: CurrencyType;

  @Prop({ type: Date, required: true })
  startsAt: Date;

  @Prop({ type: Date, required: true })
  endsAt: Date;

  @Prop({ type: String })
  razorpayOrderId: string;

  @Prop({ type: String })
  razorpayPaymentId: string;

  /** The shareable order that bought this seat, when it came from one. */
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Order' })
  order: string;
}

export const EnrollmentSchema = SchemaFactory.createForClass(Enrollment);

// Every access check asks "does this learner hold this course", so that pair leads.
EnrollmentSchema.index({ createdBy: 1, course: 1, status: 1, _deleted: 1 });
// The teacher's reads: who holds a seat in a course they published.
EnrollmentSchema.index({ providerOrg: 1, course: 1, _deleted: 1 });
// A payment is settled by its order id, which Razorpay hands back on its own.
EnrollmentSchema.index({ razorpayOrderId: 1 }, { sparse: true });
