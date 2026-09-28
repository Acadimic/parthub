import { getTransformedBaseFields } from '@database/base.transform';
import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { CouponType } from '@repo/shared/enums';
import { IOrderCoupon } from '@repo/shared/interfaces';
import { CouponDto } from '@repo/shared/validations';
import { Model, Types } from 'mongoose';
import { Coupon, CouponDocument } from './coupon.schema';

@Injectable()
export class CouponService {
  constructor(@InjectModel(Coupon.name) private couponModel: Model<CouponDocument>) {}

  getTransformed(row: CouponDocument): CouponDto {
    return {
      ...getTransformedBaseFields(row),
      code: row.code,
      type: row.type,
      value: row.value,
      currency: row.currency,
      description: row.description,
      maxUses: row.maxUses,
      usedCount: row.usedCount ?? 0,
      validFrom: row.validFrom?.toISOString(),
      validTo: row.validTo?.toISOString(),
      plans: (row.plans ?? []).map(String),
      isActive: row.isActive,
      _deleted: row._deleted,
    };
  }

  async upsert(org: Types.ObjectId, payload: CouponDto): Promise<CouponDto> {
    const { _id, ...fields } = payload;
    const row = await this.couponModel
      .findOneAndUpdate(
        { _id, org },
        {
          $set: { ...fields, code: fields.code.toUpperCase(), _deleted: fields._deleted ?? false },
          $setOnInsert: { _id },
        },
        { returnDocument: 'after', upsert: true, runValidators: true },
      )
      .lean<CouponDocument>();
    if (!row) throw new BadRequestException('Coupon could not be saved.');
    return this.getTransformed(row);
  }

  async getByOrg(org: Types.ObjectId): Promise<CouponDto[]> {
    const rows = await this.couponModel
      .find({ org, _deleted: { $ne: true } })
      .sort({ createdAt: -1 })
      .lean<CouponDocument[]>();
    return rows.map((row) => this.getTransformed(row));
  }

  /**
   * The coupon a buyer typed, if it can be used on this plan right now. Throws with the reason
   * otherwise, so the page can say why rather than just refusing.
   */
  async resolve(org: Types.ObjectId, code: string, planId: string): Promise<CouponDocument> {
    const row = await this.couponModel
      .findOne({ org, code: code.trim().toUpperCase(), _deleted: { $ne: true } })
      .lean<CouponDocument>();
    if (!row || row.isActive === false) throw new BadRequestException('That coupon code is not valid.');
    const now = new Date();
    if (row.validFrom && row.validFrom > now) throw new BadRequestException('That coupon is not active yet.');
    if (row.validTo && row.validTo < now) throw new BadRequestException('That coupon has expired.');
    if (row.maxUses && (row.usedCount ?? 0) >= row.maxUses) {
      throw new BadRequestException('That coupon has been used up.');
    }
    if (row.plans?.length && !row.plans.map(String).includes(planId)) {
      throw new BadRequestException('That coupon does not apply to this plan.');
    }
    return row;
  }

  /** What the coupon takes off a subtotal, never more than the subtotal itself. */
  getDiscount(coupon: CouponDocument, subtotal: number): number {
    const raw = coupon.type === CouponType.PERCENT ? (subtotal * coupon.value) / 100 : coupon.value;
    return Math.min(subtotal, Math.max(0, Math.round(raw * 100) / 100));
  }

  toOrderCoupon(coupon: CouponDocument, discount: number): IOrderCoupon {
    return { code: coupon.code, type: coupon.type, value: coupon.value, discount };
  }

  /** Counts a use once an order carrying the coupon is paid. */
  async markUsed(couponCode: string, org: Types.ObjectId): Promise<void> {
    await this.couponModel.updateOne({ org, code: couponCode, _deleted: { $ne: true } }, { $inc: { usedCount: 1 } });
  }
}
