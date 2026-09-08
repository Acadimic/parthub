import { Controller, Get, Post, Body, Delete, Param, HttpStatus } from '@nestjs/common';
import { MeetService } from './meet.service';
import { UpsertMeetDto, GetByMeetIdsDto } from './dto/upsert-meet.dto';
import { RequestContextService } from '../../context/request-context.service';

@Controller('meet')
export class MeetController {
  constructor(
    private readonly meetService: MeetService,
    private readonly requestContextService: RequestContextService,
  ) {}

  @Post('teach/upsert')
  async upsertMeet(@Body() payload: UpsertMeetDto) {
    const userId = this.requestContextService.getUserId();
    const org = this.requestContextService.getOrgId();
    const data = await this.meetService.upsert(userId, org, payload);
    return { data, status: HttpStatus.OK };
  }

  @Get('teach/all')
  async getOrgMeets() {
    const org = this.requestContextService.getOrgId();
    const data = await this.meetService.getByOrg(org);
    return { data, status: HttpStatus.OK };
  }

  @Post('teach/add-attendees/:meetId')
  async addAttendees(@Param('meetId') meetId: string, @Body() body: { attendeeIds: string[] }) {
    const data = await this.meetService.addAttendees(meetId, body.attendeeIds);
    return { data, status: HttpStatus.OK };
  }

  @Post('teach/remove-attendees/:meetId')
  async removeAttendees(@Param('meetId') meetId: string, @Body() body: { attendeeIds: string[] }) {
    const data = await this.meetService.removeAttendees(meetId, body.attendeeIds);
    return { data, status: HttpStatus.OK };
  }

  @Delete('teach/:meetId')
  async deleteMeet(@Param('meetId') meetId: string) {
    const data = await this.meetService.delete(meetId);
    return { data, status: HttpStatus.OK };
  }

  @Get('learn/all')
  async getMyMeets() {
    const userId = this.requestContextService.getUserId();
    const data = await this.meetService.getByAttendee(userId);
    return { data, status: HttpStatus.OK };
  }

  @Post('learn/by-ids')
  async getMeetsByIds(@Body() payload: GetByMeetIdsDto) {
    const data = await this.meetService.getMeetsByIds(payload.ids);
    return { data, status: HttpStatus.OK };
  }
}
