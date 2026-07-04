import { InviteStatus } from '../../../enums/invite.enum';
import { IsEnum, IsMongoId, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class InviteLookupDto {
  @IsNotEmpty()
  @IsMongoId()
  _id: string;

  @IsNotEmpty()
  @IsString()
  email: string;

  @IsNotEmpty()
  @IsEnum(InviteStatus)
  status: InviteStatus;

  @IsNotEmpty()
  @IsString()
  roleName: string;

  @IsOptional()
  @IsString()
  orgName?: string;
}

export class AcceptInviteDto {
  @IsNotEmpty()
  @IsMongoId()
  inviteId: string;
}
