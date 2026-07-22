import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateOtpDto {
  @IsNotEmpty()
  @IsString()
  code: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  phoneNumber?: string;
}
