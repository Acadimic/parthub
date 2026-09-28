import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  Min,
} from 'class-validator';
import { CouponType, CurrencyType } from '../../../enums';
import { BaseOwnedDto } from '../base-owned.dto';

/** A discount a teacher offers: a code, what it takes off, and when and on what it works. */
export class CouponDto extends BaseOwnedDto {
  @IsNotEmpty()
  @IsMongoId()
  _id: string;

  /** Upper-case letters, digits and dashes; stored upper-cased so a buyer's typing does not matter. */
  @IsNotEmpty()
  @IsString()
  @Matches(/^[A-Za-z0-9-]{3,24}$/)
  code: string;

  @IsNotEmpty()
  @IsEnum(CouponType)
  type: CouponType;

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  value: number;

  /** Only for a flat coupon: the currency `value` is in. */
  @IsOptional()
  @IsEnum(CurrencyType)
  currency?: CurrencyType;

  @IsOptional()
  @IsString()
  description?: string;

  /** How many orders may use it; absent means no limit. */
  @IsOptional()
  @IsNumber()
  @Min(1)
  maxUses?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  usedCount?: number;

  @IsOptional()
  @IsDateString()
  validFrom?: string;

  @IsOptional()
  @IsDateString()
  validTo?: string;

  /** The plans it applies to; absent means any plan of the organization. */
  @IsOptional()
  @IsArray()
  @IsMongoId({ each: true })
  plans?: string[];

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
