import { User } from '@decorators/user.decorator';
import { PermissionService } from '@modules/permissions/permission.service';
import { Body, Controller, Get, Post } from '@nestjs/common';
import { PermissionItem } from '@parthhub/shared';
import { AcceptInviteDto, InitialDataDto, UserDto } from '@parthhub/shared/validations';
import { INITIAL_LOGIN_DATA_URL } from '@utils/constants';
import { UserService } from './user.service';

@Controller('user')
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly permissionService: PermissionService,
  ) {}

  @Get(INITIAL_LOGIN_DATA_URL)
  async getInitialLoginData(@User() user: UserDto): Promise<InitialDataDto> {
    return await this.userService.getInitialLoginData(user);
  }

  @Post('/all')
  async getOrgStaff(): Promise<UserDto[]> {
    await this.permissionService.requireAny([PermissionItem.VIEW_STAFF, PermissionItem.MANAGE_STAFF]);
    return await this.userService.getOrgStaff();
  }

  @Post('/revoke')
  async revokeAccess(@Body() body: { userId: string }): Promise<void> {
    await this.permissionService.requireAny([PermissionItem.MANAGE_STAFF]);
    await this.userService.revokeAccess(body.userId);
  }

  @Post('/restore')
  async restoreAccess(@Body() body: { userId: string }): Promise<void> {
    await this.permissionService.requireAny([PermissionItem.MANAGE_STAFF]);
    await this.userService.restoreAccess(body.userId);
  }

  @Post('/update-role')
  async updateUserRole(@Body() body: { userId: string; roleId: string }): Promise<void> {
    await this.permissionService.requireAny([PermissionItem.MANAGE_STAFF]);
    await this.userService.updateUserRole(body.userId, body.roleId);
  }

  @Post('/accept-invite')
  async acceptInvite(@User() user: UserDto, @Body() body: AcceptInviteDto): Promise<UserDto> {
    return await this.userService.acceptInviteAndJoinOrg(user, body.inviteId);
  }

  @Post('/decline-invite')
  async declineInvite(@User() user: UserDto, @Body() body: AcceptInviteDto): Promise<void> {
    await this.userService.declineInvite(user, body.inviteId);
  }
}
