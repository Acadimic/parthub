import { IsEmail, IsEnum, IsMongoId, IsNotEmpty, IsOptional, IsString } from 'class-validator';
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

  @IsMongoId()
  @IsNotEmpty()
  org: string;

  @IsEnum(DefaultRole)
  @IsNotEmpty()
  permission: DefaultRole;
}
