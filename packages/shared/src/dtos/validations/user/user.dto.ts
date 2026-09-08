import { AccountType, Gender } from '../../../enums/user.enum';
import { OrgType } from '../../../enums/org.enum';
import { DefaultRole } from '../../../enums/role.enum';
import { Expose, Transform } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsDateString,
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
  @IsNotEmpty()
  @IsMongoId()
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
  org: string;

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

  @Expose()
  @IsOptional()
  @IsString()
  firstName?: string;

  @Expose()
  @IsOptional()
  @IsString()
  lastName?: string;

  @Expose()
  @IsOptional()
  @IsEnum(Gender)
  gender?: Gender;

  @Expose()
  @IsOptional()
  @IsDateString()
  dob?: string;

  @Expose()
  @IsOptional()
  @IsString()
  countryCode?: string;

  @Expose()
  @IsOptional()
  @IsString()
  designation?: string;

  @Expose()
  @IsOptional()
  @IsMongoId({ each: true })
  standards?: string[];

  /** Name of the user's role (e.g. DefaultRole values); derived from `role`, never stored. */
  @Expose()
  @IsOptional()
  @IsString()
  permission?: DefaultRole | string;
}

/** Fields a user may change on their own profile (POST user/<subdomain>/profile). */
export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  firstName?: string;

  @IsOptional()
  @IsString()
  lastName?: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @IsOptional()
  @IsString()
  countryCode?: string;

  @IsOptional()
  @IsEnum(Gender)
  gender?: Gender;

  @IsOptional()
  @IsDateString()
  dob?: string;

  @IsOptional()
  @IsUrl()
  avatar?: string;

  @IsOptional()
  @IsString()
  designation?: string;

  @IsOptional()
  @IsString()
  timezone?: string;

  @IsOptional()
  @IsObject()
  address?: object;

  @IsOptional()
  @IsString()
  pinCode?: string;

  @IsOptional()
  @IsArray()
  @IsMongoId({ each: true })
  standards?: string[];
}

/** Staff editing another member of their org (POST user/teach/update). */
export class UpdateOrgUserDto extends UpdateProfileDto {
  @IsNotEmpty()
  @IsMongoId()
  _id: string;
}

export class FindByOrgIdAndUidDto {
  @IsNotEmpty()
  @IsMongoId()
  org: string;

  @IsNotEmpty()
  @IsString()
  uid: string;
}

export class OrgDto {
  @Expose()
  @IsNotEmpty()
  @IsMongoId()
  _id: string;

  @Expose()
  @IsString()
  @IsNotEmpty()
  name: string;

  @Expose()
  @IsString()
  @IsOptional()
  displayId: string;

  @Expose()
  @IsOptional()
  @IsUrl()
  logo?: string;

  @Expose()
  @IsOptional()
  @IsEnum(OrgType)
  orgType?: OrgType;

  @Expose()
  @IsOptional()
  @IsString()
  createdBy?: string;

  @Expose()
  @IsOptional()
  @IsString()
  updatedBy?: string;
}

/** Org owner updating their organization (POST org/teach/update). */
export class UpdateOrgDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string;

  @IsOptional()
  @IsUrl()
  logo?: string;

  @IsOptional()
  @IsEnum(OrgType)
  orgType?: OrgType;
}

export class InitialDataDto {
  users: UserDto[];
  orgs: OrgDto[];
}

/** Body of `user/revoke` and `user/restore`. */
export class UserIdDto {
  @IsNotEmpty()
  @IsMongoId()
  userId: string;
}

/** Body of `user/update-role`. */
export class UpdateUserRoleDto extends UserIdDto {
  @IsNotEmpty()
  @IsMongoId()
  roleId: string;
}
