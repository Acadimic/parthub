import { IsArray, IsBoolean, IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateFirebaseUserDto {
  @IsString()
  email: string;
}

export class UpdateFirebaseUserDto {
  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  displayName?: string;

  @IsBoolean()
  @IsOptional()
  emailVerified?: boolean;

  @IsArray()
  providersToUnlink?: string[];
}

export class FirebaseUserUpdatePayloadDto {
  @IsString()
  @IsNotEmpty()
  uid: string;

  @IsString()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  name?: string;

  @IsBoolean()
  @IsOptional()
  isEmailVerified?: boolean;
}

export class FirebaseUserDto {
  @IsString()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  uid: string;

  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  phone_number?: string;
}
