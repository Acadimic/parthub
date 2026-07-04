import { PermissionItem } from '../../../enums/permission.enum';
import { IsArray, IsBoolean, IsEnum, IsMongoId, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class RoleDto {
  @IsNotEmpty()
  @IsMongoId()
  _id: string;

  @IsNotEmpty()
  @IsString()
  role: string;

  @IsNotEmpty()
  @IsArray()
  @IsEnum(PermissionItem, { each: true })
  permissions: PermissionItem[];

  @IsOptional()
  @IsBoolean()
  isAdmin?: boolean;
}

export class DeleteRoleDto {
  @IsNotEmpty()
  @IsMongoId()
  _id: string;

  @IsOptional()
  @IsMongoId()
  reassignRoleId?: string;
}
