import { InviteStatus } from '../../../enums/invite.enum';
import { Transform } from 'class-transformer';
import { IsEnum, IsMongoId, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class InviteUserDto {
  @IsNotEmpty()
  @IsMongoId()
  _id: string;

  @IsOptional()
  @IsString()
  name?: string;

  @Transform(({ value }) => value.trim().toLowerCase())
  @IsNotEmpty()
  @IsString()
  email: string;

  @IsNotEmpty()
  @IsString()
  role: string;
}

export class InviteDto {
  @IsNotEmpty()
  @IsMongoId()
  _id: string;

  @IsOptional()
  @IsString()
  name?: string;

  @Transform(({ value }) => value.trim().toLowerCase())
  @IsNotEmpty()
  @IsString()
  email: string;

  @IsNotEmpty()
  @IsString()
  role: string;

  @IsNotEmpty()
  @IsMongoId()
  invitedBy: string;

  @IsNotEmpty()
  @IsEnum(InviteStatus)
  status: InviteStatus;

  @IsOptional()
  @IsNotEmpty()
  acceptedDate?: string;
}
