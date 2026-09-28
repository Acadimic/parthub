import {
  IsDateString,
  IsEnum,
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { CurrencyType, OrderStatus } from '../../../enums';
import { IOrderCoupon, IOrderSnapshot } from '../../../interfaces/order.interface';
import { BaseOwnedDto } from '../base-owned.dto';

/**
 * A shareable order for one plan. The server mints every row; the teaching app creates one and
 * hands out its link, and whoever opens the link can pay for it and take the seats it promises.
 */
export class OrderDto extends BaseOwnedDto {
  @IsNotEmpty()
  @IsMongoId()
  _id: string;

  /** The token in the link. Short, unguessable, and the only way in for a buyer. */
  @IsNotEmpty()
  @IsString()
  code: string;

  /** The plan it was made from, for the teacher's records; the snapshot is what is sold. */
  @IsNotEmpty()
  @IsMongoId()
  plan: string;

  @IsNotEmpty()
  @IsObject()
  snapshot: IOrderSnapshot;

  @IsOptional()
  @IsObject()
  coupon?: IOrderCoupon;

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  subtotal: number;

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  discount: number;

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  total: number;

  @IsNotEmpty()
  @IsEnum(CurrencyType)
  currency: CurrencyType;

  @IsNotEmpty()
  @IsEnum(OrderStatus)
  status: OrderStatus;

  /** A line the teacher writes for the buyer, shown on the link. */
  @IsOptional()
  @IsString()
  note?: string;

  @IsOptional()
  @IsDateString()
  expiresAt?: string;

  @IsOptional()
  @IsMongoId()
  purchasedBy?: string;

  @IsOptional()
  @IsDateString()
  paidAt?: string;

  @IsOptional()
  @IsString()
  razorpayOrderId?: string;

  @IsOptional()
  @IsString()
  razorpayPaymentId?: string;
}

/** `POST order/create`, from the teaching app. */
export class CreateOrderDto {
  @IsNotEmpty()
  @IsMongoId()
  plan: string;

  @IsOptional()
  @IsString()
  note?: string;

  @IsOptional()
  @IsDateString()
  expiresAt?: string;

  /** A coupon to apply up front, so the link already shows the discounted price. */
  @IsOptional()
  @IsString()
  coupon?: string;
}

/** `POST order/link/:code/coupon`, from the buyer. */
export class ApplyOrderCouponDto {
  @IsNotEmpty()
  @IsString()
  code: string;
}

/** `POST order/link/:code/verify`: what Razorpay's checkout hands back once the buyer has paid. */
export class VerifyOrderPaymentDto {
  @IsNotEmpty()
  @IsString()
  razorpayOrderId: string;

  @IsNotEmpty()
  @IsString()
  razorpayPaymentId: string;

  @IsNotEmpty()
  @IsString()
  razorpaySignature: string;
}
