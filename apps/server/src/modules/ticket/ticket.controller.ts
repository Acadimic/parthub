import { Private } from '@decorators';
import { Permissions } from '@decorators/permissions.decorator';
import { Subdomains } from '@decorators/subdomains.decorator';
import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { PermissionItem, Subdomain } from '@repo/shared/enums';
import {
  RecordRefundDto,
  TicketDto,
  TicketInboxQueryDto,
  TicketReplyDto,
  TicketStatusDto,
} from '@repo/shared/validations';
import { RequestContextService } from '../../context/request-context.service';
import { TicketService } from './ticket.service';

@Controller('ticket')
export class TicketController {
  constructor(
    private readonly ticketService: TicketService,
    private readonly requestContextService: RequestContextService,
  ) {}

  private get staff() {
    return { org: this.requestContextService.getOrgId(), userId: this.requestContextService.getUserId() };
  }

  // ---- Learners, from the learning app ----

  @Post('create')
  @Subdomains(Subdomain.LEARN)
  @Permissions(PermissionItem.MANAGE_TICKET)
  async create(@Body() payload: TicketDto) {
    const { requestContextService } = this;
    return this.ticketService.create(requestContextService.getOrgId(), requestContextService.getUserId(), payload);
  }

  @Get('my')
  @Subdomains(Subdomain.LEARN)
  @Permissions(PermissionItem.MANAGE_TICKET)
  async getMine() {
    return this.ticketService.getMine(this.requestContextService.getUserId());
  }

  @Get('my/unread-count')
  @Subdomains(Subdomain.LEARN)
  @Permissions(PermissionItem.MANAGE_TICKET)
  async getUnreadCount() {
    return this.ticketService.getUnreadCount(this.requestContextService.getUserId());
  }

  @Get('my/:id')
  @Subdomains(Subdomain.LEARN)
  @Permissions(PermissionItem.MANAGE_TICKET)
  async getMineById(@Param('id') id: string) {
    return this.ticketService.getMineById(this.requestContextService.getUserId(), id);
  }

  @Post('my/:id/reply')
  @Subdomains(Subdomain.LEARN)
  @Permissions(PermissionItem.MANAGE_TICKET)
  async replyAsReporter(@Param('id') id: string, @Body() payload: TicketReplyDto) {
    const { org, userId } = this.staff;
    return this.ticketService.replyAsReporter(org, userId, id, payload);
  }

  // ---- The course's organization, from the teaching app ----

  @Get('inbox')
  @Subdomains(Subdomain.TEACH)
  @Permissions(PermissionItem.MANAGE_TICKET)
  async getOwnerInbox(@Query() query: TicketInboxQueryDto) {
    return this.ticketService.getOwnerInbox(this.requestContextService.getOrgId(), query);
  }

  @Get('inbox/count')
  @Subdomains(Subdomain.TEACH)
  @Permissions(PermissionItem.MANAGE_TICKET)
  async getOwnerActiveCount() {
    return this.ticketService.getOwnerActiveCount(this.requestContextService.getOrgId());
  }

  @Get('inbox/:id')
  @Subdomains(Subdomain.TEACH)
  @Permissions(PermissionItem.MANAGE_TICKET)
  async getForOwner(@Param('id') id: string) {
    return this.ticketService.getForOwner(this.requestContextService.getOrgId(), id);
  }

  @Post('inbox/:id/reply')
  @Subdomains(Subdomain.TEACH)
  @Permissions(PermissionItem.MANAGE_TICKET)
  async replyAsOwner(@Param('id') id: string, @Body() payload: TicketReplyDto) {
    const { staff } = this;
    return this.ticketService.replyAsStaff({ kind: 'owner', org: staff.org }, staff, id, payload);
  }

  @Post('inbox/:id/status')
  @Subdomains(Subdomain.TEACH)
  @Permissions(PermissionItem.MANAGE_TICKET)
  async setOwnerStatus(@Param('id') id: string, @Body() payload: TicketStatusDto) {
    const { staff } = this;
    return this.ticketService.setStatus({ kind: 'owner', org: staff.org }, staff.userId, id, payload.status);
  }

  // ---- Platform staff, from the support app. @Private() like every other route that app calls:
  // AuthGuard runs these as the PRIVATE_API_EMAIL service account, so `staff` is that account and
  // the attachments it sends are checked against that account's organization. ----

  @Private()
  @Get('support/inbox')
  async getPlatformInbox(@Query() query: TicketInboxQueryDto) {
    return this.ticketService.getPlatformInbox(query);
  }

  @Private()
  @Get('support/:id')
  async getForPlatform(@Param('id') id: string) {
    return this.ticketService.getForPlatform(id);
  }

  @Private()
  @Post('support/:id/reply')
  async replyAsPlatform(@Param('id') id: string, @Body() payload: TicketReplyDto) {
    return this.ticketService.replyAsStaff({ kind: 'platform' }, this.staff, id, payload);
  }

  @Private()
  @Post('support/:id/status')
  async setPlatformStatus(@Param('id') id: string, @Body() payload: TicketStatusDto) {
    return this.ticketService.setStatus({ kind: 'platform' }, this.staff.userId, id, payload.status);
  }

  @Private()
  @Post('support/:id/refund')
  async recordRefund(@Param('id') id: string, @Body() payload: RecordRefundDto) {
    return this.ticketService.recordRefund(this.staff.userId, id, payload);
  }
}
