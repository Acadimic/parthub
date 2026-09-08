import { PermissionItem, Subdomain } from '@repo/shared';
import { Subdomains } from '@decorators/subdomains.decorator';
import { Permissions } from '@decorators/permissions.decorator';
import { Controller, Get, Post, Body, Delete, Param, HttpStatus } from '@nestjs/common';
import { MeetService } from './meet.service';
import { MeetDto, GetByMeetIdsDto } from '@repo/shared/validations';
import { RequestContextService } from '../../context/request-context.service';

@Controller('meet')
export class MeetController {
  constructor(
    private readonly meetService: MeetService,
    private readonly requestContextService: RequestContextService,
  ) {}

  @Post('upsert')
  @Subdomains(Subdomain.TEACH)
  @Permissions(PermissionItem.MANAGE_MEET)
  async upsertMeet(@Body() payload: MeetDto) {
    const org = this.requestContextService.getOrgId();
    const data = await this.meetService.upsert(org, payload);
    return data;
  }

  @Get('all')
  @Subdomains(Subdomain.TEACH)
  @Permissions(PermissionItem.VIEW_MEET)
  async getOrgMeets() {
    const org = this.requestContextService.getOrgId();
    const data = await this.meetService.getByOrg(org);
    return data;
  }

  @Post('add-attendees/:meetId')
  @Subdomains(Subdomain.TEACH)
  @Permissions(PermissionItem.MANAGE_MEET)
  async addAttendees(@Param('meetId') meetId: string, @Body() body: { attendeeIds: string[] }) {
    const data = await this.meetService.addAttendees(this.requestContextService.getOrgId(), meetId, body.attendeeIds);
    return data;
  }

  @Post('remove-attendees/:meetId')
  @Subdomains(Subdomain.TEACH)
  @Permissions(PermissionItem.MANAGE_MEET)
  async removeAttendees(@Param('meetId') meetId: string, @Body() body: { attendeeIds: string[] }) {
    const data = await this.meetService.removeAttendees(
      this.requestContextService.getOrgId(),
      meetId,
      body.attendeeIds,
    );
    return data;
  }

  @Delete(':meetId')
  @Subdomains(Subdomain.TEACH)
  @Permissions(PermissionItem.MANAGE_MEET)
  async deleteMeet(@Param('meetId') meetId: string) {
    const data = await this.meetService.delete(this.requestContextService.getOrgId(), meetId);
    return data;
  }

  @Get('my')
  @Subdomains(Subdomain.LEARN)
  @Permissions(PermissionItem.VIEW_MEET)
  async getMyMeets() {
    const userId = this.requestContextService.getUserId();
    const data = await this.meetService.getByAttendee(userId);
    return data;
  }

  @Post('by-ids')
  @Subdomains(Subdomain.LEARN)
  @Permissions(PermissionItem.VIEW_MEET)
  async getMeetsByIds(@Body() payload: GetByMeetIdsDto) {
    const data = await this.meetService.getMeetsByIds(payload.ids);
    return data;
  }
}
