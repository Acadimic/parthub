import { Public } from '@decorators/public.decorator';
import { PermissionService } from '@modules/permissions/permission.service';
import { Body, Controller, Get, Param, ParseArrayPipe, Post } from '@nestjs/common';
import { PermissionItem } from '@parthhub/shared';
import { InviteLookupDto, InviteDto, InviteUserDto } from '@parthhub/shared/dist/dtos/validations';
import { InviteService } from './invite.service';

@Controller('invite')
export class InviteController {
  constructor(
    private readonly inviteService: InviteService,
    private readonly permissionService: PermissionService,
  ) {}

  @Public()
  @Get('/lookup/:inviteId')
  async lookupInvite(@Param('inviteId') inviteId: string): Promise<InviteLookupDto> {
    return await this.inviteService.lookupInvite(inviteId);
  }

  @Post('/bulk/upsert')
  async upsertInvite(@Body(new ParseArrayPipe({ items: InviteUserDto })) payloads: InviteUserDto[]): Promise<InviteDto[]> {
    await this.permissionService.requireAny([PermissionItem.MANAGE_STAFF]);
    return await this.inviteService.upsertBulk(payloads);
  }

  @Post('/all')
  async getInvites(): Promise<InviteDto[]> {
    await this.permissionService.requireAny([PermissionItem.MANAGE_STAFF, PermissionItem.VIEW_STAFF]);
    return await this.inviteService.getInvites();
  }

  @Post('/delete')
  async deleteInvite(@Body() body: { inviteId: string }): Promise<void> {
    await this.permissionService.requireAny([PermissionItem.MANAGE_STAFF]);
    await this.inviteService.deleteInvite(body.inviteId);
  }

  @Post('/resend')
  async resendInvite(@Body() body: { inviteId: string }): Promise<InviteDto> {
    await this.permissionService.requireAny([PermissionItem.MANAGE_STAFF]);
    return await this.inviteService.resendInvite(body.inviteId);
  }
}
