import { CurrencyType, PeriodType } from '@parthhub/shared';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class UpsertPlanDto {
  @IsNotEmpty()
  @IsMongoId()
  _id: string;

  @IsNotEmpty()
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsArray()
  @IsMongoId({ each: true })
  courses?: string[];

  @IsOptional()
  @IsArray()
  @IsMongoId({ each: true })
  meets?: string[];

  @IsNotEmpty()
  @IsNumber()
  amount: number;

  @IsOptional()
  @IsNumber()
  realAmount?: number;

  @IsOptional()
  @IsEnum(CurrencyType)
  currency?: CurrencyType;

  @IsOptional()
  @IsNumber()
  interval?: number;

  @IsOptional()
  @IsEnum(PeriodType)
  period?: PeriodType;

  @IsOptional()
  @IsString()
  regionId?: string;

  @IsOptional()
  @IsMongoId()
  user?: string;

  @IsOptional()
  @IsNumber()
  order?: number;

  @IsOptional()
  @IsString()
  tag?: string;

  @IsOptional()
  @IsBoolean()
  isRecommended?: boolean;
}
