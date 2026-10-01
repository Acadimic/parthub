import { IsEmail, IsEnum, IsMongoId, IsNotEmpty, IsOptional, IsString, IsUrl } from 'class-validator';
import { DefaultRole } from '../../../enums/role.enum';

export class RegisterUserDto {
  @IsNotEmpty()
  @IsMongoId()
  _id: string;

  @IsString()
  @IsNotEmpty()
  uid: string;

  @IsString()
  @IsOptional()
  name?: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  /** An https address: an object in the org's S3 folder once uploaded, or the sign-in provider's photo. */
  @IsUrl()
  @IsOptional()
  avatar?: string;

  @IsMongoId()
  @IsNotEmpty()
  org: string;

  @IsEnum(DefaultRole)
  @IsNotEmpty()
  permission: DefaultRole;
}
