import { BaseSchema } from '@database/base.schema';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { CouponType, CurrencyType } from '@repo/shared/enums';
import { HydratedDocument, Schema as MongooseSchema } from 'mongoose';

export type CouponDocument = HydratedDocument<Coupon>;

@Schema({ timestamps: true })
export class Coupon extends BaseSchema {
  @Prop({ type: String, required: true, trim: true, uppercase: true })
  code: string;

  @Prop({ type: String, enum: CouponType, required: true })
  type: CouponType;

  @Prop({ type: Number, required: true, min: 0 })
  value: number;

  @Prop({ type: String, enum: CurrencyType })
  currency: CurrencyType;

  @Prop({ type: String })
  description: string;

  @Prop({ type: Number })
  maxUses: number;

  @Prop({ type: Number, default: 0 })
  usedCount: number;

  @Prop({ type: Date })
  validFrom: Date;

  @Prop({ type: Date })
  validTo: Date;

  @Prop([{ type: MongooseSchema.Types.ObjectId, ref: 'Plan' }])
  plans: string[];

  @Prop({ type: Boolean, default: true })
  isActive: boolean;
}

export const CouponSchema = SchemaFactory.createForClass(Coupon);

// One live code per organization; a soft-deleted one frees the code for reuse.
CouponSchema.index({ org: 1, code: 1 }, { unique: true, partialFilterExpression: { _deleted: false } });
CouponSchema.index({ org: 1, _deleted: 1 });
