import { PermissionService } from '@modules/permissions/permission.service';
import { Body, Controller, ParseArrayPipe, Post } from '@nestjs/common';
import { PermissionItem } from '@parthhub/shared';
import { DeleteRoleDto, RoleDto } from '@parthhub/shared/validations';
import { RoleService } from './role.service';

@Controller('role')
export class RoleController {
  constructor(
    private readonly roleService: RoleService,
    private readonly permissionService: PermissionService,
  ) {}

  @Post('/bulk/upsert')
  async upsertRole(@Body(new ParseArrayPipe({ items: RoleDto })) payloads: RoleDto[]): Promise<RoleDto[]> {
    await this.permissionService.requireAny([PermissionItem.EDIT_ROLE]);
    return await this.roleService.upsertBulk(payloads);
  }

  @Post('/all')
  async getRoles(): Promise<RoleDto[]> {
    await this.permissionService.requireAny([PermissionItem.VIEW_ROLE]);
    return await this.roleService.getRoles();
  }

  @Post('/delete')
  async deleteRole(@Body() payload: DeleteRoleDto): Promise<void> {
    await this.permissionService.requireAny([PermissionItem.DELETE_ROLE]);
    return await this.roleService.deleteRole(payload);
  }
}
