import { BaseSchema } from '@database/base.schema';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { CurrencyType, OrderStatus } from '@repo/shared/enums';
import { IOrderCoupon, IOrderSnapshot } from '@repo/shared/interfaces';
import { HydratedDocument, Schema as MongooseSchema } from 'mongoose';

export type OrderDocument = HydratedDocument<Order>;

/**
 * A shareable order for one plan. `snapshot` is the plan as it stood when the order was made and
 * is never rewritten, so editing or deleting the plan afterwards changes nothing a buyer was
 * promised. Written under the selling organization; `purchasedBy` is the learner who paid.
 */
@Schema({ timestamps: true })
export class Order extends BaseSchema {
  @Prop({ type: String, required: true, unique: true })
  code: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Plan', required: true })
  plan: string;

  @Prop({ type: MongooseSchema.Types.Mixed, required: true })
  snapshot: IOrderSnapshot;

  @Prop({ type: MongooseSchema.Types.Mixed })
  coupon: IOrderCoupon;

  @Prop({ type: Number, required: true, min: 0 })
  subtotal: number;

  @Prop({ type: Number, required: true, min: 0, default: 0 })
  discount: number;

  @Prop({ type: Number, required: true, min: 0 })
  total: number;

  @Prop({ type: String, enum: CurrencyType, required: true, default: CurrencyType.INR })
  currency: CurrencyType;

  @Prop({ type: String, enum: OrderStatus, required: true, default: OrderStatus.OPEN })
  status: OrderStatus;

  @Prop({ type: String })
  note: string;

  @Prop({ type: Date })
  expiresAt: Date;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User' })
  purchasedBy: string;

  @Prop({ type: Date })
  paidAt: Date;

  @Prop({ type: String })
  razorpayOrderId: string;

  @Prop({ type: String })
  razorpayPaymentId: string;
}

export const OrderSchema = SchemaFactory.createForClass(Order);

OrderSchema.index({ org: 1, status: 1, _deleted: 1 });
OrderSchema.index({ purchasedBy: 1, _deleted: 1 });
OrderSchema.index({ razorpayOrderId: 1 }, { sparse: true });
