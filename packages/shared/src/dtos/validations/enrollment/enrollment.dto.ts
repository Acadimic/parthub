import { IsDateString, IsEnum, IsMongoId, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { CurrencyType, EnrollmentStatus } from '../../../enums';
import { BaseOwnedDto } from '../base-owned.dto';

/**
 * A learner's seat in a course: the plan it was bought on, what was paid, when it runs, and the
 * payment it was settled by. The server mints every row; a client only ever reads them.
 */
export class EnrollmentDto extends BaseOwnedDto {
  @IsNotEmpty()
  @IsMongoId()
  _id: string;

  @IsNotEmpty()
  @IsMongoId()
  course: string;

  /** The organization that provides the course; `org` is the learner's own. */
  @IsNotEmpty()
  @IsMongoId()
  providerOrg: string;

  /** The plan the seat was taken on; a free seat still names its free plan. */
  @IsNotEmpty()
  @IsMongoId()
  plan: string;

  @IsNotEmpty()
  @IsEnum(EnrollmentStatus)
  status: EnrollmentStatus;

  /** In the plan's currency's major unit; 0 for a free seat. */
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  amount: number;

  @IsNotEmpty()
  @IsEnum(CurrencyType)
  currency: CurrencyType;

  /** ISO 8601. A pending seat carries a provisional term, reset when its payment lands. */
  @IsNotEmpty()
  @IsDateString()
  startsAt: string;

  /** ISO 8601. Every plan runs for a period, so every seat has an end. */
  @IsNotEmpty()
  @IsDateString()
  endsAt: string;

  @IsOptional()
  @IsString()
  razorpayOrderId?: string;

  @IsOptional()
  @IsString()
  razorpayPaymentId?: string;

  /** The shareable order that bought this seat, when it came from one. */
  @IsOptional()
  @IsMongoId()
  order?: string;
}

/** `POST enrollment/checkout`: the course, and which of its plans when it has any. */
export class EnrollCourseDto {
  @IsNotEmpty()
  @IsMongoId()
  course: string;

  @IsOptional()
  @IsMongoId()
  plan?: string;
}

/** `POST enrollment/verify`: what Razorpay's checkout hands back once the learner has paid. */
export class VerifyEnrollmentPaymentDto {
  @IsNotEmpty()
  @IsMongoId()
  enrollment: string;

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
