import { InviteStatus } from '../../../enums/invite.enum';
import { DefaultRole } from '../../../enums/role.enum';
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
  @IsEnum(DefaultRole)
  permission: DefaultRole;

  @IsOptional()
  @IsString()
  orgName?: string;
}

export class AcceptInviteDto {
  @IsNotEmpty()
  @IsMongoId()
  inviteId: string;
}
