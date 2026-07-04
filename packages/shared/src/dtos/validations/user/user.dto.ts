import { AccountType } from '../../../enums/user.enum';
import { Expose, Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsMongoId,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  IsUrl,
} from 'class-validator';
import { RegisterUserDto } from './register.dto';

export class CreateUserDto extends RegisterUserDto {
  @IsString()
  @IsNotEmpty()
  timezone: string;

  @IsBoolean()
  @IsNotEmpty()
  isUpdated: boolean;

  @IsMongoId()
  @IsOptional()
  invitedBy?: string;

  @IsMongoId()
  @IsOptional()
  invite?: string;

  @IsNotEmpty()
  @IsEnum(AccountType)
  accountType: AccountType;

  @IsMongoId()
  @IsNotEmpty()
  role: string;
}

export class UserDto {
  @Expose()
  @Type(() => IsMongoId)
  _id: string;

  @Expose()
  @IsString()
  @IsNotEmpty()
  name: string;

  @Expose()
  @IsString()
  @IsNotEmpty()
  uid: string;

  @Expose()
  @Transform(({ value }) => value.trim().toLowerCase())
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @Expose()
  @IsOptional()
  @IsUrl()
  @IsNotEmpty()
  avatar?: string;

  @Expose()
  @IsString()
  @IsOptional()
  @IsNotEmpty()
  phoneNumber?: string;

  @Expose()
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  pinCode?: string;

  @Expose()
  @IsOptional()
  @IsObject()
  address?: object;

  @Expose()
  @IsOptional()
  @IsBoolean()
  isPhoneVerified?: boolean;

  @Expose()
  @IsOptional()
  @IsBoolean()
  isUpdated: boolean;

  @Expose()
  @IsOptional()
  @IsNotEmpty()
  lastActive?: string | Date;

  @Expose()
  @IsString()
  @IsNotEmpty()
  orgId: string;

  @Expose()
  @IsMongoId()
  @IsNotEmpty()
  role: string;

  @Expose()
  @IsNotEmpty()
  @IsEnum(AccountType)
  accountType: AccountType;

  @Expose()
  @IsString()
  @IsOptional()
  timezone?: string;

  @Expose()
  @IsOptional()
  @IsBoolean()
  isInactive?: boolean;
}

export class FindByOrgIdAndUidDto {
  @IsNotEmpty()
  @IsMongoId()
  orgId: string;

  @IsNotEmpty()
  @IsString()
  uid: string;
}

export class OrgDto {
  @Expose()
  @Type(() => IsMongoId)
  _id: string;

  @Expose()
  @IsString()
  @IsNotEmpty()
  name: string;

  @Expose()
  @IsString()
  @IsOptional()
  displayId: string;
}

export class InitialDataDto {
  users: UserDto[];
  orgs: OrgDto[];
}
