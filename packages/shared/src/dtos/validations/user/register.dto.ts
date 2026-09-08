import { IsEmail, IsMongoId, IsNotEmpty, IsOptional, IsString } from 'class-validator';

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
}
