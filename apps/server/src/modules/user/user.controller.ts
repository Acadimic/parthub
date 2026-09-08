import { Subdomains } from '@decorators/subdomains.decorator';
import { Permissions } from '@decorators/permissions.decorator';
import { User } from '@decorators/user.decorator';
import { PermissionService } from '@modules/permissions/permission.service';
import { Body, Controller, Get, Post } from '@nestjs/common';
import { PermissionItem, Subdomain } from '@parthhub/shared';
import {
  AcceptInviteDto,
  InitialDataDto,
  UpdateOrgUserDto,
  UpdateProfileDto,
  UserDto,
} from '@parthhub/shared/validations';
import { INITIAL_LOGIN_DATA_URL } from '@utils/constants';
import { UserService } from './user.service';

@Controller('user')
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly permissionService: PermissionService,
  ) {}

  /** First call after Firebase login; registers the account on first use (see UserService.registerUser). */
  @Get(INITIAL_LOGIN_DATA_URL)
  @Permissions()
  async getInitialLoginData(@User() user: UserDto): Promise<InitialDataDto> {
    return await this.userService.getInitialLoginData(user);
  }

  /** The signed-in user completes or edits their own profile. */
  @Post('profile')
  @Permissions()
  async updateProfile(@User() user: UserDto, @Body() body: UpdateProfileDto): Promise<UserDto> {
    return await this.userService.updateProfile(user._id, body);
  }

  /** Staff edits another member of the org (students, collaborators). */
  @Post('update')
  @Subdomains(Subdomain.TEACH)
  @Permissions(PermissionItem.MANAGE_STAFF)
  async updateOrgUser(@Body() body: UpdateOrgUserDto): Promise<UserDto> {
    return await this.userService.updateOrgUser(body);
  }

  @Get('all')
  @Subdomains(Subdomain.TEACH)
  @Permissions(PermissionItem.VIEW_STAFF, PermissionItem.MANAGE_STAFF)
  async getOrgStaff(): Promise<UserDto[]> {
    return await this.userService.getOrgStaff();
  }

  @Post('revoke')
  @Subdomains(Subdomain.TEACH)
  @Permissions(PermissionItem.MANAGE_STAFF)
  async revokeAccess(@Body() body: { userId: string }): Promise<void> {
    await this.userService.revokeAccess(body.userId);
  }

  @Post('restore')
  @Subdomains(Subdomain.TEACH)
  @Permissions(PermissionItem.MANAGE_STAFF)
  async restoreAccess(@Body() body: { userId: string }): Promise<void> {
    await this.userService.restoreAccess(body.userId);
  }

  @Post('update-role')
  @Subdomains(Subdomain.TEACH)
  @Permissions(PermissionItem.MANAGE_STAFF)
  async updateUserRole(@Body() body: { userId: string; roleId: string }): Promise<void> {
    await this.userService.updateUserRole(body.userId, body.roleId);
  }

  @Post('accept-invite')
  @Permissions()
  async acceptInvite(@User() user: UserDto, @Body() body: AcceptInviteDto): Promise<UserDto> {
    return await this.userService.acceptInviteAndJoinOrg(user, body.inviteId);
  }

  @Post('decline-invite')
  @Permissions()
  async declineInvite(@User() user: UserDto, @Body() body: AcceptInviteDto): Promise<void> {
    await this.userService.declineInvite(user, body.inviteId);
  }
}
