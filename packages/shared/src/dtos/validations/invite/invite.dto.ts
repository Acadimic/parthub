import { InviteStatus } from '../../../enums/invite.enum';
import { DefaultRole } from '../../../enums/role.enum';
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
  @IsEnum(DefaultRole)
  permission: DefaultRole;
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
  @IsEnum(DefaultRole)
  permission: DefaultRole;

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

/** Body of `invite/delete` and `invite/resend`. */
export class InviteIdDto {
  @IsNotEmpty()
  @IsMongoId()
  inviteId: string;
}
