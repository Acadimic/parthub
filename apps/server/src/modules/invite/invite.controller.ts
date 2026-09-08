import { Subdomains } from '@decorators/subdomains.decorator';
import { Permissions } from '@decorators/permissions.decorator';
import { Public } from '@decorators/public.decorator';
import { PermissionService } from '@modules/permissions/permission.service';
import { Body, Controller, Get, Param, ParseArrayPipe, Post } from '@nestjs/common';
import { PermissionItem, Subdomain } from '@repo/shared';
import { InviteLookupDto, InviteDto, InviteUserDto } from '@repo/shared/validations';
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
  @Subdomains(Subdomain.TEACH)
  @Permissions(PermissionItem.MANAGE_STAFF)
  async upsertInvite(
    @Body(new ParseArrayPipe({ items: InviteUserDto })) payloads: InviteUserDto[],
  ): Promise<InviteDto[]> {
    return await this.inviteService.upsertBulk(payloads);
  }

  @Post('/all')
  @Subdomains(Subdomain.TEACH)
  @Permissions(PermissionItem.MANAGE_STAFF, PermissionItem.VIEW_STAFF)
  async getInvites(): Promise<InviteDto[]> {
    return await this.inviteService.getInvites();
  }

  @Post('/delete')
  @Subdomains(Subdomain.TEACH)
  @Permissions(PermissionItem.MANAGE_STAFF)
  async deleteInvite(@Body() body: { inviteId: string }): Promise<void> {
    await this.inviteService.deleteInvite(body.inviteId);
  }

  @Post('/resend')
  @Subdomains(Subdomain.TEACH)
  @Permissions(PermissionItem.MANAGE_STAFF)
  async resendInvite(@Body() body: { inviteId: string }): Promise<InviteDto> {
    return await this.inviteService.resendInvite(body.inviteId);
  }
}
