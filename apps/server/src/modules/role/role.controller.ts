import { Permissions } from '@decorators/permissions.decorator';
import { PermissionService } from '@modules/permissions/permission.service';
import { Body, Controller, ParseArrayPipe, Post } from '@nestjs/common';
import { PermissionItem } from '@repo/shared/enums';
import { DeleteRoleDto, RoleDto } from '@repo/shared/validations';
import { RoleService } from './role.service';

@Controller('role')
export class RoleController {
  constructor(
    private readonly roleService: RoleService,
    private readonly permissionService: PermissionService,
  ) {}

  @Post('/bulk/upsert')
  @Permissions(PermissionItem.EDIT_ROLE)
  async upsertRole(
    @Body(new ParseArrayPipe({ items: RoleDto, whitelist: true, forbidNonWhitelisted: true }))
    payloads: RoleDto[],
  ): Promise<RoleDto[]> {
    return await this.roleService.upsertBulk(payloads);
  }

  @Post('/all')
  @Permissions(PermissionItem.VIEW_ROLE)
  async getRoles(): Promise<RoleDto[]> {
    return await this.roleService.getRoles();
  }

  @Post('/delete')
  @Permissions(PermissionItem.DELETE_ROLE)
  async deleteRole(@Body() payload: DeleteRoleDto): Promise<void> {
    return await this.roleService.deleteRole(payload);
  }
}
